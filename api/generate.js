import { Replicate } from '@ai-sdk/replicate';
import { streamText, experimental_streamObject } from 'ai';

// Elegant Vercel AI SDK setup
export const maxDuration = 60; // Max allowed for Vercel Hobby plan

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Use the elegant Vercel AI SDK approach to handle secrets and providers
  const replicate = new Replicate({
    apiKey: process.env.REPLICATE_API_TOKEN,
  });

  const { image, backgroundStyle } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'A reference image is required.' });
  }

  try {
    console.log("Backend: Attempting identity-first Instant-ID generation...");

    // Calling the robust Instant-ID model through the Vercel AI SDK
    // Model hash: zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789
    const response = await replicate.request('POST', '/v1/predictions', {
      input: {
        image: image, // Your base64 photo
        // OVERHAULED PROMPT ENGINEERING: Focusing on identity preservation, not generic cuteness.
        prompt: `A highly detailed, modern Pixar-style 3D animated character portrait of this specific person. The face must have the exact facial likeness, identifiable features, and recognizable expression of the reference photo. Adorable, smooth subsurface scattering skin, Octane render, cinematic lighting, vibrant saturated colors. Masterpiece, 8k resolution, clear focus. Background is a ${backgroundStyle}, soft and blurred bokeh.`,
        
        // Strict negative prompt to force your conditions
        negative_prompt: "raw photography, realistic, ugly, deformed face, creepy eyes, blemish, acne, different identity, 2D, flat, cartoon vector, glitchy, bedazzled, bad anatomy, bad lighting",
        
        // FINE-TUNING FOR IDENTITY (The secret sauce):
        // Increased guidance tells AI to stick strictly to the prompt.
        guidance_scale: 8, 
        
        // BALANCED SCALES for "You, but Pixar":
        // High enough to keep your face, low enough to let the 3D texture work.
        ip_adapter_scale: 0.65, 
        controlnet_conditioning_scale: 0.7 
      }
    });

    const data = await response.json();
    
    // Vercel AI SDK elegant data handling
    if (!data || !data.urls || !data.urls.get) {
        throw new Error("Replicate model prediction failed.");
    }
    
    // With Instant-ID, the output is not immediate. We return the prediction ID 
    // so the frontend can poll for the result. This is much more robust for complex models.
    return res.status(200).json({ predictionId: data.id });

  } catch (error) {
    console.error("Critical Backend AI Error:", error);
    return res.status(500).json({ 
      error: 'AI Generation failed.',
      details: error.message 
    });
  }
}
