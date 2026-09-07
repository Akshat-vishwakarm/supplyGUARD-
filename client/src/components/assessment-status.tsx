import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { Assessment } from "@shared/schema";

interface AssessmentStatusProps {
  assessment?: Assessment;
  healthCheck?: { status: string; gemini: string; timestamp: string };
}

export default function AssessmentStatus({ assessment, healthCheck }: AssessmentStatusProps) {
  const getProgress = () => {
    if (!assessment) return 0;
    switch (assessment.status) {
      case "pending": return 25;
      case "processing": return 65;
      case "completed": return 100;
      case "failed": return 0;
      default: return 0;
    }
  };

  const getProgressLabel = () => {
    if (!assessment) return "No active assessment";
    switch (assessment.status) {
      case "pending": return "Assessment queued";
      case "processing": return "AI analysis in progress";
      case "completed": return "Assessment complete";
      case "failed": return "Assessment failed";
      default: return "Unknown status";
    }
  };

  return (
    <div className="space-y-6">
      {/* Assessment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              assessment && assessment.status !== "pending" ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"
            }`}>
              <div className="flex items-center space-x-2">
                {assessment && assessment.status !== "pending" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  assessment && assessment.status !== "pending" ? "text-green-800" : "text-gray-600"
                }`}>
                  Data Validation
                </span>
              </div>
              <Badge variant={assessment && assessment.status !== "pending" ? "default" : "secondary"}>
                {assessment && assessment.status !== "pending" ? "Complete" : "Pending"}
              </Badge>
            </div>
            
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              assessment?.status === "processing" ? "bg-blue-50 border border-blue-200" : 
              assessment?.status === "completed" ? "bg-green-50 border border-green-200" :
              "bg-gray-50 border border-gray-200"
            }`}>
              <div className="flex items-center space-x-2">
                {assessment?.status === "processing" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                ) : assessment?.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : assessment?.status === "failed" ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  assessment?.status === "processing" ? "text-blue-800" :
                  assessment?.status === "completed" ? "text-green-800" :
                  assessment?.status === "failed" ? "text-red-800" :
                  "text-gray-600"
                }`}>
                  AI Analysis
                </span>
              </div>
              <Badge variant={
                assessment?.status === "processing" ? "secondary" :
                assessment?.status === "completed" ? "default" :
                assessment?.status === "failed" ? "destructive" :
                "secondary"
              }>
                {assessment?.status === "processing" ? "In Progress" :
                 assessment?.status === "completed" ? "Complete" :
                 assessment?.status === "failed" ? "Failed" :
                 "Pending"}
              </Badge>
            </div>
            
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              assessment?.status === "completed" ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"
            }`}>
              <div className="flex items-center space-x-2">
                {assessment?.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  assessment?.status === "completed" ? "text-green-800" : "text-gray-600"
                }`}>
                  Report Generation
                </span>
              </div>
              <Badge variant={assessment?.status === "completed" ? "default" : "secondary"}>
                {assessment?.status === "completed" ? "Complete" : "Pending"}
              </Badge>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span data-testid="text-progress-percentage">{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
            <p className="text-xs text-gray-500 mt-2" data-testid="text-progress-label">
              {getProgressLabel()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gemini API</span>
              <Badge variant={healthCheck?.gemini === "connected" ? "default" : "destructive"}>
                {healthCheck?.gemini === "connected" ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            {healthCheck?.gemini === "connected" && (
              <>
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Free tier: 5 RPM, 25 requests/day
                  </div>
                  <div className="mt-1">Model: Gemini 3.6 Flash</div>
                </div>
              </>
            )}

            {healthCheck?.gemini === "disconnected" && (
              <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                <div className="flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Check API key configuration
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
