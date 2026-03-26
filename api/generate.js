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

    // ====================================================================
    // STEP 1: VISION SCAN (Forces the AI to recognize your gender/features)
    // ====================================================================
    console.log("Backend Step 1: Scanning photo...");
    const visionOutput = await replicate.run(
      "yorickvp/llava-13b:b5f621affc3e4f0b6c7023c1422709292b1e7c4f0b07c2ee7a9657b0bfa1503c",
      {
        input: {
          image: image,
          prompt: "Describe this person accurately but concisely: gender, facial hair, glasses, hats, expression. Write exactly 1 short sentence."
        }
      }
    );

    const description = visionOutput.join("").trim();
    console.log(`Backend Step 1 Complete. AI sees: "${description}"`);

    // ====================================================================
    // STEP 2: SHAPE-TRACING GENERATION
    // ====================================================================
    console.log("Backend Step 2: Generating 3D Avatar...");
    const output = await replicate.run(
      "fofr/face-to-many:a07f252abbbd832009640b27f063ea52d87d7a23a185ca165bec23b5adc8deaf",
      {
        input: {
          image: image,
          style: "3D", 
          // Injecting the exact description (e.g. "a man with a beard and sunglasses")
          prompt: `A cute Pixar 3D animated character portrait of ${description}. Background: ${backgroundStyle || "soft pastel"}. High quality, sharp features, clear focus, octane render.`,
          
          negative_prompt: "female, girl, woman, feminine, wrong gender, realistic, photorealistic, ugly, deformed, flat, bad anatomy",
          
          // These parameters perfectly balance tracing your physical hat/glasses with applying 3D style
          denoising_strength: 0.65,
          prompt_strength: 4.5,
          control_depth_strength: 0.8,
          instant_id_strength: 1.0
        }
      }
    );

    if (!output || output.length === 0) {
        throw new Error("Generation failed to return an image.");
    }

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
