import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { businessContext, event, themeDesignPrompt, referenceImage } = await req.json();

    if (!businessContext || !event || !themeDesignPrompt) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const promptGenerationInstruction = `
You are a master art director. I need to generate 3 distinct image generation prompts for a marketing poster for the following business:
Business Name: ${businessContext.businessName}
Products/Services: ${businessContext.businessProducts}
Event: ${event.title} (${event.description})

The posters MUST STRICTLY adhere to the following abstract brand aesthetic:
${themeDesignPrompt}

CRITICAL: The image MUST be designed for a 9:16 vertical portrait aspect ratio (tall format like an Instagram story). ${referenceImage ? 'A logo image is provided in the actual generation step. You must design the poster to prominently and seamlessly incorporate that logo.' : ''}

Write 3 completely unique, highly descriptive prompts for an image generation model. 
Each prompt should have a different compositional approach, angle, or layout, while strictly keeping the same core aesthetic and colors.
Do NOT include any specific text or words in the prompt other than the business name if necessary.

Return ONLY a valid JSON array of strings containing the 3 prompts. Do not include markdown formatting.
    `.trim();

    // 1. Generate 3 unique prompts
    const promptRes = await ai.models.generateContent({
      model: 'models/gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: promptGenerationInstruction }] }]
    });

    let prompts: string[] = [];
    try {
      const text = promptRes.text?.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim() || '[]';
      prompts = JSON.parse(text);
      if (!Array.isArray(prompts) || prompts.length === 0) throw new Error('Invalid JSON array');
    } catch (e) {
      console.error('Failed to parse distinct prompts, falling back to basic prompt', e);
      prompts = [
        `Poster for ${event.title} by ${businessContext.businessName}, ${themeDesignPrompt}. High quality, cinematic.`,
        `Creative angle poster for ${event.title} by ${businessContext.businessName}, ${themeDesignPrompt}. High quality, minimal.`,
        `Vibrant marketing layout for ${event.title} by ${businessContext.businessName}, ${themeDesignPrompt}. High quality, striking.`
      ];
    }

    // 2. Generate the images using the 3 distinct prompts
    const generatePromises = prompts.slice(0, 3).map((promptText) => {
      const contents: any[] = [{ role: 'user', parts: [{ text: promptText + " MUST BE 9:16 PORTRAIT. DO NOT MAKE IT SQUARE OR WIDESCREEN." }] }];


      return ai.models.generateContent({
        model: 'models/gemini-3.1-flash-lite-image',
        contents,
        config: {
          responseModalities: ['IMAGE'],
          aspectRatio: '9:16',
          personGeneration: 'ALLOW_ADULT',
        }
      });
    });

    const responses = await Promise.allSettled(generatePromises);
    
    const images: string[] = [];
    
    responses.forEach((res) => {
      if (res.status === 'fulfilled') {
        const genRes = res.value;
        const parts = genRes.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            break; // take first image part
          }
        }
      } else {
        console.error('Image generation failed for a variation:', res.reason);
      }
    });

    if (images.length === 0) {
      throw new Error('All image generations failed');
    }

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('[GenerateCampaign API Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
