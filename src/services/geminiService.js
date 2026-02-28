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
    },

    async generateBusinessInsights(salesData) {
        if (!genAI) return "AI Insights Unavailable (Key Missing)";

        const models = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `
                    You are a Business Intelligence Analyst for a dairy farm. Analyze the following sales data JSON:
                    ${JSON.stringify(salesData)}
    
                    Identify 3 key insights:
                    1. Best performing products.
                    2. Peak sales times (morning/evening).
                    3. Actionable advice to increase profit (e.g., "Stock more Paneer for Friday evenings").
    
                    Format the output as a clean JSON object with this structure (no markdown):
                    {
                        "insights": [
                            { "title": "Insight Title", "description": "Short explanation", "type": "positive/warning/tip" }
                        ],
                        "recommendation": "One main actionable advice sentence."
                    }
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text();

                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            } catch (error) {
                console.warn(`Gemini Business Insights Failed with ${modelName}:`, error.message);
            }
        }

        // Fallback mock data if ALL AI models fail
        console.error("All Gemini Models Failed for Insights");
        return {
            insights: [
                { title: "AI Analysis Failed", description: "Could not generate live insights due to API limits.", type: "warning" }
            ],
            recommendation: "Please review your sales reports manually."
        };
    },

    async generateDemandForecast(analyticsData) {
        if (!genAI) return null;

        const models = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `
                    You are a Supply Chain AI Expert for a local dairy marketplace.
                    Analyze the following Daily Sales Trend (Last 30 days) and Product Performance:
                    ${JSON.stringify({
                    dailyTrend: analyticsData.dailyTrend,
                    topProducts: analyticsData.topProducts
                })}
    
                    Your Task: Predict demand for the UPCOMING week and suggest actions.
                    
                    Return a JSON object with this structure (NO MARKDOWN):
                    {
                        "forecast": [
                            { "day": "Monday", "predictedVolume": "High/Medium/Low", "reason": "Historical peak observed" },
                            { "day": "Tuesday", "predictedVolume": "Medium", "reason": "Steady mid-week trend" }
                            // ... for next 3-4 days
                        ],
                        "inventoryActions": [
                             { "product": "Milk", "action": "Increase stock by 20%", "urgency": "High" },
                             { "product": "Paneer", "action": "Maintain current levels", "urgency": "Low" }
                        ],
                        "pricingStrategy": "Brief advice on dynamic pricing based on upcoming demand (e.g., 'Increase Milk price by ₹2 this weekend due to high demand')."
                    }
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text();

                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            } catch (error) {
                console.warn(`Gemini Forecast Failed with ${modelName}:`, error.message);
            }
        }

        console.error("All Gemini Models Failed for Forecast");
        return null;
    }
};