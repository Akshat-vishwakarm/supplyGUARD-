import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Shield, Package, Route, Truck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RealTimeClock from '@/components/real-time-clock';
import type { Assessment } from '@shared/schema';

export default function RecommendationsPage() {
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ['/api/assessments'],
  });

  // Get the latest completed assessment for real-time recommendations
  const latestAssessment = assessments
    .filter(a => a.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const getIconForRecommendation = (title: string) => {
    if (title.toLowerCase().includes('air') || title.toLowerCase().includes('freight')) return Plane;
    if (title.toLowerCase().includes('route') || title.toLowerCase().includes('port')) return Route;
    if (title.toLowerCase().includes('truck') || title.toLowerCase().includes('transport')) return Truck;
    if (title.toLowerCase().includes('security') || title.toLowerCase().includes('clearance')) return Shield;
    return Package;
  };

  const estimateCostImpact = (title: string, riskScore: number) => {
    if (title.toLowerCase().includes('air freight') || title.toLowerCase().includes('expedite')) {
      return `+${(riskScore * 1.8).toFixed(1)}%`;
    }
    if (title.toLowerCase().includes('alternative') || title.toLowerCase().includes('backup')) {
      return `+${(riskScore * 0.8).toFixed(1)}%`;
    }
    if (title.toLowerCase().includes('communication') || title.toLowerCase().includes('monitoring')) {
      return `+${(riskScore * 0.3).toFixed(1)}%`;
    }
    return `+${(riskScore * 0.6).toFixed(1)}%`;
  };

  const estimateTimeImpact = (title: string, riskScore: number) => {
    if (title.toLowerCase().includes('air freight') || title.toLowerCase().includes('expedite')) {
      return `-${(riskScore * 1.2).toFixed(1)} days`;
    }
    if (title.toLowerCase().includes('immediate') || title.toLowerCase().includes('proactive')) {
      return `-${(riskScore * 0.4).toFixed(1)} days`;
    }
    if (title.toLowerCase().includes('alternative') || title.toLowerCase().includes('establish')) {
      return `+${(riskScore * 0.2).toFixed(1)} days`;
    }
    return `-${(riskScore * 0.8).toFixed(1)} days`;
  };

  const estimateRiskReduction = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '65%';
      case 'high': return '45%';
      case 'medium': return '30%';
      default: return '20%';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      default: return 'green';
    }
  };

  // Convert real assessment recommendations to UI format
  const generateRecommendations = () => {
    if (!latestAssessment || !latestAssessment.recommendations) {
      return [];
    }

    const riskScore = latestAssessment.overallRiskScore || 5;
    return (latestAssessment.recommendations as any[]).map((rec, index) => ({
      id: rec.id || `rec-${index}`,
      title: rec.title,
      description: rec.description,
      icon: getIconForRecommendation(rec.title),
      costImpact: estimateCostImpact(rec.title, riskScore),
      leadTime: estimateTimeImpact(rec.title, riskScore),
      riskReduction: estimateRiskReduction(rec.priority),
      color: getPriorityColor(rec.priority),
      priority: rec.priority,
      timeline: rec.timeline,
      assessmentId: latestAssessment.id,
      companyName: latestAssessment.companyName
    }));
  };

  const recommendations = generateRecommendations();

  const applyRecommendation = (recId: string, title: string) => {
    if (appliedRecommendations.includes(recId)) {
      setAppliedRecommendations(prev => prev.filter(id => id !== recId));
      toast({
        title: "Recommendation Removed",
        description: `${title} has been removed from your implementation plan`,
      });
    } else {
      setAppliedRecommendations(prev => [...prev, recId]);
      toast({
        title: "Recommendation Applied",
        description: `${title} has been added to your implementation plan`,
      });
    }
  };

  const downloadPlan = () => {
    const appliedRecs = recommendations.filter(rec => appliedRecommendations.includes(rec.id));
    
    if (appliedRecs.length === 0) {
      toast({
        title: "No Recommendations Selected",
        description: "Please apply some recommendations first to generate a plan",
        variant: "destructive"
      });
      return;
    }

    const content = `REAL-TIME SUPPLY CHAIN RISK MITIGATION PLAN
==========================================

Generated: ${new Date().toLocaleString()}
Based on Assessment: ${latestAssessment?.companyName || 'Latest Assessment'}
Selected Mitigations: ${appliedRecs.length}
Overall Risk Score: ${latestAssessment?.overallRiskScore?.toFixed(1) || 'N/A'}/10

${appliedRecs.map((rec, index) => `
${index + 1}. ${rec.title}
   Priority: ${rec.priority}
   Timeline: ${rec.timeline}
   Description: ${rec.description}
   Cost Impact: ${rec.costImpact}
   Lead Time Impact: ${rec.leadTime}
   Risk Reduction: ${rec.riskReduction}
   
   Implementation Steps:
   - Review current logistics setup
   - Identify required resources and partnerships
   - Establish timeline for implementation
   - Monitor progress and effectiveness
   
${'-'.repeat(50)}`).join('\n')}

SUMMARY
=======
Total Cost Impact: ${appliedRecs.reduce((sum, rec) => {
  const cost = parseFloat(rec.costImpact.replace('%', '').replace('+', ''));
  return sum + cost;
}, 0).toFixed(1)}%

Total Time Change: ${appliedRecs.reduce((sum, rec) => {
  const time = parseFloat(rec.leadTime.replace(' days', ''));
  return sum + time;
}, 0).toFixed(1)} days

Total Risk Reduction: ${appliedRecs.reduce((sum, rec) => {
  const risk = parseFloat(rec.riskReduction.replace('%', ''));
  return sum + risk;
}, 0).toFixed(0)}%

Company: ${latestAssessment?.companyName || 'N/A'}
Industry: ${latestAssessment?.industry || 'N/A'}
Assessment Date: ${latestAssessment ? new Date(latestAssessment.createdAt).toLocaleString() : 'N/A'}

End of Plan`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-mitigation-plan-${latestAssessment?.companyName || 'assessment'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Plan Downloaded",
      description: `Implementation plan with ${appliedRecs.length} recommendations downloaded successfully`,
    });
  };

  const calculateTotals = () => {
    const appliedRecs = recommendations.filter(rec => appliedRecommendations.includes(rec.id));
    
    const totalCost = appliedRecs.reduce((sum, rec) => {
      const cost = parseFloat(rec.costImpact.replace('%', '').replace('+', ''));
      return sum + cost;
    }, 0);

    const totalTime = appliedRecs.reduce((sum, rec) => {
      const time = parseFloat(rec.leadTime.replace(' days', ''));
      return sum + time;
    }, 0);

    const totalRisk = appliedRecs.reduce((sum, rec) => {
      const risk = parseFloat(rec.riskReduction.replace('%', ''));
      return sum + risk;
    }, 0);

    return { totalCost, totalTime, totalRisk };
  };

  const { totalCost, totalTime, totalRisk } = calculateTotals();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Risk Mitigation Recommendations</h1>
            <p className="text-sm text-gray-500 mt-1">
              {latestAssessment 
                ? `Real-time recommendations for ${latestAssessment.companyName} (${latestAssessment.industry})` 
                : 'Complete an assessment to see personalized recommendations'}
            </p>
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

      <div className="p-6">
        {!latestAssessment ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No Assessment Data Available</h3>
                <p className="text-sm">Complete a vulnerability assessment to get personalized risk mitigation recommendations</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900">Live Assessment Data</h3>
                <p className="text-sm text-blue-800">
                  Recommendations generated from {latestAssessment.companyName}'s latest assessment 
                  (Risk Score: {latestAssessment.overallRiskScore?.toFixed(1)}/10)
                </p>
              </div>

              {recommendations.map((rec) => {
                const Icon = rec.icon;
                return (
                  <Card key={rec.id} className={`border-l-4 ${
                    rec.color === 'red' ? 'border-l-red-500' :
                    rec.color === 'orange' ? 'border-l-orange-500' :
                    rec.color === 'blue' ? 'border-l-blue-500' :
                    'border-l-green-500'
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            rec.color === 'red' ? 'bg-red-100' :
                            rec.color === 'orange' ? 'bg-orange-100' :
                            rec.color === 'blue' ? 'bg-blue-100' :
                            'bg-green-100'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              rec.color === 'red' ? 'text-red-600' :
                              rec.color === 'orange' ? 'text-orange-600' :
                              rec.color === 'blue' ? 'text-blue-600' :
                              'text-green-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            <p className="text-gray-600 mt-1">{rec.description}</p>
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Timeline: {rec.timeline}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => applyRecommendation(rec.id, rec.title)}
                          className={`${
                            appliedRecommendations.includes(rec.id) 
                              ? 'bg-gray-600 hover:bg-gray-700' 
                              : rec.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                                rec.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                                rec.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                'bg-green-600 hover:bg-green-700'
                          } text-white`}
                          data-testid={`button-apply-${rec.id}`}
                        >
                          {appliedRecommendations.includes(rec.id) ? 'Remove' : 'Apply'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Cost Impact:</div>
                          <div className={`font-bold ${
                            rec.costImpact.startsWith('+') && parseFloat(rec.costImpact.replace('%', '')) > 2 
                              ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {rec.costImpact}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Lead Time:</div>
                          <div className={`font-bold ${
                            rec.leadTime.startsWith('+') ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {rec.leadTime}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Risk Reduction:</div>
                          <div className="font-bold text-green-600">{rec.riskReduction}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Implementation Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Selected Mitigations</div>
                    <div className="text-2xl font-bold">{appliedRecommendations.length} selected</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Cost Impact:</span>
                      <span className={`font-medium ${totalCost > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {totalCost > 0 ? '+' : ''}{totalCost.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Time Change:</span>
                      <span className={`font-medium ${totalTime < 0 ? 'text-green-600' : totalTime > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {totalTime > 0 ? '+' : ''}{totalTime.toFixed(1)} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Risk Reduction:</span>
                      <span className={`font-medium ${totalRisk > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {totalRisk.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={downloadPlan}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-download-plan"
                  >
                    Download Real-Time Plan
                  </Button>

                  {/* Assessment Info */}
                  {latestAssessment && (
                    <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div><strong>Company:</strong> {latestAssessment.companyName}</div>
                        <div><strong>Industry:</strong> {latestAssessment.industry}</div>
                        <div><strong>Risk Score:</strong> {latestAssessment.overallRiskScore?.toFixed(1)}/10</div>
                        <div><strong>Assessment:</strong> {new Date(latestAssessment.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}