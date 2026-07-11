import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { businessContext, event, themeDesignPrompt } = await req.json();

    if (!businessContext || !event || !themeDesignPrompt) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const campaignPrompt = `
You are creating a marketing poster for the following business:
Business Name: ${businessContext.businessName}
Products/Services: ${businessContext.businessProducts}

The poster is for the upcoming event:
Event Name: ${event.title}
Context: ${event.description}

The poster MUST STRICTLY adhere to the following generic brand design system:
${themeDesignPrompt}

Ensure the poster prominently features the spirit of the event while maintaining the core brand colors and aesthetic style described above. High quality, marketing layout, no messy text.
    `.trim();

    // We generate 3 variations concurrently using generateContent
    const generatePromises = [1, 2, 3].map(() => 
      ai.models.generateContent({
        model: 'models/gemini-3.1-flash-lite-image',
        contents: [{ role: 'user', parts: [{ text: campaignPrompt }] }],
        config: {
          responseModalities: ['IMAGE'],
          aspectRatio: '9:16',
          personGeneration: 'ALLOW_ADULT',
        }
      })
    );

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
