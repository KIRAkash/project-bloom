const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const key = fs.readFileSync('.env.local', 'utf8').split('=')[1].trim();
const ai = new GoogleGenAI({ apiKey: key });

async function run() {
  try {
    // create a 1x1 white png
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const response = await ai.models.generateContent({
      model: 'models/nano-banana-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "A social media banner including this logo." },
            { inlineData: { mimeType: 'image/png', data: base64 } }
          ]
        }
      ],
      config: {
        responseModalities: ['IMAGE']
      }
    });
    console.log("Success!", response.candidates[0].content.parts[0].inlineData.mimeType);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
