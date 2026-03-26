import Replicate from "replicate";

export default async function handler(req, res) {
  // 1. Only allow POST requests (sending data)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // 2. Ensure your secret API key exists in the environment
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Security Error: REPLICATE_API_TOKEN is not defined on Vercel.");
    return res.status(500).json({ error: 'Server configuration error. API key missing.' });
  }

  // 3. Parse the data sent from the index.html page
  const { image, style } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'A reference image is required.' });
  }

  try {
    // 4. Initialize the Replicate client securely using your secret key
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log("Backend: Attempting AI generation with model...");

    // 5. CALL THE REPLICATE AI MODEL (Face-to-Many specialized SDXL model)
    // Model used: fofr/face-to-many 
    // This model uses an IP-Adapter (face guide) and ControlNet to preserve identity.
    const output = await replicate.run(
      "fofr/face-to-many:a81f9643477144e5d321f66da5e40733d0628e9323380026e63ee9a904a29a39",
      {
        input: {
          image: image, // Your base64 reference photo
          prompt: `Highly detailed professional portrait of a person in a minimalist style, matching ${style}, 8k, photorealistic, cinematic lighting, sharp face details, identical identity to reference image`,
          negative_prompt: "bad quality, blurry, deformed face, distorted eyes, mutation, extra fingers, cartoon style unless specified",
          number_of_outputs: 1,
          preserve_face: true, // Tell the model identity preservation is priority #1
        }
      }
    );

    // 6. Handle the AI output
    if (!output || output.length === 0) {
      throw new Error("Replicate model did not return any output.");
    }

    const imageUrl = output[0]; // The resulting AI-generated URL
    console.log(`Backend: AI Image generated successfully: ${imageUrl}`);

    // 7. Send the successful result URL back to your index.html page
    return res.status(200).json({ imageUrl: imageUrl });

  } catch (error) {
    console.error("Critical Backend AI Error:", error);
    return res.status(500).json({ 
      error: 'AI Generation failed.',
      details: error.message 
    });
  }
}
