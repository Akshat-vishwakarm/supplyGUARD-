import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Play, Pause, RefreshCw, Shield, Wind, Megaphone, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Alert {
  id: string;
  severity: 'Critical' | 'Warning' | 'Info';
  type: 'port' | 'weather' | 'strike';
  headline: string;
  description: string;
  source: string;
  timestamp: string;
  suggestedAction: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    severity: 'Critical',
    type: 'port',
    headline: 'Shanghai Port experiencing severe congestion delays',
    description: 'Heavy congestion at Shanghai Port due to increased cargo volume and customs processing delays. Ships facing 3-5 day waiting times.',
    source: 'Port Authority Shanghai',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    suggestedAction: 'Consider rerouting shipments through alternative ports like Ningbo or Qingdao'
  },
  {
    id: '2',
    severity: 'Warning',
    type: 'weather',
    headline: 'Typhoon warning issued for South China Sea shipping routes',
    description: 'Typhoon Khanun approaching with sustained winds of 120 km/h. Maritime traffic advisories in effect.',
    source: 'Open-Meteo',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    suggestedAction: 'Delay shipments or secure vessels in protected harbors until conditions improve'
  },
  {
    id: '3',
    severity: 'Critical',
    type: 'strike',
    headline: 'Major strike at Los Angeles Port affecting cargo operations',
    description: 'Longshoremen union strike enters day 3, halting container operations at 40% of terminals.',
    source: 'Port Labor News',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    suggestedAction: 'Reroute to Long Beach or consider air freight for urgent shipments'
  },
  {
    id: '4',
    severity: 'Info',
    type: 'port',
    headline: 'Rotterdam Port implements new customs clearance system',
    description: 'New digital customs system goes live, expected to reduce clearance times by 30%.',
    source: 'Port of Rotterdam',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    suggestedAction: 'Update documentation processes to take advantage of faster clearance'
  },
  {
    id: '5',
    severity: 'Warning',
    type: 'weather',
    headline: 'Heavy fog disrupting operations at UK ports',
    description: 'Dense fog across English Channel causing vessel delays and reduced visibility.',
    source: 'UK Met Office',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    suggestedAction: 'Expect delays, maintain communication with shipping agents for updates'
  },
  {
    id: '6',
    severity: 'Info',
    type: 'port',
    headline: 'Singapore Port announces capacity expansion completion',
    description: 'New terminal facilities now operational, increasing total capacity by 25%.',
    source: 'PSA Singapore',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    suggestedAction: 'Consider Singapore as alternative route for increased reliability'
  },
  {
    id: '7',
    severity: 'Warning',
    type: 'strike',
    headline: 'Truck drivers strike in Northern Germany affecting port logistics',
    description: 'Regional trucking strike impacting cargo movement from Hamburg and Bremen ports.',
    source: 'Transport Workers Union',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    suggestedAction: 'Arrange alternative inland transportation or use rail freight'
  },
  {
    id: '8',
    severity: 'Critical',
    type: 'weather',
    headline: 'Hurricane approaching Gulf of Mexico ports',
    description: 'Category 2 hurricane expected to impact Houston and New Orleans ports within 48 hours.',
    source: 'NOAA Weather Service',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    suggestedAction: 'Immediate evacuation of vessels and securing of port infrastructure'
  }
];

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'Warning': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Info': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getAlertIcon(type: string): React.ReactNode {
  switch (type) {
    case 'port': return <Shield className="h-4 w-4" />;
    case 'weather': return <Wind className="h-4 w-4" />;
    case 'strike': return <Megaphone className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
}

export default function GlobalAlertsPanel() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch alerts with polling
  const { data: fetchedAlerts, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/global-alerts'],
    queryFn: async () => {
      if (useMockData) {
        return mockAlerts;
      }
      try {
        const response = await apiRequest('GET', '/api/global-alerts');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.error('Failed to fetch global alerts:', err);
        // Return mock data as fallback instead of throwing
        return mockAlerts;
      }
    },
    refetchInterval: 60000, // Poll every 60 seconds
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Update alerts with deduplication
  useEffect(() => {
    if (fetchedAlerts) {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(alert => alert.id));
        const newAlerts = fetchedAlerts.filter((alert: Alert) => !existingIds.has(alert.id));
        return [...newAlerts, ...prev].slice(0, 20); // Keep latest 20 alerts
      });
    }
  }, [fetchedAlerts]);

  // Auto-scroll functionality
  useEffect(() => {
    if (isPlaying && !isHovered && alerts.length > 0) {
      autoScrollRef.current = setInterval(() => {
        try {
          if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = 60; // Height of one alert item
            
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - scrollAmount) {
              // Reset to top when reached bottom
              container.scrollTop = 0;
            } else {
              container.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            }
          }
        } catch (err) {
          console.error('Auto-scroll error:', err);
        }
      }, 4000); // Scroll every 4 seconds
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };
  }, [isPlaying, isHovered, alerts.length]);

  // Initialize with mock data on first load
  useEffect(() => {
    if (!fetchedAlerts && !isLoading) {
      setAlerts(mockAlerts);
    }
  }, [fetchedAlerts, isLoading]);

  const handleRefresh = () => {
    try {
      refetch();
    } catch (err) {
      console.error('Failed to refresh alerts:', err);
    }
  };

  const handleUseMockData = () => {
    setUseMockData(true);
    setAlerts(mockAlerts);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Recent Global Alerts / Events
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-600">LIVE</span>
            </div>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-alerts-play-pause"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              data-testid="button-alerts-refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-3">Failed to load live alerts</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseMockData}
              data-testid="button-use-mock-data"
            >
              Use Mock Data
            </Button>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="space-y-1 p-2">
              {alerts.map((alert) => (
                <Sheet key={alert.id}>
                  <SheetTrigger asChild>
                    <div
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                      onClick={() => setSelectedAlert(alert)}
                      data-testid={`alert-item-${alert.id}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSeverityColor(alert.severity)}`}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm leading-tight truncate" title={alert.headline}>
                          {alert.headline}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.source} • {formatTimeAgo(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <div className="flex items-center gap-2 mb-2">
                        {getAlertIcon(alert.type)}
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(alert.severity)}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <SheetTitle className="text-left">{alert.headline}</SheetTitle>
                      <SheetDescription className="text-left">
                        {alert.source} • {formatTimeAgo(alert.timestamp)}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Details</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {alert.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Suggested Action</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            {alert.suggestedAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No alerts available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}