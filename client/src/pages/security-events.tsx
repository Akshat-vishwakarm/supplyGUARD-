import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import RealTimeClock from '@/components/real-time-clock';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SecurityEvent {
  id: string;
  title: string;
  location: string;
  severity: string;
  duration: string;
  inspectionRate: string;
  clearanceTime: string;
  confidence: string;
  description: string;
  timestamp: string;
}

interface WeatherAlert {
  id: string;
  type: string;
  location: string;
  severity: string;
  affectedPorts: string[];
  duration: string;
  windSpeed: string;
  visibility: string;
  recommendation: string;
  timestamp: string;
}

export default function SecurityEventsPage() {
  const { toast } = useToast();
  const [currentEvent, setCurrentEvent] = useState<SecurityEvent>({
    id: "default",
    title: "Customs Security Tightened at Port Ningbo",
    location: "Port Ningbo, China",
    severity: "High",
    duration: "10 days",
    inspectionRate: "25%",
    clearanceTime: "×1.5",
    confidence: "80%",
    description: "Enhanced customs security protocols implemented",
    timestamp: new Date().toISOString()
  });
  const [weatherData, setWeatherData] = useState<WeatherAlert | null>(null);
  const [showWeatherAlert, setShowWeatherAlert] = useState(false);

  // Mutation for triggering security events
  const triggerEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/security/trigger-event', {});
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.event) {
        setCurrentEvent(data.event);
        toast({
          title: "Security Event Triggered",
          description: `New event: ${data.event.title}`,
          variant: "default"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to trigger security event",
        variant: "destructive"
      });
    }
  });

  // Mutation for checking weather alerts
  const checkWeatherMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/security/weather-alert');
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.alert) {
        setWeatherData(data.alert);
        setShowWeatherAlert(true);
        toast({
          title: "Weather Alert Retrieved",
          description: `${data.alert.type} detected in ${data.alert.location}`,
          variant: "default"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to check weather alert",
        variant: "destructive"
      });
    }
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
        {/* Active Security Event */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Active Security Event</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${getSeverityColor(currentEvent.severity)} border rounded-lg p-4 mb-4`}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className={`h-5 w-5 ${getSeverityIconColor(currentEvent.severity)} mt-0.5`} />
                <div className="flex-1">
                  <h4 className={`font-medium ${getSeverityTextColor(currentEvent.severity)}`}>{currentEvent.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{currentEvent.description}</p>
                  <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <div className="font-bold">{currentEvent.duration}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Inspection Rate:</span>
                      <div className="font-bold">{currentEvent.inspectionRate}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Clearance Time:</span>
                      <div className="font-bold">{currentEvent.clearanceTime}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Confidence:</span>
                      <div className="font-bold">{currentEvent.confidence}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={() => triggerEventMutation.mutate()}
                disabled={triggerEventMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white" 
                data-testid="button-trigger-event"
              >
                <Shield className="h-4 w-4 mr-2" />
                {triggerEventMutation.isPending ? "Triggering..." : "Trigger Security Event"}
              </Button>
              <Button 
                onClick={() => checkWeatherMutation.mutate()}
                disabled={checkWeatherMutation.isPending}
                variant="outline" 
                className="border-blue-500 text-blue-600 hover:bg-blue-50" 
                data-testid="button-check-weather"
              >
                <Cloud className="h-4 w-4 mr-2" />
                {checkWeatherMutation.isPending ? "Checking..." : "Check Weather Alert"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weather Alert Card */}
        {showWeatherAlert && weatherData && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  <span>Weather Alert</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowWeatherAlert(false)}
                  data-testid="button-close-weather"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-900">{weatherData.type}</h4>
                  <Badge variant={weatherData.severity === 'High' ? 'destructive' : 'secondary'}>
                    {weatherData.severity} Risk
                  </Badge>
                </div>
                <p className="text-sm text-blue-800"><strong>Location:</strong> {weatherData.location}</p>
                <p className="text-sm text-blue-800"><strong>Duration:</strong> {weatherData.duration}</p>
                <p className="text-sm text-blue-800"><strong>Wind Speed:</strong> {weatherData.windSpeed}</p>
                <p className="text-sm text-blue-800"><strong>Visibility:</strong> {weatherData.visibility}</p>
                <p className="text-sm text-blue-800"><strong>Affected Ports:</strong> {weatherData.affectedPorts.join(', ')}</p>
                <div className="bg-blue-100 border border-blue-300 rounded p-3 mt-3">
                  <p className="text-sm text-blue-900"><strong>Recommendation:</strong> {weatherData.recommendation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supply Chain Ripple Effect */}
        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Ripple Effect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-8">
              {/* Origin Port (Dynamic based on current event) */}
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full ${getRippleNodeStyle(currentEvent.severity, 'origin')} flex items-center justify-center mx-auto mb-2`}>
                  <Shield className={`h-6 w-6 ${getRippleIconColor(currentEvent.severity)}`} />
                </div>
                <div className="font-medium text-gray-900">{getOriginPort(currentEvent.location)}</div>
                <div className={`text-sm font-medium ${getRippleTextColor(currentEvent.severity)}`}>{currentEvent.severity} Risk</div>
                <div className="text-xs text-gray-500">+{getRippleDelay(currentEvent.severity, 0)} days</div>
              </div>

              <div className="flex-1 relative">
                <div className={`absolute top-8 left-0 right-0 border-t-2 ${getRippleBorderColor(currentEvent.severity)}`}></div>
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                  <div className={`w-4 h-4 rounded-full ${getRippleConnectorColor(currentEvent.severity)}`}></div>
                </div>
              </div>

              {/* Ocean Transit */}
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full ${getRippleNodeStyle(currentEvent.severity, 'transit')} flex items-center justify-center mx-auto mb-2`}>
                  <div className={`text-lg ${getRippleIconColor(getTransitRisk(currentEvent.severity))}`}>🌊</div>
                </div>
                <div className="font-medium text-gray-900">Ocean Transit</div>
                <div className={`text-sm font-medium ${getRippleTextColor(getTransitRisk(currentEvent.severity))}`}>{getTransitRisk(currentEvent.severity)} Risk</div>
                <div className="text-xs text-gray-500">+{getRippleDelay(currentEvent.severity, 1)} days</div>
              </div>

              <div className="flex-1 relative">
                <div className={`absolute top-8 left-0 right-0 border-t-2 ${getRippleBorderColor(getTransitRisk(currentEvent.severity))}`}></div>
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                  <div className={`w-4 h-4 rounded-full ${getRippleConnectorColor(getTransitRisk(currentEvent.severity))}`}></div>
                </div>
              </div>

              {/* Destination Port */}
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full ${getRippleNodeStyle(getDestinationRisk(currentEvent.severity), 'destination')} flex items-center justify-center mx-auto mb-2`}>
                  <Shield className={`h-6 w-6 ${getRippleIconColor(getDestinationRisk(currentEvent.severity))}`} />
                </div>
                <div className="font-medium text-gray-900">Port LA</div>
                <div className={`text-sm font-medium ${getRippleTextColor(getDestinationRisk(currentEvent.severity))}`}>{getDestinationRisk(currentEvent.severity)} Risk</div>
                <div className="text-xs text-gray-500">+{getRippleDelay(currentEvent.severity, 2)} days</div>
              </div>

              <div className="flex-1 relative">
                <div className={`absolute top-8 left-0 right-0 border-t-2 ${getRippleBorderColor('Low')}`}></div>
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-4 h-4 rounded-full bg-green-300"></div>
                </div>
              </div>

              {/* Final Destination */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center mx-auto mb-2">
                  <div className="text-green-500 text-lg">🏢</div>
                </div>
                <div className="font-medium text-gray-900">Distribution Center</div>
                <div className="text-sm text-green-600 font-medium">Low Risk</div>
                <div className="text-xs text-gray-500">+0.3 days</div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-8 mt-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Low 0-10%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Medium 10-20%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>High 20%+</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions for styling based on severity
function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 border-red-300';
    case 'high':
      return 'bg-orange-50 border-orange-200';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200';
    case 'low':
      return 'bg-green-50 border-green-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

function getSeverityIconColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-600';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

function getSeverityTextColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-900';
    case 'high':
      return 'text-orange-900';
    case 'medium':
      return 'text-yellow-900';
    case 'low':
      return 'text-green-900';
    default:
      return 'text-gray-900';
  }
}

