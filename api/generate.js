export const maxDuration = 60; // Max allowed for Vercel Hobby plan
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Ensure your secret API key exists in the environment
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Security Error: REPLICATE_API_TOKEN is not defined on Vercel.");
    return res.status(500).json({ error: 'Server configuration error. API key missing.' });
  }

  // Parse the data sent from the index.html page
  const { image, backgroundStyle } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'A reference image is required.' });
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // ====================================================================
    // STEP 1: SCAN THE PHOTO WITH A VISION MODEL (Your Idea!)
    // ====================================================================
    console.log("Backend Step 1: Scanning photo to extract features...");
    
    // Using LLaVA, a fast and cheap vision model on Replicate
    // Model hash: yorickvp/llava-13b:b5f621affc3e4f0b6c7023c1422709292b1e7c4f0b07c2ee7a9657b0bfa1503c
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
    // STEP 2: GENERATE THE PIXAR AVATAR USING THE FEATURES
    // ====================================================================
    console.log("Backend Step 2: Generating identity-first Pixar generation...");

    // Using lucataco/instant-id, which is ultra-reliable for likeness.
    // Model hash: lucataco/instant-id:a24595696d042236e1468305a415951d65a6e8f49896497491d9046f47738c8c
    const output = await replicate.run(
      "lucataco/instant-id:a24595696d042236e1468305a415951d65a6e8f49896497491d9046f47738c8c",
      {
        input: {
          image: image, // Use the uploaded photo as the facial guide
          // notice how we now describe THE PERSON FIRST, then THE STYLE
          prompt: `A cute, modern Pixar-style 3D animated character portrait of ${personDescription}, adorable and expressive. Simple clean rendering, high detailed masterpiece. Face must have the exact facial likeness and recognisable features of the reference photo. 3D render, smooth subsurface scattering skin, glowing expressive eyes, Octane render, cinematic lighting, vibrant saturated colors, masterpiece, 8k resolution, clear focus. background is a ${backgroundStyle}, soft and blurred bokeh. Nice sharp character features and clean definition.`,
          
          negative_prompt: "raw photography, realistic, ugly, deformed face, creepy eyes, blemish, acne, different identity, wrong gender, vector, illustration, 2D, flat, caricature, glitchy, bedazzled, low contrast, bad anatomy, bad lighting",
          
          // INCREASED FINE-TUNING FOR IDENTITY:
          guidance_scale: 8, // tells the AI to stick strictly to the prompt details
          ip_adapter_scale: 0.85, // CRITICAL: forces the likeness onto the face
          controlnet_conditioning_scale: 0.85 // CRITICAL: holds the exact facial structure
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
