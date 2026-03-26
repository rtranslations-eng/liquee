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

    console.log("Backend: Attempting identity-focused PhotoMaker V2 generation...");

    // Using the superior adirik/photomaker-v2 model for perfect identity preservation
    // Model hash: adirik/photomaker-v2:adeb44e05b3833b37996c9c6145396557876a911739c381c8b919d7095b58c53
    const output = await replicate.run(
      "adirik/photomaker-v2:adeb44e05b3833b37996c9c6145396557876a911739c381c8b919d7095b58c53",
      {
        input: {
          input_image: image,
          // 'photo person' is required by V2 to trigger identity preservation
          // Notice we now ask for 'recognizable caricature' and 'exact facial details'
          prompt: `A high quality, recognizable caricature 3D animated character portrait of photo person. The face must have the exact facial details, features, and recognizable expression of the reference photo. Modern 3D movie rendering style, inspired by Pixar and Disney animation. Smooth subsurface scattering skin, Octane render, cinematic lighting, vibrant saturated colors, masterpiece, 8k resolution, clear focus, background is abstract creamy bokeh.`,
          negative_prompt: "raw photography, realistic, noisy, blurry, generic face, different identity, 2D, ugly, cartoon vector, bad anatomy, deformed.",
          
          num_steps: 25, // Lower steps are faster and often preserve identity better with this model
          guidance_scale: 7, // A higher guidance tells the AI to stick strictly to the prompt
          num_outputs: 1
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