// Additional helper functions for ripple effect visualization
function getRippleNodeStyle(severity: string, nodeType: string): string {
  const baseStyles: Record<string, string> = {
    'critical': 'bg-red-100 border-2 border-red-600',
    'high': 'bg-orange-100 border-2 border-orange-500',
    'medium': 'bg-yellow-100 border-2 border-yellow-500',
    'low': 'bg-green-100 border-2 border-green-500'
  };
  return baseStyles[severity.toLowerCase()] || 'bg-gray-100 border-2 border-gray-500';
}

function getRippleIconColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-600';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

function getRippleTextColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-600';
    case 'high':
      return 'text-orange-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

function getRippleBorderColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'border-red-400';
    case 'high':
      return 'border-orange-400';
    case 'medium':
      return 'border-yellow-400';
    case 'low':
      return 'border-green-400';
    default:
      return 'border-gray-300';
  }
}

function getRippleConnectorColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-400';
    case 'high':
      return 'bg-orange-400';
    case 'medium':
      return 'bg-yellow-400';
    case 'low':
      return 'bg-green-400';
    default:
      return 'bg-gray-300';
  }
}

function getOriginPort(location: string): string {
  if (location.includes('Shanghai')) return 'Port Shanghai';
  if (location.includes('Rotterdam')) return 'Port Rotterdam';
  if (location.includes('Los Angeles')) return 'Port LA';
  if (location.includes('Ningbo')) return 'Port Ningbo';
  return 'Origin Port';
}

function getTransitRisk(originSeverity: string): string {
  switch (originSeverity.toLowerCase()) {
    case 'critical':
      return 'High';
    case 'high':
      return 'Medium';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
}

function getDestinationRisk(originSeverity: string): string {
  switch (originSeverity.toLowerCase()) {
    case 'critical':
      return 'Medium';
    case 'high':
      return 'Medium';
    case 'medium':
      return 'Low';
    case 'low':
      return 'Low';
    default:
      return 'Low';
  }
}

function getRippleDelay(severity: string, position: number): string {
  const baseDelays: Record<string, number[]> = {
    'critical': [4.5, 2.8, 3.2],
    'high': [3.2, 1.8, 2.1],
    'medium': [2.1, 1.2, 1.5],
    'low': [1.0, 0.6, 0.8]
  };
  const delays = baseDelays[severity.toLowerCase()] || [2.0, 1.0, 1.5];
  return delays[position]?.toString() || '1.0';
}