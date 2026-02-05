import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildDiseasePrompt } from "./templetePrompt.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateDiseaseAdvice(disease, catProfile = {}) {
    const prompt = buildDiseasePrompt(disease, catProfile);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean up markdown if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("AI Generation Error:", error);
        // Return structured fallback to prevent frontend crash
        return {
            prevention: {
                title: "Unable to generate advice",
                intro: "Please check your internet connection or API settings.",
                points: []
            },
            counseling: {
                title: "Error",
                intro: "Please consult a veterinarian directly.",
                red_flags: []
            }
        };
    }
}