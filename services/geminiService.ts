import { GoogleGenAI } from "@google/genai";
import { SYSTEM_CONTEXT } from '../constants';

// Ensure API Key is present
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateGuideResponse = async (userMessage: string): Promise<string> => {
  if (!ai) {
    return "API 키가 설정되지 않았습니다. 개발자에게 문의하세요.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_CONTEXT,
        temperature: 0.7,
      }
    });

    return response.text || "죄송합니다. 답변을 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};
