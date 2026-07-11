import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 60; // Allow 60 seconds

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 is required' }, { status: 400 });
    }

    // Strip out the data:image prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const extractionPrompt = `
Analyze this image and extract ONLY its abstract visual design system into a highly detailed, reusable prompt that can be used to style future images.

CRITICAL INSTRUCTIONS:
- DO NOT mention any specific objects, people, products, or subjects present in the image (e.g. do not say "a woman holding a bag", "a coffee cup in the center", etc.).
- DO NOT mention spatial relationships or layouts of elements (e.g. do not say "text on the top left", "logo in the center").
- Focus ENTIRELY on the abstract style: color palette, mood, lighting, textures, art style, and typography vibe.
- The output should read like a style guide modifier (e.g., "A moody, cinematic aesthetic featuring a deep navy and neon pink color palette with high contrast lighting, film grain texture, and modern minimal sans-serif typography elements.")

Return ONLY the raw generic design style text that I can append to an image generator prompt later. Do not include any conversational filler.
    `.trim();

    const response = await ai.models.generateContent({
      model: 'models/gemini-3.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: extractionPrompt },
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
          ]
        }
      ],
      config: {
        temperature: 0.2, // Low temp for analytical consistency
      }
    });

    const extractedTheme = response.text || '';

    return NextResponse.json({ prompt: extractedTheme });
  } catch (error: any) {
    console.error('[ExtractTheme API Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
