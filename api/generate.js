export const maxDuration = 60; 
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'API key missing.' });

  const { image, backgroundStyle } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required.' });

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    
    // THIS LOG WILL PROVE WE ARE ON THE NEW VERSION
    console.log("RUNNING NEW SDXL CODE - VERSION 10");

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          image: image,
          // Explicitly demanding a man with a hat and sunglasses. 
          prompt: `A 3D animated Pixar movie character portrait of a handsome man wearing a hat and sunglasses. Smooth subsurface scattering skin, cute 3D render, octane render, vivid colors. Background: ${backgroundStyle || "soft pastel gradient"}. Masterpiece, highly detailed.`,
          negative_prompt: "photorealistic, actual photography, ugly, female, girl, woman, wrong gender, deformed, noisy",
          prompt_strength: 0.55, // Traces your exact photo layout
          num_outputs: 1,
          scheduler: "K_EULER",
          guidance_scale: 7.5
        }
      }
    );

    return res.status(200).json({ imageUrl: output[0] });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: 'AI Generation failed.', details: error.message });
  }
}
