import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, FileText, Clock, DollarSign, Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RippleEffectSimulation from "./ripple-effect-simulation";
import SecurityEventMonitor from "./security-event-monitor";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Assessment, Vulnerability, Recommendation } from "@shared/schema";

interface AssessmentResultsProps {
  assessment: Assessment;
  onProcessingComplete: () => void;
}

export default function AssessmentResults({ assessment, onProcessingComplete }: AssessmentResultsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (assessment.status === "completed" || assessment.status === "failed") {
      onProcessingComplete();
    }
  }, [assessment.status, onProcessingComplete]);

  const retryAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/assessments/${assessment.id}`, {
        status: "pending"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Restarted",
        description: "Your assessment has been queued for retry.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessment.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry assessment.",
        variant: "destructive",
      });
    },
  });

  const refreshAssessment = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessment.id] });
    toast({
      title: "Assessment Refreshed",
      description: "Latest data has been loaded.",
    });
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      pdf.setFontSize(18);
      pdf.text('Supply Chain Vulnerability Assessment Report', 20, 20);
      
      // Company Information
      pdf.setFontSize(12);
      pdf.text(`Company: ${assessment.companyName}`, 20, 35);
      pdf.text(`Industry: ${assessment.industry}`, 20, 45);
      pdf.text(`Generated: ${formatDate(assessment.updatedAt)}`, 20, 55);
      pdf.text(`Assessment ID: ${assessment.id.substring(0, 8)}...`, 20, 65);

      // Risk Scores Section
      pdf.setFontSize(14);
      pdf.text('RISK SCORES', 20, 85);
      pdf.setFontSize(11);
      let yPos = 95;
      pdf.text(`Overall Risk Score: ${assessment.overallRiskScore?.toFixed(1) || 'N/A'} / 10`, 25, yPos);
      pdf.text(`Supplier Risk Score: ${assessment.supplierRiskScore?.toFixed(1) || 'N/A'} / 10`, 25, yPos + 10);
      pdf.text(`Logistics Risk Score: ${assessment.logisticsRiskScore?.toFixed(1) || 'N/A'} / 10`, 25, yPos + 20);
      pdf.text(`Geopolitical Risk Score: ${assessment.geopoliticalRiskScore?.toFixed(1) || 'N/A'} / 10`, 25, yPos + 30);
      
      yPos += 50;
      
      // Vulnerabilities Section
      if (assessment.vulnerabilities && Array.isArray(assessment.vulnerabilities)) {
        pdf.setFontSize(14);
        pdf.text('IDENTIFIED VULNERABILITIES', 20, yPos);
        yPos += 15;
        
        const vulnerabilities = assessment.vulnerabilities as Vulnerability[];
        vulnerabilities.forEach((vuln, index) => {
          if (yPos > 270) { // Start new page if near bottom
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFontSize(11);
          pdf.text(`${index + 1}. ${vuln.title} (${vuln.severity})`, 25, yPos);
          yPos += 8;
          
          // Wrap description text
          const lines = pdf.splitTextToSize(vuln.description, 160);
          pdf.setFontSize(10);
          lines.forEach((line: string) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(line, 30, yPos);
            yPos += 6;
          });
          yPos += 5;
        });
      }
      
      // Recommendations Section
      if (assessment.recommendations && Array.isArray(assessment.recommendations)) {
        if (yPos > 200) { // Start new page if not enough space
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(14);
        pdf.text('RECOMMENDATIONS', 20, yPos);
        yPos += 15;
        
        const recommendations = assessment.recommendations as Recommendation[];
        recommendations.forEach((rec, index) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFontSize(11);
          pdf.text(`${index + 1}. ${rec.title} (${rec.priority})`, 25, yPos);
          yPos += 8;
          
          const lines = pdf.splitTextToSize(rec.description, 160);
          pdf.setFontSize(10);
          lines.forEach((line: string) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(line, 30, yPos);
            yPos += 6;
          });
          yPos += 5;
        });
      }
      
      // Footer
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text('Generated by SecureSupply AI', 20, 285);
        pdf.text(`Page ${i} of ${pageCount}`, 180, 285);
      }
      
      // Save the PDF
      const filename = `vulnerability-assessment-${assessment.companyName.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast({
        title: "PDF Report Downloaded",
        description: `Assessment report saved as ${filename}`,
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (score: number | null): string => {
    if (!score) return "gray";
    if (score >= 7) return "red";
    if (score >= 4) return "orange";
    return "green";
  };

  const getRiskColorClass = (score: number | null, type: 'text' | 'bg' = 'text'): string => {
    const color = getRiskColor(score);
    const prefix = type === 'text' ? 'text-' : 'bg-';
    return `${prefix}${color}-600`;
  };

  const getRiskLabel = (score: number | null) => {
    if (!score) return "N/A";
    if (score >= 7) return "High Risk";
    if (score >= 4) return "Medium Risk";
    return "Low Risk";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH": return "destructive";
      case "MEDIUM": return "secondary";
      case "LOW": return "outline";
      default: return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive";
      case "High": return "secondary";
      case "Medium": return "outline";
      case "Low": return "outline";
      default: return "secondary";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  if (assessment.status === "pending" || assessment.status === "processing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processing Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {assessment.status === "pending" ? "Queued for Analysis" : "Analyzing Supply Chain"}
            </h3>
            <p className="text-gray-600 text-sm">
              {assessment.status === "pending" 
                ? "Your assessment is queued and will begin processing shortly..."
                : "Gemini AI is processing your data and identifying vulnerabilities..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assessment.status === "failed") {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-900">Assessment Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</h3>
            <p className="text-red-800 text-sm mb-4">
              We encountered an error while processing your assessment. This could be due to API rate limits or service issues.
            </p>
            <Button 
              variant="outline" 
              onClick={() => retryAssessmentMutation.mutate()}
              disabled={retryAssessmentMutation.isPending}
              data-testid="button-retry-assessment"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryAssessmentMutation.isPending ? 'Retrying...' : 'Retry Assessment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vulnerability Assessment Results</CardTitle>
            <p className="text-gray-600 mt-1">
              Generated by Gemini AI • <span data-testid="text-assessment-timestamp">{formatDate(assessment.updatedAt)}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={refreshAssessment} data-testid="button-refresh-assessment">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={exportToPDF} data-testid="button-export-pdf">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Risk Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <Progress 
                value={(assessment.overallRiskScore || 0) * 10} 
                className="w-24 h-24 rotate-[-90deg]" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getRiskColorClass(assessment.overallRiskScore)}`} data-testid="text-overall-score">
                  {assessment.overallRiskScore?.toFixed(1) || "N/A"}
                </span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Overall Risk</h3>
            <p className={`text-xs font-medium ${getRiskColorClass(assessment.overallRiskScore)}`}>
              {getRiskLabel(assessment.overallRiskScore)}
            </p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getRiskColorClass(assessment.supplierRiskScore)}`} data-testid="text-supplier-score">
              {assessment.supplierRiskScore?.toFixed(1) || "N/A"}
            </div>
            <h3 className="text-sm font-medium text-gray-900">Supplier Risk</h3>
            <p className={`text-xs ${getRiskColorClass(assessment.supplierRiskScore)}`}>
              {getRiskLabel(assessment.supplierRiskScore)}
            </p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getRiskColorClass(assessment.logisticsRiskScore)}`} data-testid="text-logistics-score">
              {assessment.logisticsRiskScore?.toFixed(1) || "N/A"}
            </div>
            <h3 className="text-sm font-medium text-gray-900">Logistics Risk</h3>
            <p className={`text-xs ${getRiskColorClass(assessment.logisticsRiskScore)}`}>
              {getRiskLabel(assessment.logisticsRiskScore)}
            </p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${getRiskColorClass(assessment.geopoliticalRiskScore)}`} data-testid="text-geopolitical-score">
              {assessment.geopoliticalRiskScore?.toFixed(1) || "N/A"}
            </div>
            <h3 className="text-sm font-medium text-gray-900">Geopolitical Risk</h3>
            <p className={`text-xs ${getRiskColorClass(assessment.geopoliticalRiskScore)}`}>
              {getRiskLabel(assessment.geopoliticalRiskScore)}
            </p>
          </div>
        </div>

        {/* Vulnerabilities */}
        {assessment.vulnerabilities && Array.isArray(assessment.vulnerabilities) && assessment.vulnerabilities.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Critical Vulnerabilities Identified</h3>
            <div className="space-y-4">
              {(assessment.vulnerabilities as Vulnerability[]).map((vulnerability) => (
                <Card key={vulnerability.id} className="border-gray-200 bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={getSeverityColor(vulnerability.severity)}>
                            {vulnerability.severity}
                          </Badge>
                          <h4 className="font-semibold" data-testid={`text-vulnerability-title-${vulnerability.id}`}>
                            {vulnerability.title}
                          </h4>
                        </div>
                        <p className="text-sm mb-3" data-testid={`text-vulnerability-description-${vulnerability.id}`}>
                          {vulnerability.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            Impact: {vulnerability.impactTimeline}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="mr-1 h-3 w-3" />
                            Cost: {vulnerability.potentialCost}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" data-testid={`text-vulnerability-score-${vulnerability.id}`}>
                          {vulnerability.score.toFixed(1)}
                        </div>
                        <div className="text-xs">Risk Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {assessment.recommendations && Array.isArray(assessment.recommendations) && assessment.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Recommendations</h3>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {(assessment.recommendations as Recommendation[]).map((recommendation, index) => (
                    <div key={recommendation.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900 mb-1" data-testid={`text-recommendation-title-${recommendation.id}`}>
                          {String(recommendation.title)}
                        </h4>
                        <p className="text-green-800 text-sm mb-2" data-testid={`text-recommendation-description-${recommendation.id}`}>
                          {String(recommendation.description)}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-green-700">
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Timeline: {String(recommendation.timeline)}
                          </span>
                          <Badge variant={getPriorityColor(String(recommendation.priority))} className="text-xs">
                            Priority: {String(recommendation.priority)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty States */}
        {(!assessment.vulnerabilities || !Array.isArray(assessment.vulnerabilities) || assessment.vulnerabilities.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No vulnerabilities were identified in this assessment.</p>
          </div>
        )}

        {/* Ripple Effect Simulation - only show for completed assessments */}
        {assessment.status === "completed" && (
          <>
            <RippleEffectSimulation assessment={assessment} />
            <SecurityEventMonitor assessment={assessment} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
