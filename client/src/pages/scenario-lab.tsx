import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Play, RotateCcw, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RealTimeClock from '@/components/real-time-clock';

export default function ScenarioLabPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [scenarios, setScenarios] = useState({
    portCongestion: false,
    weatherDisruption: false,
    geopoliticalTension: false,
    supplierFailure: false,
    cyberAttack: false,
  });
  const [riskFactors, setRiskFactors] = useState({
    portCongestionLevel: [30],
    weatherSeverity: [50],
    geopoliticalImpact: [40],
    supplierReliability: [70],
    cyberSecurityLevel: [80],
  });
  const [results, setResults] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const { toast } = useToast();

  // Scenario presets for quick setup
  const presets = {
    'low-risk': {
      name: 'Low Risk Baseline',
      scenarios: { portCongestion: false, weatherDisruption: false, geopoliticalTension: false, supplierFailure: false, cyberAttack: false },
      factors: { portCongestionLevel: [20], weatherSeverity: [30], geopoliticalImpact: [25], supplierReliability: [85], cyberSecurityLevel: [90] }
    },
    'moderate-risk': {
      name: 'Moderate Risk Mix',
      scenarios: { portCongestion: true, weatherDisruption: false, geopoliticalTension: true, supplierFailure: false, cyberAttack: false },
      factors: { portCongestionLevel: [45], weatherSeverity: [40], geopoliticalImpact: [55], supplierReliability: [70], cyberSecurityLevel: [75] }
    },
    'high-risk': {
      name: 'High Risk Crisis',
      scenarios: { portCongestion: true, weatherDisruption: true, geopoliticalTension: true, supplierFailure: false, cyberAttack: true },
      factors: { portCongestionLevel: [70], weatherSeverity: [80], geopoliticalImpact: [75], supplierReliability: [60], cyberSecurityLevel: [50] }
    },
    'extreme-risk': {
      name: 'Extreme Risk Scenario',
      scenarios: { portCongestion: true, weatherDisruption: true, geopoliticalTension: true, supplierFailure: true, cyberAttack: true },
      factors: { portCongestionLevel: [90], weatherSeverity: [95], geopoliticalImpact: [85], supplierReliability: [35], cyberSecurityLevel: [30] }
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationComplete(false);

    toast({
      title: "Starting Simulation",
      description: `Running ${activeScenarios} risk scenario${activeScenarios !== 1 ? 's' : ''}...`,
    });

    // Realistic simulation with progress updates
    const simulationTime = 2000 + (activeScenarios * 800);
    const progressSteps = 10;
    const stepTime = simulationTime / progressSteps;
    
    for (let i = 0; i <= progressSteps; i++) {
      setSimulationProgress((i / progressSteps) * 100);
      await new Promise(resolve => setTimeout(resolve, stepTime));
    }

    // Calculate simulation results based on selected scenarios
    const activeScenarios = Object.entries(scenarios).filter(([_, active]) => active);
    const baseRisk = 3.0;
    let totalRiskIncrease = 0;
    let impactDetails = [];

    if (scenarios.portCongestion) {
      const increase = (riskFactors.portCongestionLevel[0] / 100) * 2.5;
      totalRiskIncrease += increase;
      impactDetails.push({
        scenario: 'Port Congestion',
        impact: `+${increase.toFixed(1)} risk points`,
        description: `${riskFactors.portCongestionLevel[0]}% congestion level causing shipping delays`,
        severity: increase > 1.5 ? 'high' : increase > 0.8 ? 'medium' : 'low'
      });
    }

    if (scenarios.weatherDisruption) {
      const increase = (riskFactors.weatherSeverity[0] / 100) * 2.0;
      totalRiskIncrease += increase;
      impactDetails.push({
        scenario: 'Weather Disruption',
        impact: `+${increase.toFixed(1)} risk points`,
        description: `${riskFactors.weatherSeverity[0]}% weather severity affecting logistics`,
        severity: increase > 1.2 ? 'high' : increase > 0.6 ? 'medium' : 'low'
      });
    }

    if (scenarios.geopoliticalTension) {
      const increase = (riskFactors.geopoliticalImpact[0] / 100) * 3.0;
      totalRiskIncrease += increase;
      impactDetails.push({
        scenario: 'Geopolitical Tension',
        impact: `+${increase.toFixed(1)} risk points`,
        description: `${riskFactors.geopoliticalImpact[0]}% tension level affecting trade routes`,
        severity: increase > 1.8 ? 'high' : increase > 1.0 ? 'medium' : 'low'
      });
    }

    if (scenarios.supplierFailure) {
      const reliability = riskFactors.supplierReliability[0];
      const increase = ((100 - reliability) / 100) * 2.5;
      totalRiskIncrease += increase;
      impactDetails.push({
        scenario: 'Supplier Failure',
        impact: `+${increase.toFixed(1)} risk points`,
        description: `${reliability}% supplier reliability - potential supply chain breaks`,
        severity: increase > 1.5 ? 'high' : increase > 0.8 ? 'medium' : 'low'
      });
    }

    if (scenarios.cyberAttack) {
      const security = riskFactors.cyberSecurityLevel[0];
      const increase = ((100 - security) / 100) * 1.8;
      totalRiskIncrease += increase;
      impactDetails.push({
        scenario: 'Cyber Security Risk',
        impact: `+${increase.toFixed(1)} risk points`,
        description: `${security}% security level - vulnerability to cyber attacks`,
        severity: increase > 1.2 ? 'high' : increase > 0.6 ? 'medium' : 'low'
      });
    }

    const finalRiskScore = Math.min(baseRisk + totalRiskIncrease, 10);
    const timelineImpact = Math.floor(totalRiskIncrease * 5);
    const costImpact = Math.floor(totalRiskIncrease * 1.2 * 100000);

    setResults({
      baseRisk,
      totalRiskIncrease,
      finalRiskScore,
      timelineImpact,
      costImpact,
      impactDetails,
      scenarioCount: activeScenarios.length
    });

    setIsSimulating(false);
    setSimulationComplete(true);
    setSimulationProgress(0);

    toast({
      title: "✅ Simulation Complete!",
      description: `Successfully analyzed ${activeScenarios} scenario${activeScenarios !== 1 ? 's' : ''} - Risk level: ${finalRiskScore >= 7 ? 'HIGH' : finalRiskScore >= 4 ? 'MEDIUM' : 'LOW'}`,
    });
  };

  const resetSimulation = () => {
    setScenarios({
      portCongestion: false,
      weatherDisruption: false,
      geopoliticalTension: false,
      supplierFailure: false,
      cyberAttack: false,
    });
    setRiskFactors({
      portCongestionLevel: [30],
      weatherSeverity: [50],
      geopoliticalImpact: [40],
      supplierReliability: [70],
      cyberSecurityLevel: [80],
    });
    setResults(null);
    setSimulationComplete(false);
    setSelectedPreset('');
    setSimulationProgress(0);
    
    toast({
      title: "🔄 Simulation Reset",
      description: "All scenarios and settings cleared. Ready for new simulation.",
    });
  };

  const toggleScenario = (scenario: keyof typeof scenarios) => {
    const newValue = !scenarios[scenario];
    setScenarios(prev => ({
      ...prev,
      [scenario]: newValue
    }));
    
    const scenarioNames = {
      portCongestion: 'Port Congestion',
      weatherDisruption: 'Weather Disruption', 
      geopoliticalTension: 'Geopolitical Tension',
      supplierFailure: 'Supplier Failure',
      cyberAttack: 'Cyber Security Risk'
    };
    
    toast({
      title: newValue ? "✅ Scenario Added" : "❌ Scenario Removed",
      description: `${scenarioNames[scenario]} ${newValue ? 'enabled' : 'disabled'} for simulation`,
    });
  };

  const activeScenarios = Object.values(scenarios).filter(Boolean).length;

  const applyPreset = (presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets];
    if (preset) {
      setScenarios(preset.scenarios);
      setRiskFactors(preset.factors);
      setSelectedPreset(presetKey);
      setResults(null);
      setSimulationComplete(false);
      
      toast({
        title: "📋 Preset Applied",
        description: `${preset.name} configuration loaded successfully`,
      });
    }
  };

  const handleSliderChange = (scenario: string, value: number[]) => {
    setRiskFactors(prev => ({ ...prev, [scenario]: value }));
    // Optional: Real-time feedback for slider changes
    if (Math.abs(value[0] - riskFactors[scenario as keyof typeof riskFactors][0]) >= 10) {
      const level = value[0] >= 80 ? 'Very High' : value[0] >= 60 ? 'High' : value[0] >= 40 ? 'Medium' : 'Low';
      toast({
        title: "⚡ Risk Level Updated",
        description: `${scenario.replace(/([A-Z])/g, ' $1').trim()} set to ${level} (${value[0]}%)`,
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Scenario Lab</h1>
            <p className="text-sm text-gray-500 mt-1">Simulate supply chain disruptions and analyze potential impacts</p>
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
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span>Simulation Controls</span>
              </CardTitle>
              <div className="flex space-x-3">
                <Button 
                  onClick={runSimulation} 
                  disabled={isSimulating || activeScenarios === 0}
                  className={`${isSimulating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : activeScenarios === 0 
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 hover:scale-105 transition-all duration-200'
                  } text-white`}
                  data-testid="button-run-simulation"
                >
                  {isSimulating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Processing Scenarios...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Simulation ({activeScenarios})
                    </>
                  )}
                </Button>
                <Button 
                  onClick={resetSimulation}
                  variant="outline"
                  className="hover:bg-gray-100 hover:scale-105 transition-all duration-200"
                  data-testid="button-reset-simulation"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-4">
              Select disruption scenarios and adjust their severity to model potential supply chain impacts.
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Badge variant={activeScenarios > 0 ? 'default' : 'secondary'}>
                  {activeScenarios} Active Scenario{activeScenarios !== 1 ? 's' : ''}
                </Badge>
                {simulationComplete && results && (
                  <Badge className="bg-green-100 text-green-800">
                    Last Run: {results.scenarioCount} scenarios analyzed
                  </Badge>
                )}
                {isSimulating && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Progress: {Math.round(simulationProgress)}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Quick Setup:</span>
                <select 
                  value={selectedPreset}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  data-testid="select-preset"
                >
                  <option value="">Choose Preset...</option>
                  <option value="low-risk">Low Risk Baseline</option>
                  <option value="moderate-risk">Moderate Risk Mix</option>
                  <option value="high-risk">High Risk Crisis</option>
                  <option value="extreme-risk">Extreme Risk Scenario</option>
                </select>
              </div>
            </div>
            {isSimulating && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${simulationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Scenarios</h3>

            {/* Port Congestion */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={scenarios.portCongestion}
                        onCheckedChange={() => toggleScenario('portCongestion')}
                        data-testid="switch-port-congestion"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">Port Congestion</h4>
                        <p className="text-sm text-gray-600">Major shipping port delays and backups</p>
                      </div>
                    </div>
                    {scenarios.portCongestion && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700">Congestion Level: {riskFactors.portCongestionLevel[0]}%</label>
                        <Slider
                          value={riskFactors.portCongestionLevel}
                          onValueChange={(value) => handleSliderChange('portCongestionLevel', value)}
                          max={100}
                          min={10}
                          step={5}
                          className="mt-2"
                          data-testid="slider-port-congestion"
                        />
                      </div>
                    )}
                  </div>
                  <Badge variant={scenarios.portCongestion ? 'default' : 'outline'}>
                    {scenarios.portCongestion ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Weather Disruption */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={scenarios.weatherDisruption}
                        onCheckedChange={() => toggleScenario('weatherDisruption')}
                        data-testid="switch-weather-disruption"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">Weather Disruption</h4>
                        <p className="text-sm text-gray-600">Storms, hurricanes, or severe weather events</p>
                      </div>
                    </div>
                    {scenarios.weatherDisruption && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700">Weather Severity: {riskFactors.weatherSeverity[0]}%</label>
                        <Slider
                          value={riskFactors.weatherSeverity}
                          onValueChange={(value) => handleSliderChange('weatherSeverity', value)}
                          max={100}
                          min={20}
                          step={5}
                          className="mt-2"
                          data-testid="slider-weather-severity"
                        />
                      </div>
                    )}
                  </div>
                  <Badge variant={scenarios.weatherDisruption ? 'default' : 'outline'}>
                    {scenarios.weatherDisruption ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Geopolitical Tension */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={scenarios.geopoliticalTension}
                        onCheckedChange={() => toggleScenario('geopoliticalTension')}
                        data-testid="switch-geopolitical-tension"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">Geopolitical Tension</h4>
                        <p className="text-sm text-gray-600">Trade wars, sanctions, or diplomatic conflicts</p>
                      </div>
                    </div>
                    {scenarios.geopoliticalTension && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700">Impact Level: {riskFactors.geopoliticalImpact[0]}%</label>
                        <Slider
                          value={riskFactors.geopoliticalImpact}
                          onValueChange={(value) => handleSliderChange('geopoliticalImpact', value)}
                          max={100}
                          min={15}
                          step={5}
                          className="mt-2"
                          data-testid="slider-geopolitical-impact"
                        />
                      </div>
                    )}
                  </div>
                  <Badge variant={scenarios.geopoliticalTension ? 'default' : 'outline'}>
                    {scenarios.geopoliticalTension ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Failure */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={scenarios.supplierFailure}
                        onCheckedChange={() => toggleScenario('supplierFailure')}
                        data-testid="switch-supplier-failure"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">Supplier Failure</h4>
                        <p className="text-sm text-gray-600">Key supplier bankruptcy or production halt</p>
                      </div>
                    </div>
                    {scenarios.supplierFailure && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700">Supplier Reliability: {riskFactors.supplierReliability[0]}%</label>
                        <Slider
                          value={riskFactors.supplierReliability}
                          onValueChange={(value) => handleSliderChange('supplierReliability', value)}
                          max={100}
                          min={10}
                          step={5}
                          className="mt-2"
                          data-testid="slider-supplier-reliability"
                        />
                      </div>
                    )}
                  </div>
                  <Badge variant={scenarios.supplierFailure ? 'default' : 'outline'}>
                    {scenarios.supplierFailure ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Cyber Attack */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={scenarios.cyberAttack}
                        onCheckedChange={() => toggleScenario('cyberAttack')}
                        data-testid="switch-cyber-attack"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">Cyber Security Risk</h4>
                        <p className="text-sm text-gray-600">Ransomware or system breaches affecting operations</p>
                      </div>
                    </div>
                    {scenarios.cyberAttack && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700">Security Level: {riskFactors.cyberSecurityLevel[0]}%</label>
                        <Slider
                          value={riskFactors.cyberSecurityLevel}
                          onValueChange={(value) => handleSliderChange('cyberSecurityLevel', value)}
                          max={100}
                          min={30}
                          step={5}
                          className="mt-2"
                          data-testid="slider-cyber-security"
                        />
                      </div>
                    )}
                  </div>
                  <Badge variant={scenarios.cyberAttack ? 'default' : 'outline'}>
                    {scenarios.cyberAttack ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Results</h3>
            
            {!results ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h4 className="text-lg font-medium">No Simulation Data</h4>
                    <p className="text-sm">Select scenarios and run simulation to see results</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Overall Impact */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                      <span className="text-lg">Overall Impact Assessment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className={`text-4xl font-bold mb-2 ${
                          results.finalRiskScore >= 7 ? 'text-red-600' : 
                          results.finalRiskScore >= 4 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                          {results.finalRiskScore.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">Final Risk Score</div>
                        <Badge variant={results.finalRiskScore >= 7 ? 'destructive' : results.finalRiskScore >= 4 ? 'secondary' : 'default'}>
                          {results.finalRiskScore >= 7 ? 'HIGH RISK' : results.finalRiskScore >= 4 ? 'MEDIUM RISK' : 'LOW RISK'}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-2">
                          (Base: {results.baseRisk} + Impact: {results.totalRiskIncrease.toFixed(1)})
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Timeline Impact:</span>
                            <span className="font-bold text-red-600">+{results.timelineImpact} days</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                            <div 
                              className="bg-red-500 h-1 rounded-full"
                              style={{ width: `${Math.min((results.timelineImpact / 50) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Cost Impact:</span>
                            <span className="font-bold text-red-600">₹{((results.costImpact * 83) / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                            <div 
                              className="bg-red-500 h-1 rounded-full"
                              style={{ width: `${Math.min((results.costImpact / 500000) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center space-x-4">
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                          toast({ title: "📋 Results Copied", description: "Simulation results copied to clipboard" });
                        }}
                        variant="outline"
                        size="sm"
                        data-testid="button-copy-results"
                      >
                        📋 Copy Results
                      </Button>
                      <Button 
                        onClick={() => {
                          const summary = `SCENARIO SIMULATION RESULTS\n\nRisk Score: ${results.finalRiskScore.toFixed(1)}/10\nTimeline Impact: +${results.timelineImpact} days\nCost Impact: ₹${((results.costImpact * 83)/1000).toFixed(0)}K\nScenarios: ${results.scenarioCount}\n\nGenerated: ${new Date().toLocaleString()}`;
                          const blob = new Blob([summary], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `scenario-results-${new Date().toISOString().split('T')[0]}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast({ title: "💾 Results Saved", description: "Simulation results downloaded successfully" });
                        }}
                        variant="outline"
                        size="sm"
                        data-testid="button-save-results"
                      >
                        💾 Save Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Scenario Impact Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.impactDetails.map((detail: any, index: number) => (
                        <div key={index} className="border-l-4 border-l-blue-500 pl-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900">{detail.scenario}</h5>
                            <Badge variant={
                              detail.severity === 'high' ? 'destructive' : 
                              detail.severity === 'medium' ? 'secondary' : 
                              'outline'
                            }>
                              {detail.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{detail.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}