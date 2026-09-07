import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, ArrowRight } from 'lucide-react';
import type { Assessment } from "@shared/schema";

interface RippleStage {
  id: string;
  name: string;
  baseDelay: number;
  riskMultiplier: number;
  description: string;
}

interface RippleEffectSimulationProps {
  assessment: Assessment;
}

export default function RippleEffectSimulation({ assessment }: RippleEffectSimulationProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageDelays, setStageDelays] = useState<number[]>([]);
  const [totalDelay, setTotalDelay] = useState(0);

  // Define the supply chain stages
  const stages: RippleStage[] = [
    {
      id: 'origin_port',
      name: 'Origin Port',
      baseDelay: 0.5,
      riskMultiplier: (assessment.logisticsRiskScore || 5) / 10,
      description: 'Initial disruption point'
    },
    {
      id: 'ocean_transit',
      name: 'Ocean Transit',
      baseDelay: 2.1,
      riskMultiplier: (assessment.geopoliticalRiskScore || 5) / 10,
      description: 'Sea route delays'
    },
    {
      id: 'destination_port',
      name: 'Destination Port',
      baseDelay: 1.3,
      riskMultiplier: (assessment.logisticsRiskScore || 5) / 10,
      description: 'Port congestion effects'
    },
    {
      id: 'distribution_center',
      name: 'Distribution Center',
      baseDelay: 0.8,
      riskMultiplier: (assessment.supplierRiskScore || 5) / 10,
      description: 'Final delivery delays'
    }
  ];

  // Calculate risk level and color
  const getRiskLevel = (riskScore: number): { level: string; color: string; bgColor: string } => {
    if (riskScore >= 0.7) return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100 border-red-300' };
    if (riskScore >= 0.4) return { level: 'Medium', color: 'text-orange-600', bgColor: 'bg-orange-100 border-orange-300' };
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100 border-green-300' };
  };

  // Calculate accumulated delays
  const calculateDelays = () => {
    const delays: number[] = [];
    let cumulativeDelay = 0;

    stages.forEach((stage, index) => {
      // Calculate delay for this stage including ripple effect from previous stages
      const baseDelay = stage.baseDelay;
      const riskFactor = 1 + stage.riskMultiplier;
      const rippleEffect = cumulativeDelay * 0.3; // 30% of previous delays carry forward
      
      const stageDelay = (baseDelay * riskFactor) + rippleEffect;
      delays.push(stageDelay);
      cumulativeDelay += stageDelay;
    });

    setStageDelays(delays);
    setTotalDelay(cumulativeDelay);
  };

  // Start simulation
  const startSimulation = () => {
    setIsSimulating(true);
    setCurrentStage(0);
    calculateDelays();
    
    // Animate through stages
    const interval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= stages.length - 1) {
          setIsSimulating(false);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setCurrentStage(0);
    setStageDelays([]);
    setTotalDelay(0);
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
  };

  useEffect(() => {
    calculateDelays();
  }, [assessment]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>🌊 Ripple Effect Simulation</span>
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">
              Models how delays cascade through your supply chain network
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSimulation}
              data-testid="button-reset-simulation"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant={isSimulating ? "secondary" : "default"}
              size="sm"
              onClick={isSimulating ? pauseSimulation : startSimulation}
              data-testid="button-start-simulation"
            >
              {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isSimulating ? 'Pause' : 'Simulate'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Total Impact Summary */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Total Supply Chain Impact</h4>
              <p className="text-sm text-blue-700">Cumulative delay from initial disruption</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900" data-testid="text-total-delay">
                +{totalDelay.toFixed(1)} days
              </div>
              <Badge variant="secondary" className="mt-1">
                {totalDelay > 5 ? 'Critical' : totalDelay > 3 ? 'Significant' : 'Manageable'} Impact
              </Badge>
            </div>
          </div>
        </div>

        {/* Supply Chain Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const delay = stageDelays[index] || 0;
            const risk = getRiskLevel(stage.riskMultiplier);
            const isActive = currentStage >= index;
            const isCurrent = currentStage === index && isSimulating;

            return (
              <div key={stage.id} className="relative">
                {/* Stage Card */}
                <div
                  className={`p-4 border rounded-lg transition-all duration-500 ${
                    isCurrent 
                      ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                      : isActive 
                        ? risk.bgColor
                        : 'bg-gray-50 border-gray-200'
                  }`}
                  data-testid={`stage-${stage.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Stage Indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCurrent
                          ? 'bg-blue-500 text-white animate-pulse'
                          : isActive
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-200 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div>
                        <h4 className={`font-medium ${isCurrent ? 'text-blue-900' : 'text-gray-900'}`}>
                          {stage.name}
                        </h4>
                        <p className="text-sm text-gray-600">{stage.description}</p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      {isActive && (
                        <>
                          <div className={`text-lg font-bold ${risk.color}`} data-testid={`delay-${stage.id}`}>
                            +{delay.toFixed(1)} days
                          </div>
                          <Badge 
                            variant={risk.level === 'High' ? 'destructive' : risk.level === 'Medium' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {risk.level} Risk
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar for Current Stage */}
                  {isCurrent && (
                    <div className="mt-3">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-1000 animate-pulse"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <p className="text-xs text-blue-600 mt-1">Processing ripple effect...</p>
                    </div>
                  )}
                </div>

                {/* Arrow to Next Stage */}
                {index < stages.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight 
                      className={`h-6 w-6 transition-colors duration-300 ${
                        isActive ? 'text-blue-500' : 'text-gray-300'
                      }`} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Simulation Insights */}
        {stageDelays.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">💡 Simulation Insights</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Highest risk stage: <span className="font-medium">
                {stages[stageDelays.indexOf(Math.max(...stageDelays))].name}
              </span> (+{Math.max(...stageDelays).toFixed(1)} days)</li>
              <li>• Risk amplification: <span className="font-medium">
                {((totalDelay / stages.reduce((sum, stage) => sum + stage.baseDelay, 0)) * 100 - 100).toFixed(0)}%
              </span> above baseline</li>
              <li>• Recovery time: <span className="font-medium">
                {Math.ceil(totalDelay * 1.5)}-{Math.ceil(totalDelay * 2)} days
              </span> to normalize operations</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}