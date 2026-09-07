import { type Assessment, type InsertAssessment, type AssessmentInput } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getAssessment(id: string): Promise<Assessment | undefined>;
  getAllAssessments(): Promise<Assessment[]>;
  createAssessment(assessment: AssessmentInput): Promise<Assessment>;
  updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment | undefined>;
}

export class MemStorage implements IStorage {
  private assessments: Map<string, Assessment>;

  constructor() {
    this.assessments = new Map();
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createAssessment(assessmentData: AssessmentInput): Promise<Assessment> {
    const id = randomUUID();
    const now = new Date();
    
    const assessment: Assessment = {
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
      updatedAt: now,
    };
    
    this.assessments.set(id, assessment);
    return assessment;
  }

  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment | undefined> {
    const existing = this.assessments.get(id);
    if (!existing) return undefined;
    
    const updated: Assessment = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.assessments.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
