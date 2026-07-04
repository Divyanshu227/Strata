export interface SpamAnalysisResponse {
  classification: "Safe" | "Suspicious" | "Spam";
  confidence: number;
  threatScore: number;
  reasons: string[];
}

export async function analyzeSpam(message: string): Promise<SpamAnalysisResponse> {
  const apiUrl = process.env.TRUSTGATE_API_URL || "https://trustgateweb.netlify.app/api/v1/analyze";
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to analyze spam: ${response.statusText}`);
  }
  
  const data: SpamAnalysisResponse = await response.json();
  return data;
}
