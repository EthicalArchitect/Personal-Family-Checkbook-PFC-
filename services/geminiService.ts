import { GoogleGenAI, Type } from "@google/genai";
import { ParsedReceipt, TransactionCategory } from '../types';

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    merchant: {
      type: Type.STRING,
      description: "The name of the merchant or store.",
    },
    total: {
      type: Type.NUMBER,
      description: "The final total amount of the transaction.",
    },
    category: {
      type: Type.STRING,
      enum: Object.values(TransactionCategory),
      description: "The most likely spending category for this purchase."
    },
    description: {
        type: Type.STRING,
        description: "A brief, one-line summary of the purchase, like 'Weekly groceries' or 'Dinner with friends'."
    }
  },
  required: ["merchant", "total", "category", "description"],
};

export async function analyzeReceipt(base64Image: string): Promise<ParsedReceipt> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not available. Please configure it in the environment.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: 'image/jpeg',
    },
  };

  const textPart = {
    text: `Analyze the attached receipt. Extract the merchant name, the total amount, a brief description of the purchase, and suggest the most appropriate spending category. Please provide the total as a number, not a string.`,
  };

  try {
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: receiptSchema,
        }
    });

    const jsonText = result.text;
    const parsedJson = JSON.parse(jsonText);

    // Basic validation
    if (
        !parsedJson.merchant ||
        typeof parsedJson.total !== 'number' ||
        !parsedJson.category ||
        !Object.values(TransactionCategory).includes(parsedJson.category)
    ) {
        throw new Error("Invalid data structure received from API");
    }

    return parsedJson as ParsedReceipt;

  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw new Error("Failed to analyze receipt. Please try again or enter the details manually.");
  }
}