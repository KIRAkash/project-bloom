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
Analyze this marketing poster and extract its core visual design system into a highly detailed, reusable prompt that can be used to generate similar posters in the future.
Ignore the specific text or specific product being shown. Focus entirely on the generic design pattern.

Provide a detailed description of:
1. The exact color palette (primary, secondary, background, and accent colors).
2. The lighting and mood (e.g., bright and airy, neon cyberpunk, soft pastel, dramatic studio lighting).
3. The layout structure (e.g., central product focus with bold typography overlay, minimalist grid, organic flowing shapes).
4. The art style and textures (e.g., flat vector graphics, hyper-realistic 3D render, grainy vintage photography).
5. The typography vibe (e.g., bold sans-serif, elegant serif, playful handwritten).

Return ONLY the raw generic design prompt text that I can feed directly into an image generator later. Do not include any conversational filler.
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
