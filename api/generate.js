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

    console.log("Backend: Generating Pixar 3D style with identity preservation...");

    const output = await replicate.run(
      "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      {
        input: {
          image: image,
          // Removed "caricature". Emphasizing smooth Pixar 3D while keeping likeness.
          prompt: `A cute, high-quality 3D animated character portrait of this exact person, ${style}. In the exact style of modern Pixar and Disney 3D animated movies. Smooth subsurface scattering skin, highly detailed, vibrant colors, soft studio lighting. The face must retain the exact identity, likeness, and features of the reference photo, but rendered cleanly as a beautiful 3D animation.`,
          
          // Added "caricature" to the negative prompt to prevent the exaggerated distortion
          negative_prompt: "caricature, ugly, deformed, photorealistic, raw photography, 2D, flat, illustration, scary, creepy, generic face",
          
          // Balanced scales: high enough to keep your face, low enough to let the 3D texture work
          ip_adapter_scale: 0.65, 
          controlnet_conditioning_scale: 0.7, 
          guidance_scale: 6
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
