// api/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  assessments;
  constructor() {
    this.assessments = /* @__PURE__ */ new Map();
  }
  async getAssessment(id) {
    return this.assessments.get(id);
  }
  async getAllAssessments() {
    return Array.from(this.assessments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  async createAssessment(assessmentData) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const assessment = {
      id,
      companyName: assessmentData.companyName,
      industry: assessmentData.industry,
      suppliers: assessmentData.suppliers,
      logisticsRoutes: assessmentData.logisticsRoutes,
      transportationMethods: assessmentData.transportationMethods,
      riskFactors: assessmentData.riskFactors,
      overallRiskScore: null,
      supplierRiskScore: null,
      logisticsRiskScore: null,
      geopoliticalRiskScore: null,
      vulnerabilities: null,
      recommendations: null,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    this.assessments.set(id, assessment);
    return assessment;
  }
  async updateAssessment(id, updates) {
    const existing = this.assessments.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.assessments.set(id, updated);
    return updated;
  }
};
var storage = new MemStorage();

// server/services/gemini.ts
import { GoogleGenAI } from "@google/genai";
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
});
async function analyzeSupplyChainVulnerabilities(assessmentData) {
  const startTime = Date.now();
  console.log("\u26A1 Starting ultra-fast analysis...");
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Gemini API timeout - using fallback analysis")), 1e4);
  });
  try {
    const prompt = createAssessmentPrompt(assessmentData);
    console.log(`\u{1F4DD} Ultra-short prompt (${prompt.length} chars):`, prompt.substring(0, 100) + "...");
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
    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    console.log("Gemini API response received");
    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }
    console.log("Parsing Gemini response...");
    const data = JSON.parse(rawJson);
    console.log("\u2705 Gemini analysis completed successfully");
    return data;
  } catch (error) {
    console.error("\u274C Gemini API Error:", error);
    if (error instanceof Error && error.message.includes("timeout")) {
      console.log("\u{1F504} Providing fallback analysis due to timeout");
      return createFallbackAnalysis(assessmentData);
    }
    throw new Error(`Failed to analyze supply chain vulnerabilities: ${error}`);
  }
}
function createFallbackAnalysis(data) {
  console.log("\u{1F4CA} Generating fallback risk analysis");
  const supplierRisk = data.suppliers.length === 1 ? 8 : 5;
  const logisticsRisk = data.riskFactors.toLowerCase().includes("port") ? 7 : 4;
  const geopoliticalRisk = data.suppliers.some((s) => s.location.toLowerCase().includes("china")) ? 7 : 4;
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
        severity: "HIGH",
        score: supplierRisk,
        impactTimeline: "Immediate to weeks",
        potentialCost: "Hundreds of thousands USD"
      },
      {
        id: "vuln_002",
        title: "Logistics Disruption Risk",
        description: `Transportation via ${Object.entries(data.transportationMethods).filter(([_, used]) => used).map(([method]) => method).join(", ")} may face disruptions.`,
        severity: "MEDIUM",
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
        priority: "Critical"
      },
      {
        id: "rec_002",
        title: "Strengthen Logistics Planning",
        description: "Develop contingency plans for transportation disruptions.",
        timeline: "1-3 months",
        priority: "High"
      }
    ]
  };
}
function createAssessmentPrompt(data) {
  const suppliers = data.suppliers.map((s) => `${s.name}@${s.location}`).join(",");
  const transport = Object.entries(data.transportationMethods).filter(([_, used]) => used).map(([method]) => method).join(",");
  return `Risk analysis: Company=${data.companyName}, Suppliers=${suppliers}, Transport=${transport}, Issues=${data.riskFactors}. Return JSON: scores{overall,supplier,logistics,geopolitical:0-10}, vulnerabilities[3]{id,title,description,severity,score,impactTimeline,potentialCost}, recommendations[3]{id,title,description,timeline,priority}. Brief.`;
}
async function checkGeminiApiHealth() {
  try {
    await ai.models.get({ model: "gemini-3.6-flash" });
    return true;
  } catch (error) {
    console.error("Gemini API health check failed:", error);
    return false;
  }
}

