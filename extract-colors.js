import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const imagePath = '/Users/akash/Documents/Projects/project-bloom/bloom_logo.png';
    const imageBase64 = fs.readFileSync(imagePath).toString('base64');
    
    const response = await ai.models.generateContent({
      model: 'models/gemini-3.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Analyze this logo and give me its exact primary, secondary, and accent colors in hex format. Format as JSON with keys: primary, secondary, accent, background. If there are multiple, provide the most prominent ones." },
            { inlineData: { mimeType: 'image/png', data: imageBase64 } }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    console.log(response.text);
  } catch (error) {
    console.error(error);
  }
}

run();
