import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Cloud, Shield, RefreshCw, Play, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Assessment } from "@shared/schema";

interface SecurityEvent {
  id: string;
  portName: string;
  alertType: 'customs' | 'security' | 'weather';
  duration: number; // days
  inspectionRate: number; // percentage
  clearanceMultiplier: number; // delay multiplier
  confidence: number; // 0-100
  status: 'active' | 'resolved' | 'escalated';
  description: string;
  timestamp: string;
}

interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  conditions: string;
  alerts: string[];
}

interface SecurityEventMonitorProps {
  assessment: Assessment;
}

const MAJOR_PORTS = [
  { name: 'Shanghai Port', code: 'SHA', lat: 31.2304, lon: 121.4737 },
  { name: 'Singapore Port', code: 'SIN', lat: 1.2966, lon: 103.7764 },
  { name: 'Ningbo-Zhoushan', code: 'NGB', lat: 29.8683, lon: 121.5440 },
  { name: 'Shenzhen Port', code: 'SZX', lat: 22.5431, lon: 114.0579 },
  { name: 'Hong Kong Port', code: 'HKG', lat: 22.3193, lon: 114.1694 },
  { name: 'Rotterdam Port', code: 'RTM', lat: 51.9225, lon: 4.4792 },
  { name: 'Los Angeles Port', code: 'LAX', lat: 33.7465, lon: -118.2434 },
  { name: 'Long Beach Port', code: 'LGB', lat: 33.7701, lon: -118.1937 }
];

