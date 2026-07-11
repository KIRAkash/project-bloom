import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export async function POST(req: NextRequest) {
  try {
    const { type, context, count = 1, referenceImage } = await req.json();

    if (!type || !context) {
      return NextResponse.json({ error: 'type and context are required' }, { status: 400 });
    }

    console.log(`[ImageGen] Starting 2-step generation for ${type}. Count: ${count}`);

    const name = context.businessName || 'a local business';
    const category = context.businessCategory || 'retail shop';
    const location = context.businessLocation || 'India';
    const products = context.primaryProducts ? context.primaryProducts.join(', ') : '';

    // Step 1: Generate Optimized Prompts using Gemini 3.5 Flash
    let promptGenerationInstruction = '';
    
    if (type === 'logo') {
      promptGenerationInstruction = `
You are an expert prompt engineer for an image generation model.
Generate ${count} distinct, highly optimized prompts to create a logo for:
Business Name: ${name}
Category: ${category}
Location: ${location}
Products: ${products}

The logo must be a clean, distinct brand icon isolated on a solid white background. It should NOT be a scene, photograph, or banner.
CRITICAL: The logo MUST prominently feature the exact text "${name}".
CRITICAL: The logo MUST be perfectly square (1:1 aspect ratio). Do not generate landscape or wide images.
The visual elements of the logo should creatively reflect what they sell (${products}) and their location vibe (${location}).
Make each of the ${count} prompts visually distinct (e.g., one minimal geometric, one playful illustration, one elegant typography).

Return ONLY a JSON array of objects. Each object must have a "name" (a 2-3 word title for the logo style) and a "prompt" (the image generation prompt).
Example: 
[
  { "name": "Minimal Bakery", "prompt": "A clean flat vector logo for a bakery on a solid white background, featuring a stylized cupcake and the text 'Delhi Sweets' prominently displayed below..." },
  { "name": "Modern Line Art", "prompt": "A modern minimal line-art logo on a pure white background, incorporating a subtle coffee cup shape and the words 'Delhi Sweets' in elegant typography..." }
]
`;
    } else if (type === 'theme') {
      promptGenerationInstruction = `
You are an expert prompt engineer for an image generation model.
Generate ${count} distinct, highly optimized prompts to create a social media campaign banner (vertical 9:16 aspect ratio) for:
Business Name: ${name}
Category: ${category}
Location: ${location}
Products: ${products}

Constraints:
- The images must be suitable for an Instagram Story or Reel (9:16 portrait).
- The banners must include dummy promotional text visually integrated, such as "New Launch", "Back in Stock", or a seasonal festive offer.
- Each banner should represent a completely different design style (e.g., festive promo, minimal modern launch, bold typography sale).
- IMPORTANT: An image of the brand's logo will be provided to the image generator. The prompt MUST explicitly instruct the generator to treat the provided image as a logo and place it naturally within the banner (e.g. 'incorporate the provided reference image as a logo in the corner'). Do not let the logo override the entire scene.

Return ONLY a JSON array of objects. Each object must have a "name" (a catchy 2-3 word title for the theme) and a "prompt" (the image generation prompt).
Example: 
[
  { "name": "Festive Special", "prompt": "A vibrant festive social media story banner for..." },
  { "name": "Minimal Launch", "prompt": "A clean minimal promotional post for..." }
]
`;
    }

    console.log(`[ImageGen] Calling gemini-3.5-flash for prompts...`);
    const promptRes = await ai.models.generateContent({
      model: 'models/gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: promptGenerationInstruction }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              prompt: { type: 'STRING' }
            },
            required: ['name', 'prompt']
          }
        }
      }
    });

    const promptsText = promptRes.text || '[]';
    let parsedData: any[] = [];
    try {
      // Robust JSON array extraction
      const match = promptsText.match(/\[.*\]/s);
      const cleanJson = match ? match[0] : promptsText;
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error('[ImageGen] Failed to parse JSON prompts:', promptsText);
      return NextResponse.json({ error: 'Failed to parse generated prompts as JSON' }, { status: 500 });
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return NextResponse.json({ error: 'Gemini returned invalid prompts' }, { status: 500 });
    }

    // Ensure we have exactly `count` prompts
    parsedData = parsedData.slice(0, count);
    
    // Normalize prompts format
    let prompts: { name: string; prompt: string }[] = parsedData.map((p, i) => ({
      name: p.name || `${type === 'logo' ? 'Logo' : 'Theme'} ${i + 1}`,
      prompt: p.prompt || (typeof p === 'string' ? p : `${type === 'logo' ? 'Logo' : 'Theme'}`)
    }));
    
    console.log(`[ImageGen] Generated Prompts:`, prompts.map(p => p.name));

    // Prepare reference image if provided (format: data:image/png;base64,...)
    let refImagePart = null;
    if (referenceImage && referenceImage.startsWith('data:image/')) {
      const match = referenceImage.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        refImagePart = {
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        };
        console.log(`[ImageGen] Parsed reference image: ${match[1]}`);
      }
    }

    // Step 2: Generate Images using Gemini Flash Lite Image
    const results = await Promise.all(prompts.map(async (pItem, i) => {
      const parts: any[] = [{ text: pItem.prompt }];
      if (refImagePart) {
        parts.push(refImagePart);
      }

      const config: any = {
        responseModalities: ['IMAGE']
      };
      // Pass aspect ratio based on type
      if (type === 'theme') {
        config.aspectRatio = '9:16';
      } else if (type === 'logo') {
        config.aspectRatio = '1:1';
      }

      const response = await ai.models.generateContent({
        model: 'models/gemini-3.1-flash-lite-image',
        contents: [
          {
            role: 'user',
            parts: parts
          }
        ],
        config
      });

      const responseParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of responseParts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          console.log(`[ImageGen] ✅ Image ${i + 1} (${pItem.name}) generated (${part.inlineData.mimeType})`);
          return {
            name: pItem.name,
            image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
          };
        }
      }
      console.warn(`[ImageGen] ⚠️ No image found in response ${i + 1}`);
      return null;
    }));

    // Filter out nulls and type as array of objects
    const validImages = results.filter(Boolean) as { name: string; image: string }[];

    console.log(`[ImageGen] Returning ${validImages.length} image(s)`);
    // If it's logo type, the frontend expects just an array of strings currently, so map it back.
    // Wait, let's keep it uniform or handle logo as string array for backward compatibility?
    // The frontend LogoSelector expects string[], ThemeSelector expects ThemeItem[].
    if (type === 'logo') {
      return NextResponse.json({ images: validImages.map(img => img.image) });
    }
    
    return NextResponse.json({ images: validImages });

  } catch (error: any) {
    console.error('[ImageGen] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}
