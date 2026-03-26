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

  const { image, backgroundStyle } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'A reference image is required.' });
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log("Backend: Attempting identity-first clean Pixar generation...");

    // The stable model that will preserve your identity while applying the style.
    const output = await replicate.run(
      "tencentarc/photomaker-style:467d062309da518648ba89d226490e02b8ed09b5abc15026e54e31c5a8cd0769",
      {
        input: {
          input_image: image,
          // 'img' is the strict trigger word required by this model.
          // notice how the prompt now demands "high fidelity likeness" and "sharp character features" above everything.
          prompt: `A cute, modern Pixar-style 3D animated character portrait, based on the specific person in the photo. High fidelity likeness, exact facial geometry, and recognizable expression of the reference are mandatory. Smooth subsurface scattering skin, Octane render, cinematic lighting, vibrant saturated colors. Masterpiece, 8k resolution, clear focus. background is a ${backgroundStyle}, soft and blurred bokeh. Nice sharp character features and clean definition.`,
          
          // Strict negative prompt to prevent the wrong identity and gender
          negative_prompt: "raw photography, realistic, noisy, blurry, different identity, generic character, caricature, ugly, bedazzled, low contrast, wrong face, wrong gender, 2D, flat color, complex background",
          
          // Built-in style mode
          style_name: "Disney Charactor", 
          
          // These ratios are crucial for forcing the cartoon texture onto YOUR face structure
          style_strength_ratio: 30, 
          num_steps: 30,
          guidance_scale: 7,
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
