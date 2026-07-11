import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 60;

const eventSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.OBJECT,
        properties: {
          month: { type: Type.STRING, description: "Short month name, e.g., 'Oct', 'Nov'" },
          day: { type: Type.STRING, description: "Day number, e.g., '14', '05'" }
        },
        required: ["month", "day"]
      },
      title: { type: Type.STRING, description: "Name of the event/festival" },
      description: { type: Type.STRING, description: "Why it's relevant to this specific business" },
    },
    required: ["date", "title", "description"],
  },
};

export async function POST(req: Request) {
  try {
    const { businessContext } = await req.json();

    if (!businessContext) {
      return NextResponse.json({ error: 'Business context is required' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();

    const prompt = `
You are an expert local marketing strategist.
Based on the following business context, generate a list of the 6 to 10 most important upcoming festivals, local events, or seasonal marketing opportunities for the next 12 months (starting from today). 

CRITICAL LOCATION AWARENESS:
If the location is in India, you MUST include highly specific regional and cultural festivals relevant to that EXACT state/city (e.g., Onam for Kerala, Ugadi for Karnataka/Andhra, Chhath for Bihar/UP, Durga Puja for Bengal, Gudi Padwa for Maharashtra, local fairs). Do not just output generic national holidays unless highly relevant.
Make sure the events are highly relevant to their specific niche and location. 

Business Context:
${JSON.stringify(businessContext, null, 2)}

Current Year: ${currentYear}
`.trim();

    const response = await ai.models.generateContent({
      model: 'models/gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: eventSchema,
        temperature: 0.8, // Slightly higher for better local variety
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('No text returned from Gemini');
    }

    const events = JSON.parse(text);

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('[GenerateCalendar API Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
