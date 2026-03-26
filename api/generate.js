import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Security Error: REPLICATE_API_TOKEN is not defined on Vercel.");
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

    console.log("Backend: Attempting AI generation with Instant-ID model...");

    // Using the latest version of zsxkib/instant-id
    const output = await replicate.run(
      "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      {
        input: {
          image: image,
          prompt: `A highly detailed professional portrait, ${style}, masterpiece, 8k resolution, photorealistic, sharp face details`,
          negative_prompt: "bad quality, blurry, deformed face, distorted eyes, mutation, extra fingers, poorly drawn, cartoonish, low resolution",
          sdxl_weights: "stable-diffusion-xl-base-1.0",
          guidance_scale: 5,
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8
        }
      }
    );

    if (!output || output.length === 0) {
      throw new Error("Replicate model did not return any output.");
    }

    // Instant-ID returns an array of generated image URLs
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