// server/routes.ts
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  suppliers: jsonb("suppliers").notNull(),
  logisticsRoutes: text("logistics_routes").notNull(),
  transportationMethods: jsonb("transportation_methods").notNull(),
  riskFactors: text("risk_factors").notNull(),
  overallRiskScore: real("overall_risk_score"),
  supplierRiskScore: real("supplier_risk_score"),
  logisticsRiskScore: real("logistics_risk_score"),
  geopoliticalRiskScore: real("geopolitical_risk_score"),
  vulnerabilities: jsonb("vulnerabilities"),
  recommendations: jsonb("recommendations"),
  status: text("status").notNull().default("pending"),
  // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertAssessmentSchema = createInsertSchema(assessments).pick({
  companyName: true,
  industry: true,
  suppliers: true,
  logisticsRoutes: true,
  transportationMethods: true,
  riskFactors: true
});
var supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  location: z.string().min(1, "Location is required"),
  criticality: z.enum(["High", "Medium", "Low"]),
  products: z.string().min(1, "Products/services description is required")
});
var transportationMethodsSchema = z.object({
  ocean: z.boolean().default(false),
  air: z.boolean().default(false),
  truck: z.boolean().default(false),
  rail: z.boolean().default(false)
});
var assessmentInputSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  suppliers: z.array(supplierSchema).min(1, "At least one supplier is required"),
  logisticsRoutes: z.string().min(1, "Logistics routes are required"),
  transportationMethods: transportationMethodsSchema,
  riskFactors: z.string().min(1, "Risk factors are required")
});
var vulnerabilitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
  score: z.number(),
  impactTimeline: z.string(),
  potentialCost: z.string()
});
var recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  timeline: z.string(),
  priority: z.enum(["Critical", "High", "Medium", "Low"])
});

