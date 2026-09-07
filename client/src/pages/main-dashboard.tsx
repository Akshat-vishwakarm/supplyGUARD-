import React from 'react';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SupplyChainForm from "@/components/supply-chain-form";
import AssessmentResults from "@/components/assessment-results";
import AssessmentStatus from "@/components/assessment-status";
import LoadingOverlay from "@/components/loading-overlay";
import RealTimeClock from "@/components/real-time-clock";
import InteractiveWorldMap from "@/components/interactive-world-map";
import GoogleMapsFallbackNotice from "@/components/google-maps-fallback-notice";
import GlobalAlertsPanel from "@/components/global-alerts-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Assessment } from "@shared/schema";

export default function MainDashboard() {
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: assessments = [], isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  const { data: currentAssessment, refetch: refetchCurrentAssessment } = useQuery<Assessment>({
    queryKey: ["/api/assessments", currentAssessmentId],
    enabled: !!currentAssessmentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "processing" ? 2000 : false;
    },
  });

  const { data: healthCheck } = useQuery<{ status: string; gemini: string; timestamp: string }>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Supply Chain Vulnerability Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time monitoring and risk assessment</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">LIVE</span>
              <RealTimeClock className="text-gray-500" showSeconds={true} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Interactive World Map */}
        <InteractiveWorldMap />
        
        {/* Google Maps Integration Notice */}
        <GoogleMapsFallbackNotice />

        {/* API Status */}
        {healthCheck && healthCheck.gemini === 'connected' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">AI Analysis Engine Ready</h3>
                  <p className="text-blue-800">Gemini 3.6 Flash connected • Analysis time: &lt;12 seconds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Supply Chain Form */}
          <div className="lg:col-span-2">
            <SupplyChainForm 
              onAssessmentCreated={(id: string) => {
                setCurrentAssessmentId(id);
                setIsProcessing(true);
              }}
              isProcessing={isProcessing}
            />
          </div>

          {/* Assessment Status */}
          <div className="lg:col-span-1">
            <AssessmentStatus 
              assessment={currentAssessment}
              healthCheck={healthCheck}
            />
          </div>

          {/* Global Alerts Panel */}
          <div className="lg:col-span-1">
            <GlobalAlertsPanel />
          </div>
        </div>

        {/* Assessment Results */}
        {currentAssessment && (
          <div className="mt-8">
            <AssessmentResults 
              assessment={currentAssessment}
              onProcessingComplete={() => setIsProcessing(false)}
            />
          </div>
        )}

        {/* Recent Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAssessments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No assessments found. Create your first assessment above.
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.slice(0, 5).map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{assessment.companyName}</div>
                      <div className="text-sm text-gray-500">{assessment.industry}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {assessment.overallRiskScore && (
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {assessment.overallRiskScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">Risk Score</div>
                        </div>
                      )}
                      <Badge variant={
                        assessment.status === 'completed' ? 'default' : 
                        assessment.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {assessment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 px-6 py-4 mt-8">
        <div className="text-center text-sm text-gray-500">
          © 2025 All rights reserved SecureSupply AI
        </div>
      </footer>

      {isProcessing && <LoadingOverlay />}
    </div>
  );
}