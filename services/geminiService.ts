import { GoogleGenAI } from "@google/genai";
import { Asset } from '../types';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFleetReport = async (assets: Asset[]): Promise<string> => {
  try {
    const dataSummary = assets.map(a => 
      `ID: ${a.id}, Status: ${a.status}, Fuel: ${a.fuelLevel}%, Location: [${a.location.lat}, ${a.location.lng}]`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a logistics operations manager assistant. Analyze the following fleet data and provide a concise, strategic summary (max 100 words). Focus on efficiency, potential risks (low fuel, breakdowns), and overall health. Data:\n${dataSummary}`,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI report at this time. Please check your API connection.";
  }
};

export const askAssistant = async (query: string, contextData: string): Promise<string> => {
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context Data: ${contextData}\n\nUser Query: ${query}\n\nAnswer as a helpful logistics assistant.`,
      });
      return response.text || "I couldn't process that request.";
  } catch (error) {
      return "AI Assistant is currently offline.";
  }
}