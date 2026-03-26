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

    console.log("Backend: Attempting 3D Stylized Instant-ID generation...");

    // Using the ultra-reliable instant-id model, tuned for 3D animation
    const output = await replicate.run(
      "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      {
        input: {
          image: image,
          prompt: `A masterpiece 3D animated character portrait of a person, ${style}, in the style of modern Pixar and Disney 3D animation movies. Adorable, smooth subsurface scattering skin, highly stylized 3D render, octane render, vibrant colors, creamy background bokeh, clear focus. Exact facial likeness preserved in 3D.`,
          negative_prompt: "photorealistic, realism, raw photo, actual human skin, ugly, 2D, flat, illustration, drawing, painting, blurry, deformed face, creepy",
          
          // THE SECRET SAUCE:
          // Lowering the adapter scale prevents the AI from forcing real human skin textures,
          // allowing the 3D Pixar style to successfully take over the face!
          ip_adapter_scale: 0.45, 
          controlnet_conditioning_scale: 0.6,
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
