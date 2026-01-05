
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Initialize the Google GenAI SDK with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDailyPepTalk = async (): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Give me a short, powerful, 3-sentence morning pep talk to help a man overcome social anxiety when talking to women. Focus on abundance mindset, low stakes, and the fact that he is a high-value person who just wants to share good energy.",
    config: {
      temperature: 0.8,
    }
  });
  return response.text || "You are capable, confident, and ready to connect. Go out there and be your best self.";
};

export interface VerificationResult {
  verified: boolean;
  reason: string;
  contactName: string | null;
}

export const verifyApproachScreenshot = async (base64Image: string): Promise<VerificationResult> => {
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  
  const textPart = {
    text: `Analyze this screenshot of a mobile messaging app. 
    Your ONLY goal is to verify if there is a feminine contact name present at the top header of the chat interface.
    
    1. Look at the top bar/header. Identify the contact name.
    2. Determine if it is a female name (e.g., Katelyn, Sarah, Chloe, etc.).
    
    Ignore the actual message content for verification, but ensure it looks like a real chat screen.
    
    Return a JSON object with:
    { 
      "verified": boolean, 
      "contactName": "The name found at the top, or null if none found", 
      "reason": "Brief explanation of why you verified it (e.g., 'Identified female contact Katelyn')" 
    }`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: { type: Type.BOOLEAN },
            contactName: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["verified", "contactName", "reason"]
        }
      }
    });
    
    return JSON.parse(response.text || '{"verified": false, "contactName": null, "reason": "No response from AI"}');
  } catch (e) {
    console.error("Verification error:", e);
    return { verified: false, contactName: null, reason: "Verification failed to process the image." };
  }
};

export const startRoleplaySession = (scenario: string) => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are playing the role of a friendly woman in a ${scenario}. 
      The user is practicing their social skills to overcome approach anxiety. 
      Be natural, slightly warm, but not overly eager. 
      Respond realistically to their openers. 
      After every 3 exchanges, provide a brief 'Coach Tip' in parentheses at the end of your message suggesting how they can improve their body language or tone (even though you can only see text).`,
    }
  });
};
