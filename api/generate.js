export const maxDuration = 60; // Max allowed for Vercel Hobby plan
import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Security Error: REPLICATE_API_TOKEN is not defined on Vercel.");
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

    console.log(`Backend: Attempting ${style} generation...`);

    // DISTILLED HIGH-DETAIL PROMPT Construction to accurately replicate image style
    const output = await replicate.run(
      "zsxkib/instant-id:2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789",
      {
        input: {
          image: image,
          // DRASSICALLY OVERHAULED, HIGH-DETAIL PROMPT:
          prompt: `A highly detailed, idealized hyper-realistic portrait photograph of a person, based on the reference likeness. Subject is centered, gazing directly at the camera. Composition is a close-up head-and-shoulders portrait. The aesthetic matches the ${style}. Key features include tack-sharp focus on the face and eyes, an extreme shallow depth of field (creamy bokeh background), and diffused soft natural lighting (window light or softbox). Colors are highly saturated, warm, and vibrant, especially in hair, clothing, and environment, popping from the abstract background. The complexion is flawless and radiant yet retains pore texture, idealized realism. Bright, sparkly eyes. Professional post-processing sheen, incredibly detailed (8k, high resolution).`,
          
          // STRICTER, ACCURATE NEGATIVE PROMPT:
          negative_prompt: "raw photography, low resolution, blurry, out of focus face, heavy shadows, blemish, acne, imperfections, illustration, caricature, GigaChad, cartoonish vector, flat colors, desaturated, distorted features, artificial proportions.",
          
          // FINE-TUNING FOR IDEALIZED REALISM (Higher guidance/scales lean into the idealized description)
          guidance_scale: 7.5, // High value leans into the prompt's idealization
          ip_adapter_scale: 0.8, // Crucial for identity preservation
          controlnet_conditioning_scale: 0.8 // Holds the face structure from reference photo
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
