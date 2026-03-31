import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "yourapikey" });

export interface LogAnomaly {
  timestamp: string;
  containerId: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  explanation: string;
  suggestedAction: string;
}

export async function analyzeLogs(logs: string): Promise<{ anomalies: LogAnomaly[], summary: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following Docker container logs and identify any anomalies, errors, or suspicious patterns. 
    Return the analysis in JSON format.
    
    Logs:
    ${logs}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A brief overview of the log health."
          },
          anomalies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                containerId: { type: Type.STRING },
                severity: { 
                  type: Type.STRING,
                  enum: ["low", "medium", "high", "critical"]
                },
                message: { type: Type.STRING },
                explanation: { type: Type.STRING },
                suggestedAction: { type: Type.STRING }
              },
              required: ["timestamp", "severity", "message", "explanation"]
            }
          }
        },
        required: ["summary", "anomalies"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { summary: "Error analyzing logs.", anomalies: [] };
  }
}