export default function SecurityEventMonitor({ assessment }: SecurityEventMonitorProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPort, setSelectedPort] = useState(MAJOR_PORTS[0]);
  const { toast } = useToast();

  // Initialize with sample events
  useEffect(() => {
    generateInitialEvents();
  }, [assessment]);

  const generateInitialEvents = () => {
    const initialEvents: SecurityEvent[] = [
      {
        id: 'evt_001',
        portName: 'Shanghai Port',
        alertType: 'customs',
        duration: 3.2,
        inspectionRate: 85,
        clearanceMultiplier: 2.1,
        confidence: 92,
        status: 'active',
        description: 'Enhanced customs screening due to regulatory changes',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'evt_002',
        portName: 'Singapore Port',
        alertType: 'security',
        duration: 1.5,
        inspectionRate: 45,
        clearanceMultiplier: 1.3,
        confidence: 78,
        status: 'resolved',
        description: 'Security protocol update completed successfully',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    setEvents(initialEvents);
  };

  const getEventSeverity = (event: SecurityEvent) => {
    if (event.clearanceMultiplier >= 2.0 || event.duration >= 3) {
      return { level: 'High', color: 'destructive', bgColor: 'bg-red-100 border-red-300' };
    } else if (event.clearanceMultiplier >= 1.5 || event.duration >= 1.5) {
      return { level: 'Medium', color: 'secondary', bgColor: 'bg-orange-100 border-orange-300' };
    } else {
      return { level: 'Low', color: 'default', bgColor: 'bg-green-100 border-green-300' };
    }
  };

  const getStatusColor = (status: SecurityEvent['status']): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'active': return 'destructive';
      case 'resolved': return 'default';
      case 'escalated': return 'secondary';
      default: return 'outline';
    }
  };

  const triggerSecurityEvent = () => {
    const newEvent: SecurityEvent = {
      id: `evt_${Date.now()}`,
      portName: selectedPort.name,
      alertType: Math.random() > 0.5 ? 'customs' : 'security',
      duration: Math.round((Math.random() * 4 + 0.5) * 10) / 10,
      inspectionRate: Math.round(Math.random() * 60 + 30),
      clearanceMultiplier: Math.round((Math.random() * 2.5 + 1) * 10) / 10,
      confidence: Math.round(Math.random() * 30 + 70),
      status: 'active',
      description: `Simulated ${Math.random() > 0.5 ? 'customs inspection' : 'security protocol'} disruption`,
      timestamp: new Date().toISOString()
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 5)); // Keep only latest 5 events
    
    toast({
      title: "Security Event Triggered",
      description: `New ${newEvent.alertType} alert at ${newEvent.portName}`,
      variant: "destructive",
    });
  };

  const checkWeatherAlert = async () => {
    setIsLoading(true);
    try {
      // Using Open-Meteo free weather API
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${selectedPort.lat}&longitude=${selectedPort.lon}&current=temperature_2m,wind_speed_10m,precipitation&daily=precipitation_sum&timezone=auto&forecast_days=1`
      );
      
      if (!response.ok) throw new Error('Weather API request failed');
      
      const data = await response.json();
      const current = data.current;
      
      const weather: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        precipitation: current.precipitation || 0,
        conditions: getWeatherConditions(current),
        alerts: generateWeatherAlerts(current)
      };

      setWeatherData(prev => ({
        ...prev,
        [selectedPort.code]: weather
      }));

      // Create weather event if conditions are severe
      if (weather.alerts.length > 0) {
        const weatherEvent: SecurityEvent = {
          id: `weather_${Date.now()}`,
          portName: selectedPort.name,
          alertType: 'weather',
          duration: Math.round((weather.windSpeed / 10 + weather.precipitation / 5) * 10) / 10,
          inspectionRate: 20,
          clearanceMultiplier: 1 + (weather.windSpeed / 50) + (weather.precipitation / 20),
          confidence: 85,
          status: 'active',
          description: `Weather conditions: ${weather.conditions}. ${weather.alerts[0]}`,
          timestamp: new Date().toISOString()
        };
        
        setEvents(prev => [weatherEvent, ...prev].slice(0, 5));
      }

      toast({
        title: "Weather Check Complete",
        description: `${selectedPort.name}: ${weather.conditions}`,
      });

    } catch (error) {
      toast({
        title: "Weather Check Failed",
        description: "Could not fetch weather data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherConditions = (current: any): string => {
    const temp = current.temperature_2m;
    const wind = current.wind_speed_10m;
    const precip = current.precipitation || 0;

    if (wind > 40) return "Severe winds";
    if (precip > 20) return "Heavy precipitation";
    if (temp < -10 || temp > 40) return "Extreme temperatures";
    if (wind > 25) return "Strong winds";
    if (precip > 5) return "Light precipitation";
    return "Clear conditions";
  };

  const generateWeatherAlerts = (current: any): string[] => {
    const alerts: string[] = [];
    const wind = current.wind_speed_10m;
    const precip = current.precipitation || 0;
    const temp = current.temperature_2m;

    if (wind > 40) alerts.push("High wind warning - operations may be suspended");
    if (precip > 20) alerts.push("Heavy rain/snow - expect significant delays");
    if (temp < -10) alerts.push("Extreme cold - equipment performance affected");
    if (temp > 40) alerts.push("Extreme heat - worker safety protocols in effect");
    
    return alerts;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <Card className="mt-6 relative overflow-hidden bg-gray-900 border-gray-700">
      {/* World Map Background */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{
          backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`
            <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.1)" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <!-- Simplified world continents -->
              <path d="M150 120 Q200 100 250 120 Q300 110 350 130 Q400 120 450 140 L480 160 Q460 180 430 170 Q380 180 330 175 Q280 185 230 175 Q180 180 150 160 Z" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1"/>
              <path d="M120 200 Q170 180 220 200 Q270 190 320 210 L350 230 Q320 250 290 240 Q240 250 190 245 Q140 250 120 230 Z" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1"/>
              <path d="M500 140 Q550 130 600 150 Q650 140 700 160 L730 180 Q710 200 680 190 Q630 200 580 195 Q530 200 500 180 Z" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.3)" stroke-width="1"/>
              <!-- Connection lines -->
              <line x1="200" y1="140" x2="550" y2="160" stroke="rgba(34, 197, 94, 0.4)" stroke-width="2" stroke-dasharray="5,5">
                <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite"/>
              </line>
              <line x1="170" y1="220" x2="320" y2="200" stroke="rgba(34, 197, 94, 0.4)" stroke-width="2" stroke-dasharray="5,5">
                <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite"/>
              </line>
              <line x1="300" y1="130" x2="180" y2="210" stroke="rgba(34, 197, 94, 0.4)" stroke-width="2" stroke-dasharray="5,5">
                <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite"/>
              </line>
              <!-- Port nodes -->
              <circle cx="200" cy="140" r="4" fill="rgba(59, 130, 246, 0.8)">
                <animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="550" cy="160" r="4" fill="rgba(59, 130, 246, 0.8)">
                <animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="170" cy="220" r="4" fill="rgba(59, 130, 246, 0.8)">
                <animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="320" cy="200" r="4" fill="rgba(59, 130, 246, 0.8)">
                <animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite"/>
              </circle>
            </svg>
          `)}`
        }}
      />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Shield className="h-5 w-5 text-blue-400" />
              <span>🌍 Global Security Event Monitor</span>
            </CardTitle>
            <p className="text-gray-300 text-sm mt-1">
              Real-time customs, security & weather alerts for major ports worldwide
            </p>
          </div>
          <div className="flex space-x-2">
            <select 
              value={selectedPort.code} 
              onChange={(e) => setSelectedPort(MAJOR_PORTS.find(p => p.code === e.target.value) || MAJOR_PORTS[0])}
              className="text-sm bg-gray-800 border-gray-600 text-white rounded px-2 py-1"
              data-testid="select-port"
            >
              {MAJOR_PORTS.map(port => (
                <option key={port.code} value={port.code} className="bg-gray-800">{port.name}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {/* Control Panel */}
        <div className="mb-6 p-4 bg-gray-800/80 border border-gray-600 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-300">🎮 Monitoring Controls</h4>
              <p className="text-sm text-gray-300">Simulate disruptions and check conditions</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={triggerSecurityEvent}
                className="bg-red-600/20 border-red-500 text-red-300 hover:bg-red-600/30"
                data-testid="button-trigger-event"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Trigger Security Event
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={checkWeatherAlert}
                disabled={isLoading}
                className="bg-blue-600/20 border-blue-500 text-blue-300 hover:bg-blue-600/30"
                data-testid="button-check-weather"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4 mr-2" />
                )}
                Check Weather Alert
              </Button>
            </div>
          </div>
        </div>

        {/* Current Weather (if available) */}
        {weatherData[selectedPort.code] && (
          <div className="mb-6 p-4 bg-gray-800/60 border border-gray-600 rounded-lg backdrop-blur-sm">
            <h4 className="font-medium text-white mb-2">🌤️ Current Conditions - {selectedPort.name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Temperature:</span>
                <div className="font-bold text-blue-300">{weatherData[selectedPort.code].temperature}°C</div>
              </div>
              <div>
                <span className="text-gray-400">Wind Speed:</span>
                <div className="font-bold text-green-300">{weatherData[selectedPort.code].windSpeed} km/h</div>
              </div>
              <div>
                <span className="text-gray-400">Precipitation:</span>
                <div className="font-bold text-cyan-300">{weatherData[selectedPort.code].precipitation} mm</div>
              </div>
              <div>
                <span className="text-gray-400">Conditions:</span>
                <div className="font-bold text-yellow-300">{weatherData[selectedPort.code].conditions}</div>
              </div>
            </div>
            {weatherData[selectedPort.code].alerts.length > 0 && (
              <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-600 rounded">
                <p className="text-sm text-yellow-300 font-medium">⚠️ {weatherData[selectedPort.code].alerts[0]}</p>
              </div>
            )}
          </div>
        )}

        {/* Active Security Events */}
        <div className="space-y-4">
          <h4 className="font-medium text-white">🚨 Active & Recent Events</h4>
          
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Shield className="h-12 w-12 mx-auto text-gray-600 mb-2" />
              <p className="text-white">No security events detected</p>
              <p className="text-sm text-gray-300">Use controls above to simulate events</p>
            </div>
          ) : (
            events.map((event) => {
              const severity = getEventSeverity(event);
              return (
                <Card key={event.id} className="bg-gray-800/80 border-gray-600 backdrop-blur-sm transition-all duration-300">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={getStatusColor(event.status)}>
                            {event.status.toUpperCase()}
                          </Badge>
                          <Badge variant={severity.color}>
                            {severity.level} Risk
                          </Badge>
                          <span className="text-xs text-gray-600 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                          </span>
                        </div>
                        
                        <h5 className="font-semibold text-white mb-1" data-testid={`event-title-${event.id}`}>
                          {event.alertType.charAt(0).toUpperCase() + event.alertType.slice(1)} Alert - {event.portName}
                        </h5>
                        
                        <p className="text-sm text-gray-300 mb-3" data-testid={`event-description-${event.id}`}>
                          {event.description}
                        </p>

                        {/* Event Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="bg-gray-700/50 p-2 rounded border border-gray-600">
                            <div className="text-gray-400">Duration</div>
                            <div className="font-bold text-lg text-blue-300" data-testid={`event-duration-${event.id}`}>
                              {event.duration} days
                            </div>
                          </div>
                          <div className="bg-gray-700/50 p-2 rounded border border-gray-600">
                            <div className="text-gray-400">Inspection Rate</div>
                            <div className="font-bold text-lg text-orange-300" data-testid={`event-inspection-${event.id}`}>
                              {event.inspectionRate}%
                            </div>
                          </div>
                          <div className="bg-gray-700/50 p-2 rounded border border-gray-600">
                            <div className="text-gray-400">Clearance Time</div>
                            <div className="font-bold text-lg text-red-300" data-testid={`event-clearance-${event.id}`}>
                              {event.clearanceMultiplier}x
                            </div>
                          </div>
                          <div className="bg-gray-700/50 p-2 rounded border border-gray-600">
                            <div className="text-gray-400">Confidence</div>
                            <div className="font-bold text-lg text-green-300" data-testid={`event-confidence-${event.id}`}>
                              {event.confidence}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Impact Summary */}
        {events.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg backdrop-blur-sm">
            <h4 className="font-medium text-purple-300 mb-2">📊 Global Impact Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Active Events:</span>
                <div className="font-bold text-yellow-300 text-lg">
                  {events.filter(e => e.status === 'active').length}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Avg. Delay Multiplier:</span>
                <div className="font-bold text-orange-300 text-lg">
                  {(events.reduce((sum, e) => sum + e.clearanceMultiplier, 0) / events.length).toFixed(1)}x
                </div>
              </div>
              <div>
                <span className="text-gray-400">High Risk Events:</span>
                <div className="font-bold text-red-300 text-lg">
                  {events.filter(e => getEventSeverity(e).level === 'High').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}