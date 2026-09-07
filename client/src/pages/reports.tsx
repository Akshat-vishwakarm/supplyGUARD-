import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Eye, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RealTimeClock from '@/components/real-time-clock';
import type { Assessment } from '@shared/schema';

export default function ReportsPage() {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const { toast } = useToast();

  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ['/api/assessments'],
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const exportSingleReport = (assessment: Assessment, format: 'pdf' | 'excel' | 'json' = 'pdf') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(assessment, null, 2);
      filename = `assessment-${assessment.companyName}-${formatDate(assessment.createdAt)}.json`;
      mimeType = 'application/json';
    } else if (format === 'excel') {
      // CSV format for Excel compatibility
      const csvHeaders = 'Company,Industry,Overall Risk,Supplier Risk,Logistics Risk,Geopolitical Risk,Status,Date\n';
      const csvData = `"${assessment.companyName}","${assessment.industry}",${assessment.overallRiskScore || 'N/A'},${assessment.supplierRiskScore || 'N/A'},${assessment.logisticsRiskScore || 'N/A'},${assessment.geopoliticalRiskScore || 'N/A'},"${assessment.status}","${formatDate(assessment.createdAt)}"`;
      content = csvHeaders + csvData;
      filename = `assessment-${assessment.companyName}-${formatDate(assessment.createdAt)}.csv`;
      mimeType = 'text/csv';
    } else {
      // Text format for PDF-like report
      content = `SUPPLY CHAIN VULNERABILITY ASSESSMENT REPORT
========================================

Company: ${assessment.companyName}
Industry: ${assessment.industry}
Assessment Date: ${formatDate(assessment.createdAt)}
Status: ${assessment.status}

RISK SCORES
-----------
Overall Risk Score: ${assessment.overallRiskScore?.toFixed(1) || 'N/A'}/10
Supplier Risk Score: ${assessment.supplierRiskScore?.toFixed(1) || 'N/A'}/10
Logistics Risk Score: ${assessment.logisticsRiskScore?.toFixed(1) || 'N/A'}/10
Geopolitical Risk Score: ${assessment.geopoliticalRiskScore?.toFixed(1) || 'N/A'}/10

SUPPLIERS
---------
${Array.isArray(assessment.suppliers) 
  ? assessment.suppliers.map((s: any) => `• ${s.name} (${s.location}) - ${s.criticality} criticality`).join('\n')
  : 'No supplier data available'}

LOGISTICS ROUTES
----------------
${assessment.logisticsRoutes}

TRANSPORTATION METHODS
----------------------
${assessment.transportationMethods && typeof assessment.transportationMethods === 'object'
  ? Object.entries(assessment.transportationMethods)
      .filter(([_, value]) => value)
      .map(([method, _]) => `• ${method.charAt(0).toUpperCase() + method.slice(1)}`)
      .join('\n')
  : 'No transportation data available'}

RISK FACTORS
------------
${assessment.riskFactors}

VULNERABILITIES
---------------
${Array.isArray(assessment.vulnerabilities) && assessment.vulnerabilities.length > 0
  ? assessment.vulnerabilities.map((v: any) => `• ${v.title} (${v.severity}) - ${v.description}`).join('\n\n')
  : 'No vulnerabilities identified'}

RECOMMENDATIONS
---------------
${Array.isArray(assessment.recommendations) && assessment.recommendations.length > 0
  ? assessment.recommendations.map((r: any) => `${r.priority}: ${r.title}\n   ${r.description}\n   Timeline: ${r.timeline}`).join('\n\n')
  : 'No recommendations available'}

Report generated on: ${new Date().toLocaleString()}
`;
      filename = `assessment-report-${assessment.companyName}-${formatDate(assessment.createdAt)}.txt`;
      mimeType = 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${assessment.companyName} report exported as ${format.toUpperCase()}`,
    });
  };

  const exportAllReports = (format: 'pdf' | 'excel' | 'json' = selectedFormat) => {
    if (assessments.length === 0) {
      toast({
        title: "No Reports Available",
        description: "Create some assessments first to export reports.",
        variant: "destructive"
      });
      return;
    }

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(assessments, null, 2);
      filename = `all-assessments-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else if (format === 'excel') {
      const csvHeaders = 'Company,Industry,Overall Risk,Supplier Risk,Logistics Risk,Geopolitical Risk,Status,Date\n';
      const csvData = assessments.map(assessment => 
        `"${assessment.companyName}","${assessment.industry}",${assessment.overallRiskScore || 'N/A'},${assessment.supplierRiskScore || 'N/A'},${assessment.logisticsRiskScore || 'N/A'},${assessment.geopoliticalRiskScore || 'N/A'},"${assessment.status}","${formatDate(assessment.createdAt)}"`
      ).join('\n');
      content = csvHeaders + csvData;
      filename = `all-assessments-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = `SUPPLY CHAIN VULNERABILITY ASSESSMENTS SUMMARY
=============================================

Generated: ${new Date().toLocaleString()}
Total Assessments: ${assessments.length}

${assessments.map(assessment => `
Company: ${assessment.companyName} (${assessment.industry})
Overall Risk: ${assessment.overallRiskScore?.toFixed(1) || 'N/A'}/10
Status: ${assessment.status}
Date: ${formatDate(assessment.createdAt)}
${'-'.repeat(50)}`).join('\n')}

End of Report`;
      filename = `all-assessments-summary-${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Bulk Export Successful",
      description: `${assessments.length} reports exported as ${format.toUpperCase()}`,
    });
  };

  const getRiskColor = (score: number | null) => {
    if (!score) return "gray";
    if (score >= 7) return "red";
    if (score >= 4) return "orange";
    return "green";
  };

  const getRiskLabel = (score: number | null) => {
    if (!score) return "N/A";
    if (score >= 7) return "High";
    if (score >= 4) return "Medium";
    return "Low";
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Export and analyze your vulnerability assessments</p>
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
        {/* Export Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span>Export Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Format:</span>
                  <select 
                    value={selectedFormat} 
                    onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'excel' | 'json')}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                    data-testid="select-export-format"
                  >
                    <option value="pdf">PDF Report (.txt)</option>
                    <option value="excel">Excel (.csv)</option>
                    <option value="json">JSON Data (.json)</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {assessments.length} assessments available
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => exportAllReports(selectedFormat)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-export-all"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No Reports Available</h3>
                <p className="text-sm">Create vulnerability assessments to generate reports</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Report</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Risk Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">Vulnerability Report</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">{assessment.companyName}</div>
                          <div className="text-xs text-gray-500">{assessment.industry}</div>
                        </td>
                        <td className="py-3 px-4">
                          {assessment.overallRiskScore ? (
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold text-${getRiskColor(assessment.overallRiskScore)}-600`}>
                                {assessment.overallRiskScore.toFixed(1)}
                              </span>
                              <Badge variant={getRiskColor(assessment.overallRiskScore) === 'red' ? 'destructive' : 'secondary'}>
                                {getRiskLabel(assessment.overallRiskScore)}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(assessment.createdAt)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={
                              assessment.status === 'completed' ? 'default' : 
                              assessment.status === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {assessment.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => exportSingleReport(assessment, 'pdf')}
                              data-testid={`button-export-pdf-${assessment.id}`}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => exportSingleReport(assessment, 'excel')}
                              data-testid={`button-export-excel-${assessment.id}`}
                            >
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => exportSingleReport(assessment, 'json')}
                              data-testid={`button-export-json-${assessment.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Summary */}
        {assessments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{assessments.length}</div>
                  <div className="text-sm text-gray-600">Total Reports</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {assessments.filter(a => a.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {assessments.filter(a => a.overallRiskScore && a.overallRiskScore >= 7).length}
                  </div>
                  <div className="text-sm text-gray-600">High Risk</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {(assessments.reduce((sum, a) => sum + (a.overallRiskScore || 0), 0) / assessments.filter(a => a.overallRiskScore).length || 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Risk Score</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}