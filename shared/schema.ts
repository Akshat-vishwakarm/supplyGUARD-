import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const assessments = pgTable("assessments", {
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
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  companyName: true,
  industry: true,
  suppliers: true,
  logisticsRoutes: true,
  transportationMethods: true,
  riskFactors: true,
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  location: z.string().min(1, "Location is required"),
  criticality: z.enum(["High", "Medium", "Low"]),
  products: z.string().min(1, "Products/services description is required"),
});

export const transportationMethodsSchema = z.object({
  ocean: z.boolean().default(false),
  air: z.boolean().default(false),
  truck: z.boolean().default(false),
  rail: z.boolean().default(false),
});

export const assessmentInputSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  suppliers: z.array(supplierSchema).min(1, "At least one supplier is required"),
  logisticsRoutes: z.string().min(1, "Logistics routes are required"),
  transportationMethods: transportationMethodsSchema,
  riskFactors: z.string().min(1, "Risk factors are required"),
});

export const vulnerabilitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
  score: z.number(),
  impactTimeline: z.string(),
  potentialCost: z.string(),
});

export const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  timeline: z.string(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
});

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type AssessmentInput = z.infer<typeof assessmentInputSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type TransportationMethods = z.infer<typeof transportationMethodsSchema>;
export type Vulnerability = z.infer<typeof vulnerabilitySchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
