export const maxDuration = 60;
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error. API key missing.' });
  }

  const { image, backgroundStyle } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'A reference image is required.' });
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log("Backend: Attempting fofr/face-to-many 3D generation...");

    // Using fofr/face-to-many - the absolute best model for converting faces to 3D/Pixar styles.
    const output = await replicate.run(
      "fofr/face-to-many",
      {
        input: {
          image: image,
          style: "3D",
          prompt: `A simple, clean 3D character portrait in modern Pixar style, nice sharp features, highly detailed. The background is a clean ${backgroundStyle || 'soft pastel gradient'}, studio lighting.`,
          negative_prompt: "photorealistic, ugly, messy, dirty, complex background, text, artifacts, deformed",
          prompt_strength: 7, 
          denoising_strength: 0.65, 
          instant_id_strength: 0.8
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
