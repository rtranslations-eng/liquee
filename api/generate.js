export const maxDuration = 60; 
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'API key missing.' });

  const { image, backgroundStyle } = req.body;
  if (!image) return res.status(400).json({ error: 'Image required.' });

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    
    console.log("Backend: Using SDXL DEPTH to stop the melting...");

    const output = await replicate.run(
      "replicate/depth-to-image-sdxl:acba9ca5e0c5f465c407d7211a7c36a3e639a667b938f3258c70d440d9955743",
      {
        input: {
          image: image,
          // Explicitly demanding a man with a hat and sunglasses, forcing clean textures.
          prompt: `A cute, high-quality, modern Pixar animated movie character portrait of a handsome man with a beard, wearing a hat and sunglasses. 3D render, flawless subsurface scattering skin, glowing expressive eyes, Octane render, cinematic lighting, vibrant saturated colors, 8k resolution, clear focus. Background is a ${backgroundStyle || 'soft pastel gradient'}.`,
          
          // Aggressive negative prompt against mutations
          negative_prompt: "raw photography, realistic, noise, splotches, artifacts, blurry, bad anatomy, deformed face, generic features, ugly, mutated, melting, deformed, puppyslug",
          
          // 0.65 allows it to change the texture to plastic without losing your hat's shape
          prompt_strength: 0.65, 
          
          // 0.9 forces it to build a strict 3D mold of your photo so nothing melts out of place
          control_depth_strength: 0.9,
          
          num_inference_steps: 30
        }
      }
    );

    return res.status(200).json({ imageUrl: output[0] });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: 'AI Generation failed.', details: error.message });
  }
}
