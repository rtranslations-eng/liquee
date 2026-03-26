export const maxDuration = 60; // Max allowed for Vercel Hobby plan
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Ensure your secret API key exists in the environment
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Security Error: REPLICATE_API_TOKEN is not defined on Vercel.");
    return res.status(500).json({ error: 'Server configuration error. API key missing.' });
  }

  // Parse the data sent from the index.html page
  const { image, backgroundStyle } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'A reference image is required.' });
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log("Backend: Attempting PhotoMaker V2 generation...");

    // Using the superior tencentarc/photomaker-v2 model (Public version as of 2026)
    // Model hash: tencentarc/photomaker-v2:635ced2c444445582f6e917d095914c62b489a54b9f2e3250e7b8c751a021577
    const output = await replicate.run(
      "tencentarc/photomaker-v2:635ced2c444445582f6e917d095914c62b489a54b9f2e3250e7b8c751a021577",
      {
        input: {
          input_image: image, // Your base64 photo
          // 'photo person' is required by V2 to trigger identity preservation
          prompt: `A cute, modern Pixar-style 3D animated character portrait of photo person, adorable and expressive. Simple clean rendering, high detailed masterpiece. Face must have the exact facial likeness and recognizable features of the reference photo, but with nice sharp character features and clean definition. The background is a ${backgroundStyle}, soft and blurred bokeh. Soft cinematic studio lighting, vibrant colors. Octane render, high resolution, clear focus.`,
          
          // Strict negative prompt to force your conditions
          negative_prompt: "raw photography, realistic, noisy, blurry, different identity, generic face, caricature, bedazzled, ugly, low contrast, 2D, flat color, complex background.",
          
          num_steps: 25, // Optimized speed/cost for V2
          guidance_scale: 7,
          num_outputs: 1
        }
      }
    );

    if (!output || output.length === 0) {
      throw new Error("Replicate model did not return any output.");
    }

    const imageUrl = output[0]; 
    console.log(`Backend: AI Image generated successfully: ${imageUrl}`);

    return res.status(200).json({ imageUrl: imageUrl });

  } catch (error) {
    console.error("Critical Backend AI Error:", error);
    return res.status(500).json({ 
      error: 'AI Generation failed.',
      details: error.message 
    });
  }
}
