// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Satellite, Map, Image, Activity, Clock, Gauge, CloudSun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PortData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'active' | 'warning' | 'critical';
  inspectionRate: number;
  clearanceTimeMultiplier: string;
  weatherAlert: string;
  lastUpdated: string;
  connections: number;
  region: string;
}

interface GoogleMapsIntegrationProps {
  onPortSelect?: (port: PortData) => void;
}

export default function GoogleMapsIntegration({ onPortSelect }: GoogleMapsIntegrationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPort, setSelectedPort] = useState<PortData | null>(null);
  
  // Major world ports with accurate coordinates
  const worldPorts: PortData[] = [
    {
      id: 'shanghai',
      name: 'Port of Shanghai',
      lat: 31.2304,
      lng: 121.4737,
      status: 'active',
      inspectionRate: 95,
      clearanceTimeMultiplier: '1.2x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 8,
      region: 'Asia Pacific'
    },
    {
      id: 'singapore',
      name: 'Port of Singapore',
      lat: 1.2966,
      lng: 103.7764,
      status: 'active',
      inspectionRate: 98,
      clearanceTimeMultiplier: '0.8x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 12,
      region: 'Asia Pacific'
    },
    {
      id: 'ningbo',
      name: 'Port of Ningbo-Zhoushan',
      lat: 29.8683,
      lng: 121.5440,
      status: 'warning',
      inspectionRate: 88,
      clearanceTimeMultiplier: '1.5x',
      weatherAlert: 'Moderate fog',
      lastUpdated: new Date().toISOString(),
      connections: 6,
      region: 'Asia Pacific'
    },
    {
      id: 'shenzhen',
      name: 'Port of Shenzhen',
      lat: 22.5431,
      lng: 114.0579,
      status: 'active',
      inspectionRate: 92,
      clearanceTimeMultiplier: '1.1x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 7,
      region: 'Asia Pacific'
    },
    {
      id: 'guangzhou',
      name: 'Port of Guangzhou',
      lat: 23.1291,
      lng: 113.2644,
      status: 'active',
      inspectionRate: 89,
      clearanceTimeMultiplier: '1.3x',
      weatherAlert: 'Light rain',
      lastUpdated: new Date().toISOString(),
      connections: 5,
      region: 'Asia Pacific'
    },
    {
      id: 'busan',
      name: 'Port of Busan',
      lat: 35.1796,
      lng: 129.0756,
      status: 'active',
      inspectionRate: 94,
      clearanceTimeMultiplier: '0.9x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 6,
      region: 'Asia Pacific'
    },
    {
      id: 'hong_kong',
      name: 'Port of Hong Kong',
      lat: 22.3193,
      lng: 114.1694,
      status: 'active',
      inspectionRate: 96,
      clearanceTimeMultiplier: '0.7x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 9,
      region: 'Asia Pacific'
    },
    {
      id: 'los_angeles',
      name: 'Port of Los Angeles',
      lat: 33.7361,
      lng: -118.2639,
      status: 'active',
      inspectionRate: 91,
      clearanceTimeMultiplier: '1.4x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 8,
      region: 'North America'
    },
    {
      id: 'long_beach',
      name: 'Port of Long Beach',
      lat: 33.7701,
      lng: -118.2148,
      status: 'warning',
      inspectionRate: 87,
      clearanceTimeMultiplier: '1.6x',
      weatherAlert: 'Heavy traffic',
      lastUpdated: new Date().toISOString(),
      connections: 7,
      region: 'North America'
    },
    {
      id: 'new_york',
      name: 'Port of New York/New Jersey',
      lat: 40.6892,
      lng: -74.0445,
      status: 'active',
      inspectionRate: 93,
      clearanceTimeMultiplier: '1.2x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 9,
      region: 'North America'
    },
    {
      id: 'rotterdam',
      name: 'Port of Rotterdam',
      lat: 51.9225,
      lng: 4.4792,
      status: 'active',
      inspectionRate: 97,
      clearanceTimeMultiplier: '0.8x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 11,
      region: 'Europe'
    },
    {
      id: 'antwerp',
      name: 'Port of Antwerp',
      lat: 51.2194,
      lng: 4.4025,
      status: 'active',
      inspectionRate: 95,
      clearanceTimeMultiplier: '0.9x',
      weatherAlert: 'Light fog',
      lastUpdated: new Date().toISOString(),
      connections: 8,
      region: 'Europe'
    },
    {
      id: 'hamburg',
      name: 'Port of Hamburg',
      lat: 53.5511,
      lng: 9.9937,
      status: 'warning',
      inspectionRate: 90,
      clearanceTimeMultiplier: '1.3x',
      weatherAlert: 'Strong winds',
      lastUpdated: new Date().toISOString(),
      connections: 6,
      region: 'Europe'
    },
    {
      id: 'dubai',
      name: 'Port of Dubai (Jebel Ali)',
      lat: 25.0119,
      lng: 55.1131,
      status: 'active',
      inspectionRate: 93,
      clearanceTimeMultiplier: '1.0x',
      weatherAlert: 'Clear',
      lastUpdated: new Date().toISOString(),
      connections: 10,
      region: 'Middle East'
    },
    {
      id: 'mumbai',
      name: 'Port of Mumbai',
      lat: 18.9220,
      lng: 72.8347,
      status: 'critical',
      inspectionRate: 75,
      clearanceTimeMultiplier: '2.1x',
      weatherAlert: 'Monsoon delays',
      lastUpdated: new Date().toISOString(),
      connections: 5,
      region: 'Asia Pacific'
    }
  ];

  // Fetch real-time port data and merge with coordinates
  const { data: realTimePortData = [] } = useQuery({
    queryKey: ['/api/ports/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ports/status');
      return await response.json();
    },
    refetchInterval: 10000,
    retry: 2,
  });

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        const { Map } = await loader.importLibrary('maps');
        const { AdvancedMarkerElement } = await loader.importLibrary('marker');

        if (mapRef.current) {
          const map = new Map(mapRef.current, {
            center: { lat: 20, lng: 0 }, // Center of world
            zoom: 3,
            mapTypeId: mapType,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_CENTER,
            },
            zoomControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            gestureHandling: 'greedy'
          });

          mapInstanceRef.current = map;
          infoWindowRef.current = new google.maps.InfoWindow();
          
          setIsMapLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initializeMap();
  }, []);

  // Update map type
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Add markers for ports
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Merge real-time data with port coordinates
    const mergedPortData = worldPorts.map(port => {
      const realTimeData = realTimePortData.find((rtd: any) => 
        rtd.name.toLowerCase().includes(port.name.toLowerCase().split(' ')[2]?.toLowerCase() || port.name.toLowerCase())
      );
      return realTimeData ? { ...port, ...realTimeData } : port;
    });

    // Add markers for each port
    mergedPortData.forEach((port) => {
      const marker = new google.maps.Marker({
        position: { lat: port.lat, lng: port.lng },
        map: mapInstanceRef.current,
        title: port.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getStatusColor(port.status),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedPort(port);
        if (onPortSelect) {
          onPortSelect(port);
        }

        // Show info window with port details
        const infoContent = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">${port.name}</h3>
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${getStatusColor(port.status)}; margin-right: 6px;"></span>
              <span style="font-size: 14px; color: #374151;">${port.status.toUpperCase()}</span>
            </div>
            <div style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Inspection Rate:</strong> ${port.inspectionRate}%
            </div>
            <div style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Clearance Time:</strong> ${port.clearanceTimeMultiplier}
            </div>
            <div style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Weather:</strong> ${port.weatherAlert}
            </div>
            <div style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Region:</strong> ${port.region}
            </div>
            <div style="margin: 8px 0 0 0;">
              <button onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(port.name)}/@${port.lat},${port.lng},15z', '_blank')" 
                      style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                View on Google Maps
              </button>
            </div>
          </div>
        `;

        infoWindowRef.current?.setContent(infoContent);
        infoWindowRef.current?.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [isMapLoaded, realTimePortData, onPortSelect]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleSearch = useCallback(() => {
    if (!mapInstanceRef.current || !searchQuery.trim()) return;

    const service = new google.maps.places.PlacesService(mapInstanceRef.current);
    
    const request = {
      query: searchQuery + ' port',
      fields: ['name', 'geometry', 'formatted_address', 'photos'],
    };

    service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
        const place = results[0];
        const location = place.geometry?.location;
        
        if (location) {
          mapInstanceRef.current?.setCenter(location);
          mapInstanceRef.current?.setZoom(15);

          // Create custom marker for search result
          const searchMarker = new google.maps.Marker({
            position: location,
            map: mapInstanceRef.current,
            title: place.name,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });

          // Show info with photos if available
          let photoHtml = '';
          if (place.photos && place.photos[0]) {
            const photoUrl = place.photos[0].getUrl({ maxWidth: 200, maxHeight: 150 });
            photoHtml = `<img src="${photoUrl}" style="width: 100%; max-width: 200px; height: auto; border-radius: 4px; margin: 8px 0;" alt="${place.name}" />`;
          }

          const searchInfoContent = `
            <div style="padding: 8px; min-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">${place.name}</h3>
              ${photoHtml}
              <div style="margin: 4px 0; font-size: 13px; color: #6b7280;">
                <strong>Address:</strong> ${place.formatted_address}
              </div>
              <div style="margin: 8px 0 0 0;">
                <button onclick="window.open('https://www.google.com/maps/place/${encodeURIComponent(place.formatted_address || '')}', '_blank')" 
                        style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 4px;">
                  View on Google Maps
                </button>
                <button onclick="window.open('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat()},${location.lng()}', '_blank')" 
                        style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  Street View
                </button>
              </div>
            </div>
          `;

          infoWindowRef.current?.setContent(searchInfoContent);
          infoWindowRef.current?.open(mapInstanceRef.current, searchMarker);
        }
      }
    });
  }, [searchQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Global Port Network - Live Satellite View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={mapType === 'roadmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapType('roadmap')}
            >
              <Map className="h-4 w-4" />
            </Button>
            <Button
              variant={mapType === 'satellite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapType('satellite')}
            >
              <Satellite className="h-4 w-4" />
            </Button>
            <Button
              variant={mapType === 'hybrid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapType('hybrid')}
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="flex gap-2 mt-3">
          <Input
            type="text"
            placeholder="Search for ports worldwide (e.g., 'Rotterdam Port', 'Singapore Harbor')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative">
          {/* Google Map Container */}
          <div
            ref={mapRef}
            className="w-full h-[600px] bg-gray-100"
            style={{ minHeight: '600px' }}
          />
          
          {/* Loading Overlay */}
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
                <p className="text-gray-600">Loading Google Maps...</p>
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="font-semibold text-sm mb-2">Port Status Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Active - Normal Operations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Warning - Minor Delays</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Critical - Major Issues</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
              • Click ports for detailed information
              • Use satellite view for real port imagery
              • Search any port worldwide
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}