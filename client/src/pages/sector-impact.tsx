import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Car, Heart } from 'lucide-react';
import RealTimeClock from '@/components/real-time-clock';

export default function SectorImpactPage() {
  const sectors = [
    {
      name: 'Retail',
      icon: ShoppingCart,
      serviceAtRisk: '31.5%',
      revenueAtRisk: '₹42.5Cr',
      color: 'orange',
      priority: 'HIGH'
    },
    {
      name: 'Automotive',
      icon: Car,
      serviceAtRisk: '42.0%',
      revenueAtRisk: '₹38.3Cr',
      color: 'red',
      priority: 'HIGH'
    },
    {
      name: 'Healthcare',
      icon: Heart,
      serviceAtRisk: '24.5%',
      revenueAtRisk: '₹18.3Cr',
      color: 'green',
      priority: 'HIGH',
      special: 'PRIORITIZE'
    }
  ];

  const highRiskSKUs = [
    {
      sku: 'AUTO-ENG-001',
      sector: 'Automotive',
      asp: '₹3,54,250',
      shortageRisk: 28,
      suggestedAction: 'Partial Air Freight',
      color: 'red'
    },
    {
      sku: 'RET-ELEC-042',
      sector: 'Retail',
      asp: '₹70,850',
      shortageRisk: 19,
      suggestedAction: 'Reroute via PUS',
      color: 'orange'
    },
    {
      sku: 'HC-MED-078',
      sector: 'Healthcare',
      asp: '₹1,00,200',
      shortageRisk: 15,
      suggestedAction: 'Pre-clearance',
      color: 'yellow'
    },
    {
      sku: 'AUTO-ELEC-095',
      sector: 'Automotive',
      asp: '₹54,150',
      shortageRisk: 32,
      suggestedAction: 'Buffer Stock',
      color: 'red'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Sector Impact Analysis</h1>
            <p className="text-sm text-gray-500 mt-1">Sector-specific impact assessment to prioritize critical industries</p>
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
        {/* Sector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sectors.map((sector) => {
            const Icon = sector.icon;
            return (
              <Card key={sector.name} className="relative">
                {sector.special && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      {sector.special}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      sector.color === 'red' ? 'bg-red-100' :
                      sector.color === 'orange' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        sector.color === 'red' ? 'text-red-600' :
                        sector.color === 'orange' ? 'text-orange-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold">{sector.name}</div>
                      <Badge variant={sector.color === 'red' ? 'destructive' : 'secondary'}>
                        {sector.priority}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600">Service at Risk</div>
                      <div className={`text-2xl font-bold ${
                        sector.color === 'red' ? 'text-red-600' :
                        sector.color === 'orange' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {sector.serviceAtRisk}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Revenue at Risk</div>
                      <div className={`text-2xl font-bold ${
                        sector.color === 'red' ? 'text-red-600' :
                        sector.color === 'orange' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {sector.revenueAtRisk}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          sector.color === 'red' ? 'bg-red-500' :
                          sector.color === 'orange' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: sector.serviceAtRisk }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* High-Risk SKUs Table */}
        <Card>
          <CardHeader>
            <CardTitle>High-Risk SKUs by Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SECTOR</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">ASP</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SHORTAGE RISK</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SUGGESTED ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {highRiskSKUs.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{item.sku}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          className={
                            item.sector === 'Automotive' ? 'bg-red-100 text-red-800' :
                            item.sector === 'Retail' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }
                        >
                          {item.sector}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">{item.asp}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                item.shortageRisk > 25 ? 'bg-red-500' :
                                item.shortageRisk > 15 ? 'bg-orange-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${item.shortageRisk}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{item.shortageRisk}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                          {item.suggestedAction}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}