// server/routes.ts
import { fromZodError } from "zod-validation-error";
var ai2 = new GoogleGenAI2({
  apiKey: process.env.GEMINI_API_KEY || ""
});
async function registerRoutes(app2) {
  app2.get("/api/health", async (req, res) => {
    try {
      const geminiHealthy = await checkGeminiApiHealth();
      res.json({
        status: "ok",
        gemini: geminiHealthy ? "connected" : "disconnected",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Health check failed",
        gemini: "disconnected"
      });
    }
  });
  app2.get("/api/assessments", async (req, res) => {
    try {
      const assessments2 = await storage.getAllAssessments();
      res.json(assessments2);
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
      res.status(500).json({
        message: "Failed to fetch assessments",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/assessments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("Failed to fetch assessment:", error);
      res.status(500).json({
        message: "Failed to fetch assessment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/assessments", async (req, res) => {
    try {
      const validationResult = assessmentInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationError.details
        });
      }
      const assessmentData = validationResult.data;
      const assessment = await storage.createAssessment(assessmentData);
      res.status(201).json(assessment);
      processAssessmentAsync(assessment.id, assessmentData);
    } catch (error) {
      console.error("Failed to create assessment:", error);
      res.status(500).json({
        message: "Failed to create assessment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.patch("/api/assessments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedAssessment = await storage.updateAssessment(id, updates);
      if (!updatedAssessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(updatedAssessment);
    } catch (error) {
      console.error("Failed to update assessment:", error);
      res.status(500).json({
        message: "Failed to update assessment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/security/trigger-event", async (req, res) => {
    try {
      const securityEvents = [
        {
          id: Date.now().toString(),
          title: "Customs Security Tightened at Port Shanghai",
          location: "Port Shanghai, China",
          severity: "High",
          duration: "12 days",
          inspectionRate: "35%",
          clearanceTime: "\xD72.1",
          confidence: "85%",
          description: "Enhanced security protocols implemented due to geopolitical tensions",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: Date.now().toString(),
          title: "Port Strike Negotiations at Rotterdam",
          location: "Rotterdam Port, Netherlands",
          severity: "Medium",
          duration: "7 days",
          inspectionRate: "15%",
          clearanceTime: "\xD71.3",
          confidence: "70%",
          description: "Labor union negotiations affecting port operations",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: Date.now().toString(),
          title: "Cyber Security Breach Detection",
          location: "Los Angeles Port, USA",
          severity: "Critical",
          duration: "5 days",
          inspectionRate: "50%",
          clearanceTime: "\xD73.0",
          confidence: "95%",
          description: "Potential cyber threat detected in port management systems",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
      const randomEvent = securityEvents[Math.floor(Math.random() * securityEvents.length)];
      res.json({
        success: true,
        message: "Security event triggered successfully",
        event: randomEvent
      });
    } catch (error) {
      console.error("Failed to trigger security event:", error);
      res.status(500).json({
        success: false,
        message: "Failed to trigger security event",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/security/weather-alert", async (req, res) => {
    try {
      const weatherAlerts = [
        {
          id: Date.now().toString(),
          type: "Typhoon Warning",
          location: "South China Sea",
          severity: "High",
          affectedPorts: ["Hong Kong", "Shanghai", "Ningbo"],
          duration: "72 hours",
          windSpeed: "150 km/h",
          visibility: "< 500m",
          recommendation: "All maritime operations suspended",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: Date.now().toString(),
          type: "Fog Advisory",
          location: "North Atlantic",
          severity: "Medium",
          affectedPorts: ["New York", "Boston", "Halifax"],
          duration: "24 hours",
          windSpeed: "25 km/h",
          visibility: "< 200m",
          recommendation: "Reduced vessel speed, enhanced navigation",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: Date.now().toString(),
          type: "Storm Warning",
          location: "Mediterranean Sea",
          severity: "Medium",
          affectedPorts: ["Barcelona", "Marseille", "Naples"],
          duration: "48 hours",
          windSpeed: "85 km/h",
          visibility: "1-2 km",
          recommendation: "Monitor vessel schedules, potential delays",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
      const randomAlert = weatherAlerts[Math.floor(Math.random() * weatherAlerts.length)];
      res.json({
        success: true,
        message: "Weather alert retrieved successfully",
        alert: randomAlert
      });
    } catch (error) {
      console.error("Failed to check weather alert:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check weather alert",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/ai/fill-suppliers", async (req, res) => {
    try {
      const { companyName, industry, supplierName, location } = req.body;
      const prompt = `Company: ${companyName}, Industry: ${industry}. For supplier "${supplierName}" in "${location}", suggest:
1. 3-5 relevant products/services they likely provide
2. Criticality level (High/Medium/Low) with reasoning
3. Brief explanation why this criticality level

Return JSON: {"products": ["product1", "product2"], "criticality": "High", "reasoning": "brief explanation"}`;
      const response = await ai2.models.generateContent({
        model: "gemini-3.6-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              products: { type: "array", items: { type: "string" } },
              criticality: { type: "string", enum: ["High", "Medium", "Low"] },
              reasoning: { type: "string" }
            },
            required: ["products", "criticality", "reasoning"]
          }
        },
        contents: prompt
      });
      const data = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        suggestions: {
          products: data.products?.join(", ") || "",
          criticality: data.criticality || "Medium",
          reasoning: data.reasoning || "AI analysis based on industry standards"
        }
      });
    } catch (error) {
      console.error("AI Fill Suppliers failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate supplier suggestions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/ai/detect-risks", async (req, res) => {
    try {
      const { companyName, industry, suppliers, logisticsRoutes, transportationMethods } = req.body;
      const supplierInfo = suppliers?.map((s) => `${s.name} in ${s.location}`)?.join(", ") || "No suppliers specified";
      const transportInfo = Object.entries(transportationMethods || {}).filter(([_, used]) => used).map(([method]) => method).join(", ") || "No transport specified";
      const prompt = `Risk analysis for ${industry} company "${companyName}":
- Suppliers: ${supplierInfo}
- Routes: ${logisticsRoutes || "Not specified"}
- Transport: ${transportInfo}

Analyze and return JSON with risk factors, scores (0-100), and explanations:
{"riskFactors": [{"name": "Risk Name", "score": 75, "explanation": "Why this risk exists", "checked": true}]}`;
      const response = await ai2.models.generateContent({
        model: "gemini-3.6-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              riskFactors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    score: { type: "number" },
                    explanation: { type: "string" },
                    checked: { type: "boolean" }
                  },
                  required: ["name", "score", "explanation", "checked"]
                }
              }
            },
            required: ["riskFactors"]
          }
        },
        contents: prompt
      });
      const data = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        riskFactors: data.riskFactors || []
      });
    } catch (error) {
      console.error("Auto-detect Risks failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to detect risk factors",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/global-alerts", async (req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockAlerts = [
      {
        id: "live-1",
        severity: "Critical",
        type: "port",
        headline: "Shanghai Port congestion reaching critical levels",
        description: "Unprecedented cargo volume causing 4-6 day delays. Customs processing severely backlogged.",
        source: "Port Authority Shanghai",
        timestamp: new Date(Date.now() - 5 * 60 * 1e3).toISOString(),
        suggestedAction: "Immediate rerouting to Ningbo or Qingdao ports recommended"
      },
      {
        id: "live-2",
        severity: "Warning",
        type: "weather",
        headline: "Severe storm system approaching Pacific shipping lanes",
        description: "Major storm system with 80mph winds expected to impact trans-Pacific routes.",
        source: "NOAA Maritime Weather",
        timestamp: new Date(Date.now() - 12 * 60 * 1e3).toISOString(),
        suggestedAction: "Delay departures or reroute through southern corridors"
      },
      {
        id: "live-3",
        severity: "Critical",
        type: "strike",
        headline: "Port workers strike escalates at European terminals",
        description: "Strike action spreads to Rotterdam and Hamburg, affecting 60% of container operations.",
        source: "European Transport Workers",
        timestamp: new Date(Date.now() - 25 * 60 * 1e3).toISOString(),
        suggestedAction: "Consider alternative ports in UK or Mediterranean"
      },
      {
        id: "live-4",
        severity: "Info",
        type: "port",
        headline: "Singapore Port unveils AI-powered cargo tracking",
        description: "New system promises 40% faster container processing and real-time visibility.",
        source: "PSA Singapore",
        timestamp: new Date(Date.now() - 45 * 60 * 1e3).toISOString(),
        suggestedAction: "Leverage new tracking features for improved supply chain visibility"
      }
    ];
    res.json(mockAlerts);
  });
  app2.get("/api/ports/status", (req, res) => {
    const currentTime = Date.now();
    const portStatuses = [
      {
        id: "us-west",
        name: "Los Angeles Port",
        x: 18,
        y: 42,
        status: Math.random() > 0.8 ? "warning" : "active",
        connections: 12,
        region: "North America",
        inspectionRate: Math.floor(85 + Math.random() * 15),
        clearanceTimeMultiplier: (0.8 + Math.random() * 0.6).toFixed(1),
        weatherAlert: Math.random() > 0.7 ? "Clear skies" : "Partly cloudy",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "us-east",
        name: "New York Port",
        x: 28,
        y: 38,
        status: "active",
        connections: 8,
        region: "North America",
        inspectionRate: Math.floor(80 + Math.random() * 20),
        clearanceTimeMultiplier: (0.9 + Math.random() * 0.4).toFixed(1),
        weatherAlert: Math.random() > 0.6 ? "Clear" : "Light rain",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "europe",
        name: "Rotterdam Port",
        x: 52,
        y: 32,
        status: Math.random() > 0.6 ? "warning" : "active",
        connections: 15,
        region: "Europe",
        inspectionRate: Math.floor(75 + Math.random() * 25),
        clearanceTimeMultiplier: (1 + Math.random() * 0.8).toFixed(1),
        weatherAlert: Math.random() > 0.5 ? "Overcast" : "Windy conditions",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "uk",
        name: "London Gateway",
        x: 50,
        y: 34,
        status: "active",
        connections: 6,
        region: "Europe",
        inspectionRate: Math.floor(82 + Math.random() * 18),
        clearanceTimeMultiplier: (0.7 + Math.random() * 0.5).toFixed(1),
        weatherAlert: "Fog advisory",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "asia-east",
        name: "Shanghai Port",
        x: 85,
        y: 40,
        status: Math.random() > 0.3 ? "critical" : "warning",
        connections: 20,
        region: "Asia Pacific",
        inspectionRate: Math.floor(60 + Math.random() * 30),
        clearanceTimeMultiplier: (1.4 + Math.random() * 0.8).toFixed(1),
        weatherAlert: Math.random() > 0.4 ? "High congestion" : "Heavy traffic",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "asia-se",
        name: "Singapore Port",
        x: 78,
        y: 58,
        status: "active",
        connections: 14,
        region: "Asia Pacific",
        inspectionRate: Math.floor(88 + Math.random() * 12),
        clearanceTimeMultiplier: (0.6 + Math.random() * 0.4).toFixed(1),
        weatherAlert: "Optimal conditions",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "india",
        name: "Mumbai Port",
        x: 74,
        y: 50,
        status: Math.random() > 0.7 ? "warning" : "active",
        connections: 9,
        region: "Asia Pacific",
        inspectionRate: Math.floor(70 + Math.random() * 25),
        clearanceTimeMultiplier: (1.1 + Math.random() * 0.6).toFixed(1),
        weatherAlert: Math.random() > 0.5 ? "Monsoon season" : "Clear weather",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "middle-east",
        name: "Dubai Port",
        x: 60,
        y: 48,
        status: "active",
        connections: 11,
        region: "Middle East",
        inspectionRate: Math.floor(85 + Math.random() * 15),
        clearanceTimeMultiplier: (0.8 + Math.random() * 0.5).toFixed(1),
        weatherAlert: "Hot and dry",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "africa",
        name: "Cape Town Port",
        x: 56,
        y: 72,
        status: "active",
        connections: 5,
        region: "Africa",
        inspectionRate: Math.floor(78 + Math.random() * 20),
        clearanceTimeMultiplier: (0.9 + Math.random() * 0.6).toFixed(1),
        weatherAlert: "Strong winds",
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: "brazil",
        name: "Santos Port",
        x: 38,
        y: 70,
        status: Math.random() > 0.8 ? "warning" : "active",
        connections: 7,
        region: "South America",
        inspectionRate: Math.floor(72 + Math.random() * 23),
        clearanceTimeMultiplier: (1 + Math.random() * 0.7).toFixed(1),
        weatherAlert: Math.random() > 0.6 ? "Tropical conditions" : "Humid weather",
        lastUpdated: new Date(currentTime).toISOString()
      }
    ];
    res.json(portStatuses);
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function processAssessmentAsync(assessmentId, assessmentData) {
  const startTime = Date.now();
  try {
    console.log(`\u{1F680} SPEED MODE: Starting analysis for ${assessmentId}`);
    await storage.updateAssessment(assessmentId, { status: "processing" });
    const maxProcessingTime = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Maximum processing time exceeded - using fallback"));
      }, 11e3);
    });
    const analysisPromise = analyzeSupplyChainVulnerabilities(assessmentData);
    const analysisResult = await Promise.race([analysisPromise, maxProcessingTime]);
    await storage.updateAssessment(assessmentId, {
      status: "completed",
      overallRiskScore: analysisResult.scores.overallRiskScore,
      supplierRiskScore: analysisResult.scores.supplierRiskScore,
      logisticsRiskScore: analysisResult.scores.logisticsRiskScore,
      geopoliticalRiskScore: analysisResult.scores.geopoliticalRiskScore,
      vulnerabilities: analysisResult.vulnerabilities,
      recommendations: analysisResult.recommendations
    });
    const duration = Date.now() - startTime;
    console.log(`\u26A1 SPEED ANALYSIS completed for ${assessmentId} in ${duration}ms (${(duration / 1e3).toFixed(1)}s)`);
  } catch (error) {
    console.error("\u26A0\uFE0F Analysis failed, using emergency fallback:", error);
    const fallbackResult = createEmergencyFallback(assessmentData);
    await storage.updateAssessment(assessmentId, {
      status: "completed",
      overallRiskScore: fallbackResult.scores.overallRiskScore,
      supplierRiskScore: fallbackResult.scores.supplierRiskScore,
      logisticsRiskScore: fallbackResult.scores.logisticsRiskScore,
      geopoliticalRiskScore: fallbackResult.scores.geopoliticalRiskScore,
      vulnerabilities: fallbackResult.vulnerabilities,
      recommendations: fallbackResult.recommendations
    });
    const duration = Date.now() - startTime;
    console.log(`\u26A1 FALLBACK completed for ${assessmentId} in ${duration}ms`);
  }
}
function createEmergencyFallback(data) {
  const supplierRisk = data.suppliers?.length === 1 ? 8 : 5;
  const hasPortRisk = data.riskFactors?.toLowerCase().includes("port") || data.riskFactors?.toLowerCase().includes("congestion");
  const logisticsRisk = hasPortRisk ? 7 : 4;
  const hasChinaRisk = data.suppliers?.some((s) => s.location?.toLowerCase().includes("china"));
  const geopoliticalRisk = hasChinaRisk ? 7 : 4;
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
        title: "Supply Chain Concentration Risk",
        description: `Limited supplier diversity creates vulnerability to disruptions.`,
        severity: "HIGH",
        score: supplierRisk,
        impactTimeline: "Immediate to weeks",
        potentialCost: "$100K-$1M USD"
      },
      {
        id: "vuln_002",
        title: "Logistics Bottleneck Risk",
        description: "Transportation dependencies may cause delays.",
        severity: "MEDIUM",
        score: logisticsRisk,
        impactTimeline: "Days to weeks",
        potentialCost: "$50K-$500K USD"
      }
    ],
    recommendations: [
      {
        id: "rec_001",
        title: "Diversify Supplier Network",
        description: "Add backup suppliers to reduce single points of failure.",
        timeline: "3-6 months",
        priority: "Critical"
      },
      {
        id: "rec_002",
        title: "Optimize Logistics Routes",
        description: "Develop alternative transportation and routing plans.",
        timeline: "1-3 months",
        priority: "High"
      }
    ]
  };
}

// api/index.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
await registerRoutes(app);
var index_default = app;
export {
  index_default as default
};
