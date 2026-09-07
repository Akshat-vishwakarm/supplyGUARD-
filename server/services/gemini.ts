import { GoogleGenAI } from "@google/genai";
import type { AssessmentInput, Vulnerability, Recommendation } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
});

interface AssessmentScores {
  overallRiskScore: number;
  supplierRiskScore: number;
  logisticsRiskScore: number;
  geopoliticalRiskScore: number;
}

interface GeminiAssessmentResponse {
  scores: AssessmentScores;
  vulnerabilities: Vulnerability[];
  recommendations: Recommendation[];
}

export async function analyzeSupplyChainVulnerabilities(
  assessmentData: AssessmentInput
): Promise<GeminiAssessmentResponse> {
  const startTime = Date.now();
  console.log("⚡ Starting ultra-fast analysis...");
  
  // Aggressive 10-second timeout for guaranteed speed
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Gemini API timeout - using fallback analysis")), 10000);
  });
  
  try {
    const prompt = createAssessmentPrompt(assessmentData);
    console.log(`📝 Ultra-short prompt (${prompt.length} chars):`, prompt.substring(0, 100) + "...");
    
    const apiCallPromise = ai.models.generateContent({
      model: "gemini-3.6-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            scores: {
              type: "object",
              properties: {
                overallRiskScore: { type: "number" },
                supplierRiskScore: { type: "number" },
                logisticsRiskScore: { type: "number" },
                geopoliticalRiskScore: { type: "number" }
              },
              required: ["overallRiskScore", "supplierRiskScore", "logisticsRiskScore", "geopoliticalRiskScore"]
            },
            vulnerabilities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                  score: { type: "number" },
                  impactTimeline: { type: "string" },
                  potentialCost: { type: "string" }
                },
                required: ["id", "title", "description", "severity", "score", "impactTimeline", "potentialCost"]
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  timeline: { type: "string" },
                  priority: { type: "string", enum: ["Critical", "High", "Medium", "Low"] }
                },
                required: ["id", "title", "description", "timeline", "priority"]
              }
            }
          },
          required: ["scores", "vulnerabilities", "recommendations"]
        }
      },
      contents: prompt
    });
    
    console.log("Gemini API call initiated, waiting for response...");
    
    // Race between API call and timeout
    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    console.log("Gemini API response received");

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    console.log("Parsing Gemini response...");
    const data: GeminiAssessmentResponse = JSON.parse(rawJson);
    console.log("✅ Gemini analysis completed successfully");
    return data;
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    
    // If timeout or API error, provide fallback analysis
    if (error instanceof Error && error.message.includes("timeout")) {
      console.log("🔄 Providing fallback analysis due to timeout");
      return createFallbackAnalysis(assessmentData);
    }
    
    throw new Error(`Failed to analyze supply chain vulnerabilities: ${error}`);
  }
}

function createFallbackAnalysis(data: AssessmentInput): GeminiAssessmentResponse {
  console.log("📊 Generating fallback risk analysis");
  
  // Basic risk scoring based on simple heuristics
  const supplierRisk = data.suppliers.length === 1 ? 8 : 5;
  const logisticsRisk = data.riskFactors.toLowerCase().includes('port') ? 7 : 4;
  const geopoliticalRisk = data.suppliers.some(s => s.location.toLowerCase().includes('china')) ? 7 : 4;
  const overallRisk = Math.round((supplierRisk + logisticsRisk + geopoliticalRisk) / 3);
  
  return {
    scores: {
      overallRiskScore: overallRisk,
      supplierRiskScore: supplierRisk,
      logisticsRiskScore: logisticsRisk,
      geopoliticalRiskScore: geopoliticalRisk
    },
    vulnerabilities: [
      {
        id: "vuln_001",
        title: data.suppliers.length === 1 ? "Single Supplier Dependency" : "Supplier Concentration Risk",
        description: `Reliance on ${data.suppliers.length} supplier(s) creates supply chain vulnerability.`,
        severity: "HIGH" as const,
        score: supplierRisk,
        impactTimeline: "Immediate to weeks",
        potentialCost: "Hundreds of thousands USD"
      },
      {
        id: "vuln_002", 
        title: "Logistics Disruption Risk",
        description: `Transportation via ${Object.entries(data.transportationMethods).filter(([_, used]) => used).map(([method]) => method).join(', ')} may face disruptions.`,
        severity: "MEDIUM" as const,
        score: logisticsRisk,
        impactTimeline: "Days to weeks", 
        potentialCost: "Tens of thousands USD"
      }
    ],
    recommendations: [
      {
        id: "rec_001",
        title: "Diversify Supplier Base",
        description: "Identify and qualify alternative suppliers to reduce dependency risk.",
        timeline: "3-6 months",
        priority: "Critical" as const
      },
      {
        id: "rec_002", 
        title: "Strengthen Logistics Planning",
        description: "Develop contingency plans for transportation disruptions.",
        timeline: "1-3 months",
        priority: "High" as const
      }
    ]
  };
}

function createAssessmentPrompt(data: AssessmentInput): string {
  const suppliers = data.suppliers.map(s => `${s.name}@${s.location}`).join(',');
  const transport = Object.entries(data.transportationMethods).filter(([_, used]) => used).map(([method]) => method).join(',');
  
  return `Risk analysis: Company=${data.companyName}, Suppliers=${suppliers}, Transport=${transport}, Issues=${data.riskFactors}. Return JSON: scores{overall,supplier,logistics,geopolitical:0-10}, vulnerabilities[3]{id,title,description,severity,score,impactTimeline,potentialCost}, recommendations[3]{id,title,description,timeline,priority}. Brief.`;
}

export async function checkGeminiApiHealth(): Promise<boolean> {
  try {
    // Model metadata is enough to validate the key and model access without
    // consuming a generation request or triggering rate-limit fluctuations.
    await ai.models.get({ model: "gemini-3.6-flash" });
    return true;
  } catch (error) {
    console.error("Gemini API health check failed:", error);
    return false;
  }
}
