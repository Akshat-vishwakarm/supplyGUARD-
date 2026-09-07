import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ExternalLink, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function GoogleMapsFallbackNotice() {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          Google Maps Integration Available
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            <strong>Enhanced Google Maps Ready!</strong> To activate real satellite view, port search, and street view imagery:
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 space-y-3 text-sm text-yellow-800">
          <div className="flex items-start gap-3">
            <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Enable Billing:</strong> Go to Google Cloud Console → Billing → Enable billing for your project
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>APIs Needed:</strong> Maps JavaScript API, Places API, Street View Static API
            </div>
          </div>
          
          <div className="text-xs mt-3 p-3 bg-white rounded border border-yellow-200">
            Once billing is enabled, you'll get:
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Real satellite imagery when zooming in</li>
              <li>Search any port worldwide with real photos</li>
              <li>Street View integration for port ground imagery</li>
              <li>Full Google Maps experience with hybrid/terrain views</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
            className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Setup Billing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}