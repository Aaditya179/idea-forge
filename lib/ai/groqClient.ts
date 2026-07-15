import Groq from "groq-sdk";

// Define the model name as a config constant for easy swapping
export const GROQ_MODEL = "llama-3.3-70b-versatile";

// Ensure the API key exists
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn("WARNING: GROQ_API_KEY environment variable is not defined.");
}

// Export a singleton instance of the Groq client
export const groq = new Groq({
  apiKey: apiKey || "",
});
