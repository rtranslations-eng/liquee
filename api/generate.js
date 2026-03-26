export const maxDuration = 60; // Max allowed for Vercel Hobby plan
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

    console.log("Backend: Bypassing sunglasses occlusion with fofr/face-to-many...");

    // The EXACT, foolproof version hash and corrected parameters
    const output = await replicate.run(
      "fofr/face-to-many:a07f252abbbd832009640b27f063ea52d87d7a23a185ca165bec23b5adc8deaf",
      {
        input: {
          image: image,
          style: "3D", 
          prompt: `A cute 3D animated character portrait of a person, ${backgroundStyle || "soft pastel background"}. High quality, sharp features, clear focus, octane render.`,
          negative_prompt: "wrong gender, feminine, realistic, photorealistic, ugly, deformed, flat",
          
          // FIXED: 0.65 is the optimal setting to keep your exact shapes (hat/glasses) while applying the 3D style.
          denoising_strength: 0.65,
          
          // FIXED: Prompt strength (CFG). My previous 0.65 broke the model. 4.5 is the correct baseline.
          prompt_strength: 4.5,
          
          // High depth control forces the AI to trace the physical shapes in your photo, ignoring eye-tracking failures.
          control_depth_strength: 0.9,
          instant_id_strength: 1.0
        }
      }
    );

    if (!output || output.length === 0) {
        throw new Error("Generation failed to return an image.");
    }

    // fofr/face-to-many returns an array of image URLs, we grab the first one
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
