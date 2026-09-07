import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeSupplyChainVulnerabilities, checkGeminiApiHealth } from "./services/gemini";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || ""
});
import { assessmentInputSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const geminiHealthy = await checkGeminiApiHealth();
      res.json({ 
        status: "ok", 
        gemini: geminiHealthy ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        message: "Health check failed",
        gemini: "disconnected"
      });
    }
  });

  // Get all assessments
  app.get("/api/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
      res.status(500).json({ 
        message: "Failed to fetch assessments",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get specific assessment
  app.get("/api/assessments/:id", async (req, res) => {
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

  // Create new assessment
  app.post("/api/assessments", async (req, res) => {
    try {
      // Validate request body
      const validationResult = assessmentInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationError.details
        });
      }

      const assessmentData = validationResult.data;
      
      // Create assessment record
      const assessment = await storage.createAssessment(assessmentData);
      
      // Return initial assessment
      res.status(201).json(assessment);
      
      // Process assessment asynchronously
      processAssessmentAsync(assessment.id, assessmentData);
      
    } catch (error) {
      console.error("Failed to create assessment:", error);
      res.status(500).json({ 
        message: "Failed to create assessment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update assessment status
  app.patch("/api/assessments/:id", async (req, res) => {
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

  // Trigger security event endpoint
  app.post("/api/security/trigger-event", async (req, res) => {
    try {
      const securityEvents = [
        {
          id: Date.now().toString(),
          title: "Customs Security Tightened at Port Shanghai",
          location: "Port Shanghai, China",
          severity: "High",
          duration: "12 days",
          inspectionRate: "35%",
          clearanceTime: "×2.1",
          confidence: "85%",
          description: "Enhanced security protocols implemented due to geopolitical tensions",
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now().toString(),
          title: "Port Strike Negotiations at Rotterdam",
          location: "Rotterdam Port, Netherlands",
          severity: "Medium",
          duration: "7 days",
          inspectionRate: "15%",
          clearanceTime: "×1.3",
          confidence: "70%",
          description: "Labor union negotiations affecting port operations",
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now().toString(),
          title: "Cyber Security Breach Detection",
          location: "Los Angeles Port, USA",
          severity: "Critical",
          duration: "5 days",
          inspectionRate: "50%",
          clearanceTime: "×3.0",
          confidence: "95%",
          description: "Potential cyber threat detected in port management systems",
          timestamp: new Date().toISOString()
        }
      ];
      
      // Select a random event
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

  // Check weather alert endpoint
  app.get("/api/security/weather-alert", async (req, res) => {
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
          timestamp: new Date().toISOString()
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
          timestamp: new Date().toISOString()
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
          timestamp: new Date().toISOString()
        }
      ];
      
      // Select a random weather alert
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

  // AI Fill Suppliers endpoint
  app.post("/api/ai/fill-suppliers", async (req, res) => {
    try {
      const { companyName, industry, supplierName, location } = req.body;
      
      const prompt = `Company: ${companyName}, Industry: ${industry}. For supplier "${supplierName}" in "${location}", suggest:
1. 3-5 relevant products/services they likely provide
2. Criticality level (High/Medium/Low) with reasoning
3. Brief explanation why this criticality level

Return JSON: {"products": ["product1", "product2"], "criticality": "High", "reasoning": "brief explanation"}`;
      
      const response = await ai.models.generateContent({
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
      
      const data = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        suggestions: {
          products: data.products?.join(', ') || '',
          criticality: data.criticality || 'Medium',
          reasoning: data.reasoning || 'AI analysis based on industry standards'
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

  // Auto-detect Risks endpoint  
  app.post("/api/ai/detect-risks", async (req, res) => {
    try {
      const { companyName, industry, suppliers, logisticsRoutes, transportationMethods } = req.body;
      
      const supplierInfo = suppliers?.map((s: any) => `${s.name} in ${s.location}`)?.join(', ') || 'No suppliers specified';
      const transportInfo = Object.entries(transportationMethods || {}).filter(([_, used]) => used).map(([method]) => method).join(', ') || 'No transport specified';
      
      const prompt = `Risk analysis for ${industry} company "${companyName}":
- Suppliers: ${supplierInfo}
- Routes: ${logisticsRoutes || 'Not specified'}
- Transport: ${transportInfo}

Analyze and return JSON with risk factors, scores (0-100), and explanations:
{"riskFactors": [{"name": "Risk Name", "score": 75, "explanation": "Why this risk exists", "checked": true}]}`;
      
      const response = await ai.models.generateContent({
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
      
      const data = JSON.parse(response.text || '{}');
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

  // Mock Global Alerts endpoint
  app.get("/api/global-alerts", async (req, res) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock alerts data
    const mockAlerts = [
      {
        id: 'live-1',
        severity: 'Critical',
        type: 'port',
        headline: 'Shanghai Port congestion reaching critical levels',
        description: 'Unprecedented cargo volume causing 4-6 day delays. Customs processing severely backlogged.',
        source: 'Port Authority Shanghai',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        suggestedAction: 'Immediate rerouting to Ningbo or Qingdao ports recommended'
      },
      {
        id: 'live-2',
        severity: 'Warning',
        type: 'weather',
        headline: 'Severe storm system approaching Pacific shipping lanes',
        description: 'Major storm system with 80mph winds expected to impact trans-Pacific routes.',
        source: 'NOAA Maritime Weather',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        suggestedAction: 'Delay departures or reroute through southern corridors'
      },
      {
        id: 'live-3',
        severity: 'Critical',
        type: 'strike',
        headline: 'Port workers strike escalates at European terminals',
        description: 'Strike action spreads to Rotterdam and Hamburg, affecting 60% of container operations.',
        source: 'European Transport Workers',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        suggestedAction: 'Consider alternative ports in UK or Mediterranean'
      },
      {
        id: 'live-4',
        severity: 'Info',
        type: 'port',
        headline: 'Singapore Port unveils AI-powered cargo tracking',
        description: 'New system promises 40% faster container processing and real-time visibility.',
        source: 'PSA Singapore',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        suggestedAction: 'Leverage new tracking features for improved supply chain visibility'
      }
    ];
    
    res.json(mockAlerts);
  });

  // Port Status API for Interactive Map
  app.get("/api/ports/status", (req, res) => {
    const currentTime = Date.now();
    const portStatuses = [
      {
        id: 'us-west',
        name: 'Los Angeles Port',
        x: 18,
        y: 42,
        status: Math.random() > 0.8 ? 'warning' : 'active',
        connections: 12,
        region: 'North America',
        inspectionRate: Math.floor(85 + Math.random() * 15),
        clearanceTimeMultiplier: (0.8 + Math.random() * 0.6).toFixed(1),
        weatherAlert: Math.random() > 0.7 ? 'Clear skies' : 'Partly cloudy',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'us-east',
        name: 'New York Port',
        x: 28,
        y: 38,
        status: 'active',
        connections: 8,
        region: 'North America',
        inspectionRate: Math.floor(80 + Math.random() * 20),
        clearanceTimeMultiplier: (0.9 + Math.random() * 0.4).toFixed(1),
        weatherAlert: Math.random() > 0.6 ? 'Clear' : 'Light rain',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'europe',
        name: 'Rotterdam Port',
        x: 52,
        y: 32,
        status: Math.random() > 0.6 ? 'warning' : 'active',
        connections: 15,
        region: 'Europe',
        inspectionRate: Math.floor(75 + Math.random() * 25),
        clearanceTimeMultiplier: (1.0 + Math.random() * 0.8).toFixed(1),
        weatherAlert: Math.random() > 0.5 ? 'Overcast' : 'Windy conditions',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'uk',
        name: 'London Gateway',
        x: 50,
        y: 34,
        status: 'active',
        connections: 6,
        region: 'Europe',
        inspectionRate: Math.floor(82 + Math.random() * 18),
        clearanceTimeMultiplier: (0.7 + Math.random() * 0.5).toFixed(1),
        weatherAlert: 'Fog advisory',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'asia-east',
        name: 'Shanghai Port',
        x: 85,
        y: 40,
        status: Math.random() > 0.3 ? 'critical' : 'warning',
        connections: 20,
        region: 'Asia Pacific',
        inspectionRate: Math.floor(60 + Math.random() * 30),
        clearanceTimeMultiplier: (1.4 + Math.random() * 0.8).toFixed(1),
        weatherAlert: Math.random() > 0.4 ? 'High congestion' : 'Heavy traffic',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'asia-se',
        name: 'Singapore Port',
        x: 78,
        y: 58,
        status: 'active',
        connections: 14,
        region: 'Asia Pacific',
        inspectionRate: Math.floor(88 + Math.random() * 12),
        clearanceTimeMultiplier: (0.6 + Math.random() * 0.4).toFixed(1),
        weatherAlert: 'Optimal conditions',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'india',
        name: 'Mumbai Port',
        x: 74,
        y: 50,
        status: Math.random() > 0.7 ? 'warning' : 'active',
        connections: 9,
        region: 'Asia Pacific',
        inspectionRate: Math.floor(70 + Math.random() * 25),
        clearanceTimeMultiplier: (1.1 + Math.random() * 0.6).toFixed(1),
        weatherAlert: Math.random() > 0.5 ? 'Monsoon season' : 'Clear weather',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'middle-east',
        name: 'Dubai Port',
        x: 60,
        y: 48,
        status: 'active',
        connections: 11,
        region: 'Middle East',
        inspectionRate: Math.floor(85 + Math.random() * 15),
        clearanceTimeMultiplier: (0.8 + Math.random() * 0.5).toFixed(1),
        weatherAlert: 'Hot and dry',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'africa',
        name: 'Cape Town Port',
        x: 56,
        y: 72,
        status: 'active',
        connections: 5,
        region: 'Africa',
        inspectionRate: Math.floor(78 + Math.random() * 20),
        clearanceTimeMultiplier: (0.9 + Math.random() * 0.6).toFixed(1),
        weatherAlert: 'Strong winds',
        lastUpdated: new Date(currentTime).toISOString()
      },
      {
        id: 'brazil',
        name: 'Santos Port',
        x: 38,
        y: 70,
        status: Math.random() > 0.8 ? 'warning' : 'active',
        connections: 7,
        region: 'South America',
        inspectionRate: Math.floor(72 + Math.random() * 23),
        clearanceTimeMultiplier: (1.0 + Math.random() * 0.7).toFixed(1),
        weatherAlert: Math.random() > 0.6 ? 'Tropical conditions' : 'Humid weather',
        lastUpdated: new Date(currentTime).toISOString()
      }
    ];
    
    res.json(portStatuses);
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processAssessmentAsync(assessmentId: string, assessmentData: any) {
  const startTime = Date.now();
  try {
    console.log(`🚀 SPEED MODE: Starting analysis for ${assessmentId}`);
    
    // Update status to processing
    await storage.updateAssessment(assessmentId, { status: "processing" });
    
    // Set absolute maximum processing time of 11 seconds
    const maxProcessingTime = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Maximum processing time exceeded - using fallback"));
      }, 11000);
    });
    
    // Race between AI analysis and max time limit
    const analysisPromise = analyzeSupplyChainVulnerabilities(assessmentData);
    const analysisResult = await Promise.race([analysisPromise, maxProcessingTime]);
    
    // Update with results
    await storage.updateAssessment(assessmentId, {
      status: "completed",
      overallRiskScore: analysisResult.scores.overallRiskScore,
      supplierRiskScore: analysisResult.scores.supplierRiskScore,
      logisticsRiskScore: analysisResult.scores.logisticsRiskScore,
      geopoliticalRiskScore: analysisResult.scores.geopoliticalRiskScore,
      vulnerabilities: analysisResult.vulnerabilities,
      recommendations: analysisResult.recommendations,
    });
    
    const duration = Date.now() - startTime;
    console.log(`⚡ SPEED ANALYSIS completed for ${assessmentId} in ${duration}ms (${(duration/1000).toFixed(1)}s)`);
    
  } catch (error) {
    console.error("⚠️ Analysis failed, using emergency fallback:", error);
    
    // Emergency fallback analysis
    const fallbackResult = createEmergencyFallback(assessmentData);
    await storage.updateAssessment(assessmentId, {
      status: "completed",
      overallRiskScore: fallbackResult.scores.overallRiskScore,
      supplierRiskScore: fallbackResult.scores.supplierRiskScore,
      logisticsRiskScore: fallbackResult.scores.logisticsRiskScore,
      geopoliticalRiskScore: fallbackResult.scores.geopoliticalRiskScore,
      vulnerabilities: fallbackResult.vulnerabilities,
      recommendations: fallbackResult.recommendations,
    });
    
    const duration = Date.now() - startTime;
    console.log(`⚡ FALLBACK completed for ${assessmentId} in ${duration}ms`);
  }
}

function createEmergencyFallback(data: any) {
  // Ultra-fast risk calculation
  const supplierRisk = data.suppliers?.length === 1 ? 8 : 5;
  const hasPortRisk = data.riskFactors?.toLowerCase().includes('port') || data.riskFactors?.toLowerCase().includes('congestion');
  const logisticsRisk = hasPortRisk ? 7 : 4;
  const hasChinaRisk = data.suppliers?.some((s: any) => s.location?.toLowerCase().includes('china'));
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
