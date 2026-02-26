import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable. Please set it in .env.local");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODEL_NAME = 'gemini-2.5-flash-lite';

export default ai;
