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

    // ====================================================================
    // STEP 1: SCAN THE UPLOADED PHOTO WITH A VISION MODEL
    // ====================================================================
    console.log("Backend Step 1: Scanning photo to extract features...");
    
    // Using LLaVA, a fast and cheap vision model on Replicate
    const visionOutput = await replicate.run(
      "yorickvp/llava-13b:b5f621affc3e4f0b6c7023c1422709292b1e7c4f0b07c2ee7a9657b0bfa1503c",
      {
        input: {
          image: image,
          prompt: "Describe the person's face in this photo accurately but concisely. Include gender, approximate age, hair color/style, facial hair, skin tone, and accessories like glasses or hats. Write it as a single short sentence."
        }
      }
    );

    // LLaVA returns an array of text chunks, we join them into one string
    const personDescription = visionOutput.join("").trim();
    console.log(`Backend Step 1 Complete. Extracted features: "${personDescription}"`);


    // ====================================================================
    // STEP 2: GENERATE THE PIXAR AVATAR USING THE EXTRACTED FEATURES
    // ====================================================================
    console.log("Backend Step 2: Generating Pixar 3D Avatar...");

    // Using Instant-ID and injecting the description directly into the prompt
    const prediction = await replicate.predictions.create({
      version: "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      input: {
        image: image,
        // THE MAGIC: Injecting the vision description into the prompt
        prompt: `A highly detailed, modern Pixar-style 3D animated character portrait of ${personDescription}. The face must have the exact facial likeness, identifiable features, and recognizable expression of the reference photo. Adorable, smooth subsurface scattering skin, Octane render, cinematic lighting, vibrant saturated colors. Masterpiece, 8k resolution, clear focus. Background is a ${backgroundStyle}, soft and blurred bokeh.`,
        
        negative_prompt: "raw photography, realistic, ugly, deformed face, creepy eyes, blemish, acne, different identity, wrong gender, 2D, flat, cartoon vector, bedazzled, bad anatomy",
        
        // Strict adherence to the prompt and image
        guidance_scale: 8, 
        ip_adapter_scale: 0.7, 
        controlnet_conditioning_scale: 0.7 
      }
    });

    // Send the Prediction ID back to the frontend so it can poll for the result
    return res.status(200).json({ predictionId: prediction.id });

  } catch (error) {
    console.error("Critical Backend AI Error:", error);
    return res.status(500).json({ 
      error: 'AI Generation failed.',
      details: error.message 
    });
  }
}
