import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Activity, AlertTriangle, ZoomIn, ZoomOut, RotateCcw, Clock, Gauge, CloudSun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import worldMapImage from '@assets/WhatsApp Image 2025-08-24 at 08.42.30_24dcea35_1756006216962.jpg';

interface NetworkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  status: 'active' | 'warning' | 'critical';
  connections: number;
  region: string;
  inspectionRate: number;
  clearanceTimeMultiplier: string;
  weatherAlert: string;
  lastUpdated: string;
}

export default function InteractiveWorldMap() {
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Fetch real-time port status data
  const { data: networkNodes = [], isLoading } = useQuery({
    queryKey: ['/api/ports/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ports/status');
      return await response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 2,
  });

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    setHoveredNode(node);
    // Simulate showing connections
    const connectedNodes = networkNodes
      .filter((n: NetworkNode) => n.id !== node.id)
      .slice(0, Math.min(node.connections, 5))
      .map((n: NetworkNode) => n.id);
    setActiveConnections(connectedNodes);
  };

  // Zoom functionality
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    handleZoom(delta);
  }, [handleZoom]);

  // Pan functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400';
      case 'warning': return 'bg-yellow-400';
      case 'critical': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  useEffect(() => {
    // Auto-animate connections every 5 seconds when no node is selected
    if (!selectedNode && networkNodes.length > 0) {
      const interval = setInterval(() => {
        const randomNode = networkNodes[Math.floor(Math.random() * networkNodes.length)];
        setActiveConnections([randomNode.id]);
        setTimeout(() => setActiveConnections([]), 3000);
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [selectedNode, networkNodes]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <Card className="min-h-[600px] h-[70vh] bg-gray-900 border-gray-700 overflow-hidden">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto mb-4" />
            <p>Loading live port data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-[600px] h-[70vh] bg-gray-900 border-gray-700 overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-white">
            <Activity className="h-5 w-5 text-blue-400" />
            <span>Global Supply Chain Network</span>
            <Badge variant="outline" className="ml-2 text-green-400 border-green-400">
              Live Data
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">Active: {networkNodes.filter((n: NetworkNode) => n.status === 'active').length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400">Warning: {networkNodes.filter((n: NetworkNode) => n.status === 'warning').length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-400">Critical: {networkNodes.filter((n: NetworkNode) => n.status === 'critical').length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoom(0.2)}
                className="text-white hover:bg-gray-700 h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoom(-0.2)}
                className="text-white hover:bg-gray-700 h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetView}
                className="text-white hover:bg-gray-700 h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent 
        className="p-0 relative flex-1 overflow-hidden cursor-move" 
        style={{ height: 'calc(100% - 80px)' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        ref={mapRef}
      >
        {/* World Map Background */}
        <div 
          className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-80 transition-transform duration-200 ease-out"
          style={{ 
            backgroundImage: `url(${worldMapImage})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Network Nodes */}
          {networkNodes.map((node: NetworkNode) => (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                activeConnections.includes(node.id) ? 'scale-150 z-20' : 'hover:scale-125 z-10'
              }`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Node Pulse Effect */}
              <div className={`absolute inset-0 ${getStatusColor(node.status)} rounded-full animate-ping opacity-20`}></div>
              
              {/* Main Node */}
              <div className={`relative h-4 w-4 ${getStatusColor(node.status)} rounded-full shadow-lg border-2 border-white`}>
                {/* Connection indicator */}
                {activeConnections.includes(node.id) && (
                  <div className="absolute -inset-2 border-2 border-blue-400 rounded-full animate-pulse"></div>
                )}
              </div>
              
              {/* Node Label */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                {node.name}
              </div>
            </div>
          ))}

          {/* Connection Lines - Animated */}
          {activeConnections.length > 0 && hoveredNode && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {networkNodes
                .filter((node: NetworkNode) => activeConnections.includes(node.id))
                .map((targetNode: NetworkNode, index: number) => {
                  if (!hoveredNode) return null;
                  
                  const startX = (hoveredNode.x / 100) * 100;
                  const startY = (hoveredNode.y / 100) * 100;
                  const endX = (targetNode.x / 100) * 100;
                  const endY = (targetNode.y / 100) * 100;
                  
                  return (
                    <line
                      key={`connection-${index}`}
                      x1={`${startX}%`}
                      y1={`${startY}%`}
                      x2={`${endX}%`}
                      y2={`${endY}%`}
                      stroke="rgba(59, 130, 246, 0.6)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="0;10"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </line>
                  );
                })}
            </svg>
          )}
        </div>

        {/* Enhanced Node Information Panel */}
        {(hoveredNode || selectedNode) && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-95 border border-gray-600 rounded-lg p-4 text-white min-w-80 z-30 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{(hoveredNode || selectedNode)?.name}</h3>
              <Badge variant={getStatusBadgeVariant((hoveredNode || selectedNode)?.status || 'active')}>
                {(hoveredNode || selectedNode)?.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block">Region</span>
                  <span className="font-medium">{(hoveredNode || selectedNode)?.region}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Connections</span>
                  <span className="text-blue-400 font-medium">{(hoveredNode || selectedNode)?.connections}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-3">
                <h4 className="font-medium mb-2 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  Live Port Data
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center">
                      <Gauge className="h-3 w-3 mr-1" />
                      Inspection Rate
                    </span>
                    <span className="font-medium text-green-400">{(hoveredNode || selectedNode)?.inspectionRate}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Clearance Time
                    </span>
                    <span className="font-medium">{(hoveredNode || selectedNode)?.clearanceTimeMultiplier}x normal</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center">
                      <CloudSun className="h-3 w-3 mr-1" />
                      Weather
                    </span>
                    <span className="font-medium">{(hoveredNode || selectedNode)?.weatherAlert}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-600 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-400">{formatTime((hoveredNode || selectedNode)?.lastUpdated || '')}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                🔄 Updates every 10s • Use mouse wheel to zoom • Drag to pan
              </p>
              {selectedNode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedNode(null); setActiveConnections([]); }}
                  className="mt-2 text-xs text-gray-400 hover:text-white h-6"
                >
                  Close details
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-90 border border-gray-600 rounded-lg p-3 text-white">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            Network Legend
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              <span>Active Ports</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
              <span>Minor Delays</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-red-400 rounded-full"></div>
              <span>Major Disruptions</span>
            </div>
          </div>
        </div>

        {/* Real-time Activity Indicator with Zoom Level */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-90 border border-gray-600 rounded-lg px-3 py-2 text-white">
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Network Monitor</span>
            </div>
            <div className="text-xs text-gray-400">
              Zoom: {(zoom * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}