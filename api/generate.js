export const maxDuration = 60; 
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Security Error: REPLICATE_API_TOKEN is missing.");
    return res.status(500).json({ error: 'Server configuration error. API key missing.' });
  }

  const { image, style } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'A reference image is required.' });
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log("Backend: Attempting PhotoMaker 3D generation...");

    // Using PhotoMaker, which is cheaper, faster, and perfect for 3D/Cartoon styles
    const output = await replicate.run(
      "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
      {
        input: {
          input_image: image,
          // 'img person' is required by PhotoMaker to trigger your face
          prompt: `A cute 3D animation character of a img person, ${style}, in the style of modern 3D animated movies, smooth rendering, octane render, highly detailed, vibrant colors, clear focus, adorable`,
          negative_prompt: "realistic, photorealistic, ugly, deformed, noisy, blurry, low contrast, bad anatomy, flat, 2D",
          // PhotoMaker has a specific built-in style for this! 
          // (Note: 'Charactor' is intentionally misspelled, it's a quirk in their official API)
          style_name: "Disney Charactor", 
          num_steps: 25, // Lower steps = faster and cheaper
          guidance_scale: 5,
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
