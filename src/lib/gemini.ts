import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client based on the official @google/genai SDK
const geminiApiKey = process.env.GEMINI_API_KEY || 'dummy_key';
export const ai = new GoogleGenAI({ apiKey: geminiApiKey });
