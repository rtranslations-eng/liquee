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

    console.log("Backend: Bypassing sunglasses occlusion with face-to-many...");

    // Using fofr/face-to-many. This model traces physical shapes, ignoring eye-tracking failures.
    const output = await replicate.run(
      "fofr/face-to-many",
      {
        input: {
          image: image,
          // '3D' is a hardcoded style trigger in this specific model that nails the Pixar look
          style: "3D", 
          prompt: `A highly detailed 3D animated portrait of this exact person. ${backgroundStyle || "soft pastel gradient background"}. High quality, sharp features, clear focus, octane render.`,
          negative_prompt: "wrong gender, feminine, generic face, completely different person, photorealistic, ugly, deformed, flat",
          // Prompt strength controls how much it changes the image. 
          // 0.65 is the sweet spot: high enough to make it 3D, low enough to keep your exact jawline and sunglasses.
          prompt_strength: 0.65,
          denoising_strength: 0.65
        }
      }
    );

    if (!output || output.length === 0) {
        throw new Error("Generation failed to return an image.");
    }

    // face-to-many returns an array, we grab the first URL
    const imageUrl = Array.isArray(output) ? output[0] : output;
    console.log("Backend complete. Sending image.");
    
    return res.status(200).json({ imageUrl: imageUrl });

  } catch (error) {
    console.error("Critical Backend AI Error:", error);
    return res.status(500).json({ 
      error: 'AI Generation failed.',
      details: error.message 
    });
  }
}
