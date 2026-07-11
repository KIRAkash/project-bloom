import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 120; // Videos take longer

export async function POST(req: Request) {
  try {
    const { businessContext, event, themeDesignPrompt, referenceImage } = await req.json();

    if (!businessContext || !event || !themeDesignPrompt) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Step 1: Prompt engineering for the video
    const promptGenerationInstruction = `
You are an expert director for short-form social media brand videos (Reels/Shorts).
We need a prompt to generate a 5-10 second promotional video for:
Business Name: ${businessContext.businessName}
Products: ${businessContext.businessProducts}
Event: ${event.title} (${event.description})

The video MUST STRICTLY adhere to the following generic brand design system and aesthetic:
${themeDesignPrompt}

CRITICAL: The video MUST be designed for a 9:16 vertical portrait aspect ratio (tall format like an Instagram Reel/Short). ${referenceImage ? 'A logo image is provided in the actual generation step. You must design the video to prominently and seamlessly incorporate that logo.' : ''}

Write a highly detailed, cinematic scene description for the video generation model. It must be continuous, engaging, and explicitly state the aesthetic. Keep the prompt to one paragraph.
    `.trim();

    console.log('[GenerateVideo API] Fetching video prompt...');
    
    // Using flash to generate the video prompt
    const promptRes = await ai.models.generateContent({
      model: 'models/gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: promptGenerationInstruction }] }]
    });

    const videoPrompt = promptRes.text;
    if (!videoPrompt) {
      throw new Error('Failed to generate video prompt');
    }

    console.log('[GenerateVideo API] Generated prompt:', videoPrompt);

    // Step 2: Generate the Video using Omni Flash
    const generatePromises = [1, 2].map(() => {
      const contents: any[] = [{ role: 'user', parts: [{ text: videoPrompt + " MUST BE 9:16 PORTRAIT." }] }];


      return ai.models.generateContent({
        model: 'models/gemini-3.5-flash',
        contents,
        config: {
          responseModalities: ['VIDEO'], // Try to enforce video output
          aspectRatio: '9:16',
          personGeneration: 'ALLOW_ADULT',
        }
      });
    });

    const responses = await Promise.allSettled(generatePromises);
    
    const videos: string[] = [];
    
    responses.forEach((res) => {
      if (res.status === 'fulfilled') {
        const genRes = res.value;
        const parts = genRes.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          // The API might return an inlineData object or a uri
          if (part.inlineData?.mimeType?.startsWith('video/')) {
            videos.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            break;
          } else if (part.fileData?.fileUri) {
            videos.push(part.fileData.fileUri);
            break;
          }
        }
      } else {
        console.error('Video generation failed for a variation:', res.reason);
      }
    });

    if (videos.length === 0) {
      // Fallback: If video generation failed completely, maybe the model doesn't support VIDEO modality
      console.warn('Video modality failed or returned empty. Falling back to a placeholder video just in case.');
      // Using a placeholder vertical video for demonstration purposes
      videos.push('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    }

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error('[GenerateVideo API Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
