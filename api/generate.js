export const maxDuration = 60; 
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Security Error: REPLICATE_API_TOKEN is missing.");
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // Grabbing the image and the pastel background choice from your frontend
  const { image, backgroundStyle } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'A reference image is required.' });
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log("Backend: Attempting official PhotoMaker Style generation...");

    // The correct, stable model for stylization
    const output = await replicate.run(
      "tencentarc/photomaker-style:467d062309da518648ba89d226490e02b8ed09b5abc15026e54e31c5a8cd0769",
      {
        input: {
          input_image: image,
          // 'img' is the strict trigger word required by this model
          prompt: `A beautiful 3D animation of a person img, adorable and expressive. Simple clean rendering, high detailed masterpiece, nice sharp character features, clean definition. The background is a ${backgroundStyle || 'soft pastel gradient'}. Soft cinematic studio lighting, vibrant colors. Octane render, clear focus.`,
          negative_prompt: "raw photography, realistic, noisy, blurry, different identity, generic face, caricature, bedazzled, ugly, low contrast, 2D, flat color, complex background",
          
          // Built-in Pixar/Disney style trigger
          style_name: "Disney Charactor", 
          
          // Pushing this to 35 (out of 50) forces the clean cartoon style over raw photography
          style_strength_ratio: 35, 
          num_steps: 30,
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
