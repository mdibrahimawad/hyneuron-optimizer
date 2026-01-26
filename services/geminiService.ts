
import { GoogleGenAI, Type } from "@google/genai";
import { OptimizationResult } from "../types";

// Always use named parameter for apiKey and read from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Optimizes a CUDA/OpenCL kernel using the Gemini model.
 */
export const optimizeKernel = async (code: string): Promise<OptimizationResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      You are a world-class GPU kernel optimization agent. 
      Analyze the following CUDA/OpenCL code and provide a SOTA optimized version.
      Implement techniques like:
      - Tiling with Shared Memory
      - Memory Coalescing
      - Avoiding Bank Conflicts
      - Register pressure reduction
      - Loop unrolling
      - Using __restrict__ keywords

      Code to optimize:
      ${code}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          optimizedCode: { type: Type.STRING },
          explanation: { type: Type.STRING },
          metrics: {
            type: Type.OBJECT,
            properties: {
              latency: { type: Type.NUMBER },
              occupancy: { type: Type.NUMBER },
              memoryThroughput: { type: Type.NUMBER },
              computationalEfficiency: { type: Type.NUMBER },
              timeEfficiency: { type: Type.NUMBER },
              registerPressure: { type: Type.NUMBER },
              smUtilization: { type: Type.NUMBER },
            },
            required: ["latency", "occupancy", "memoryThroughput", "computationalEfficiency", "timeEfficiency", "registerPressure", "smUtilization"]
          }
        },
        required: ["optimizedCode", "explanation", "metrics"]
      }
    }
  });

  try {
    // Extract text directly from the response object
    const result = JSON.parse(response.text || '{}');
    return {
      originalCode: code,
      ...result
    };
  } catch (e) {
    console.error("Failed to parse optimization response", e);
    throw new Error("Optimization failed to return valid JSON");
  }
};

/**
 * Handles agent chat interactions for technical assistance.
 */
export const agentChat = async (history: any[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are the KernelOptic AI Assistant. You help users understand GPU architecture, CUDA optimization, and profiler results. Be concise, technical, and helpful."
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};