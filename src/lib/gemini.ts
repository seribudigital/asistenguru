import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable. Please set it in .env.local");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];

export async function generateWithFallback(params: any) {
    let lastError: any;

    for (const modelName of FALLBACK_MODELS) {
        try {
            const response = await ai.models.generateContent({
                ...params,
                model: modelName
            });
            return response;
        } catch (error: any) {
            lastError = error;
            const errorMessage = error?.message || 'Unknown error';

            console.warn(`[Gemini Fallback] Model ${modelName} failed: ${errorMessage}. Trying next model...`);
            continue;
        }
    }

    throw lastError || new Error("Semua model AI gagal diakses.");
}

export default ai;
