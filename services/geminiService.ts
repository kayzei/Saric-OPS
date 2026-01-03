import { GoogleGenAI, Modality } from "@google/genai";
import { Asset, MaintenanceRecord } from '../types';

// Safety check for API Key
const API_KEY = process.env.API_KEY || "";

const getAi = () => {
  if (!API_KEY || API_KEY === "undefined") {
    console.warn("Gemini API Key missing from environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

// Helper to decode base64 for audio processing
function decode(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decode failure");
    return new Uint8Array();
  }
}

export const generateFleetReport = async (assets: Asset[]): Promise<string> => {
  const ai = getAi();
  if (!ai) return "AI Intelligence Suite currently offline (Missing Credentials).";

  try {
    const dataSummary = assets.map(a => 
      `ID: ${a.id}, Status: ${a.status}, Fuel: ${a.fuelLevel}%, Location: [${a.location.lat}, ${a.location.lng}]`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a logistics operations manager assistant. Analyze the following fleet data and provide a concise, strategic summary (max 100 words). Focus on efficiency, potential risks (low fuel, breakdowns), and overall health. Data:\n${dataSummary}`,
    });

    return response.text || "Diagnostic summary unavailable.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('fetch')) return "Network failure: Unable to reach AI node.";
    return "Strategic analysis halted due to security error.";
  }
};

export const generateDriverBriefing = async (driverName: string, asset: Asset): Promise<Uint8Array | null> => {
  const ai = getAi();
  if (!ai) return null;

  try {
    // 1. Generate text first
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, professional morning briefing for a logistics driver named ${driverName}. 
      They are driving ${asset.name} (ID: ${asset.id}). 
      Current status: ${asset.status}. 
      Fuel: ${asset.fuelLevel}%. 
      Location: ${asset.locationName || 'Unknown'}.
      Tone: Professional, supportive, and alert. Max 40 words.`,
    });
    
    const briefText = textResponse.text || `Good morning, ${driverName}. Systems check complete. Vehicle ${asset.id} is ready for operations.`;

    // 2. Convert to speech
    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: briefText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        return decode(base64Audio);
    }
    return null;
  } catch (error) {
    console.error("TTS Briefing Error:", error);
    return null;
  }
};

export const analyzeMaintenanceHistory = async (records: MaintenanceRecord[], assets: Asset[]): Promise<string> => {
  const ai = getAi();
  if (!ai) return "Maintenance AI Core offline.";

  try {
    const history = records.map(r => `Asset: ${r.assetId}, Type: ${r.type}, Cost: ${r.cost}, Date: ${r.date}, Notes: ${r.notes}`).join('\n');
    const fleet = assets.map(a => `ID: ${a.id}, Fuel: ${a.fuelLevel}%, Speed: ${a.speed}`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Predictive Maintenance Analysis. Analyze these historical records and current fleet telemetry to identify 3 high-risk assets and why.
      History:\n${history}\n\nFleet Status:\n${fleet}`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    return response.text || "No predictive data generated.";
  } catch (error) {
    return "Predictive analysis link failure.";
  }
};

export const askAssistant = async (query: string, contextData: string): Promise<string> => {
  const ai = getAi();
  if (!ai) return "Vanguard Assistant currently disconnected.";

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context Data: ${contextData}\n\nUser Query: ${query}\n\nAnswer as a helpful logistics assistant.`,
      });
      return response.text || "Processing failure in the assistant node.";
  } catch (error) {
      return "Neural link interrupted.";
  }
}