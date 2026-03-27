export const maxDuration = 60; 
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'API key missing.' });

  const { image, backgroundStyle } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required.' });

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    
    console.log("Backend: Using SDXL with the Perfect Prompt and Auto-Upscaled Image...");

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          image: image,
          
          // THE PERFECT PROMPT: High detail, specific accessories, and octane render
          prompt: `A cute, flawless 3D animated Pixar movie character portrait of a handsome young man wearing a black "Obey" baseball cap and tortoiseshell sunglasses with a short beard. Smooth plastic subsurface scattering skin, cute 3D render, octane render, vivid colors. Background: ${backgroundStyle || "soft pastel gradient"}. Masterpiece, highly detailed, clean lines.`,
          
          negative_prompt: "photorealistic, actual photography, ugly, female, girl, woman, wrong gender, deformed, noisy, splotchy, glitchy, messy textures, real skin, blemishes, text issues",
          
          // 0.75 lets the AI paint those clean 3D textures over your upscaled image
          prompt_strength: 0.75, 
          
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
