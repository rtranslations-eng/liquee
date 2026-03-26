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

    console.log("Backend: Attempting identity-first 3D Avatar generation...");

    // Using the ultra-reliable instant-id model, tuned for identity preservation
    const output = await replicate.run(
      "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      {
        input: {
          image: image,
          // THE KEY: Notice how the prompt now explicitly demands facial likeness
          prompt: `A highly detailed, recognizable caricature 3D animated character portrait, based on the specific person in the photo. Composition and likeness must be preserved exactly, with the specific facial geometry and unique features of the reference. Modern 3D movie rendering style, inspired by Pixar and Disney animation. Smooth subsurface scattering skin, glowing expressive eyes, Octane render, cinematic lighting, vibrant saturated colors, masterpiece, 8k resolution, clear focus, background is abstract creamy bokeh.`,
          
          // STRICTER NEGATIVE PROMPT:
          negative_prompt: "photorealistic, standard photography, blemish, generic face, different identity, 2D, flat, illustration, drawing, painting, blurry, deformed, creepy",
          
          // FINE-TUNING FOR IDENTITY:
          // A higher guidance scale tells the AI to stick strictly to the prompt details
          guidance_scale: 8, 
          ip_adapter_scale: 0.8, // Crucial for direct likeness
          controlnet_conditioning_scale: 0.8 // Holds the exact facial structure
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
