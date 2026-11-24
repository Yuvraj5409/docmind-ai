
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables from the project-root .env file.
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.resolve(currentDirectory, "../../.env"),
});

// Read the Gemini API key securely from the backend environment.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from the root .env file");
}

// Initialize the Gemini client.
export const gemini = new GoogleGenAI({ apiKey });

// Model used by DocMind AI.
export const GEMINI_MODEL =
    process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
