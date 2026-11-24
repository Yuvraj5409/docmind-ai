
import { gemini, GEMINI_MODEL } from "./gemini.js";

async function testGemini() {
    console.log("Testing Gemini connection...");

    const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: "Reply with exactly: Gemini connection successful.",
    });

    console.log("Gemini response:", response.text);
}

testGemini().catch((error) => {
    console.error("Gemini connection test failed:", error.message);
    process.exitCode = 1;
});
