import { GoogleGenerativeAI } from "@google/generative-ai";

// TODO: Replace with your actual Gemini API Key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const GeminiService = {
    async getHealthExplanation(reportData, language = 'en') {
        const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];
        let lastError = null;

        if (!GEMINI_API_KEY) {
            console.error("Gemini API Key is missing!");
            return language === 'ta' ? "AI விளக்கம் கிடைக்கவில்லை." : "AI explanation is temporarily unavailable.";
        }

        for (const modelName of models) {
            try {
                if (!genAI) throw new Error("GenAI not initialized");
                const model = genAI.getGenerativeModel({ model: modelName });

                const prompt = `
                    You are a helpful veterinarian assistant for a farm management app called AgroStock.
                    Based on the following cattle health scan data, provide a very simple, farmer-friendly explanation in ${language === 'ta' ? 'Tamil' : 'English'}.
                    
                    Cattle ID: ${reportData.tagId}
                    Condition: ${reportData.condition}
                    Health Score: ${reportData.healthScore}/100
                    Detected Issues: ${reportData.predictions?.map(p => p.class).join(', ') || 'None'}
                    Risks: ${JSON.stringify(reportData.risks)}
                    Recommendations: ${reportData.recommendations?.join(', ') || 'None'}
                    
                    The explanation should be concise (2-3 sentences max) and focus on immediate action.
                    Do not use markdown.
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                if (text) return text;
            } catch (error) {
                console.warn(`Gemini Attempt failed with ${modelName}:`, error.message);
                lastError = error;
            }
        }

        return language === 'ta'
            ? "நிபுணர் கருத்துக்களைப் பெற முடியவில்லை. தயவுசெய்து பரிந்துரைகளைப் பின்பற்றவும்."
            : "Detailed AI feedback is limited. Please follow the provided recommendations.";
    },

    async getSimpleExplanation(prompt) {
        if (!genAI) return "API Key not configured.";
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini AI Simple Error:", error);
            return "Unable to generate explanation.";
        }
    }
};
