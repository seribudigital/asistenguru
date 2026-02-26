import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable. Please set it in .env.local");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_MODELS = ['gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

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
            const errorMessage = error?.message?.toLowerCase() || '';
            const status = error?.status;

            if (status === 429 || errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('exhausted') || errorMessage.includes('rate limit')) {
                console.warn(`[Gemini Fallback] Model ${modelName} failed (429/Quota). Trying next model...`);
                continue;
            }

            // Jika error lain (misal bad request), langsung throw tanpa fallback
            throw error;
        }
    }

    throw lastError || new Error("Semua model AI gagal diakses (Rate Limit/Quota Exhausted).");
}

export default ai;
