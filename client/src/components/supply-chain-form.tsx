import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { assessmentInputSchema, type AssessmentInput, type Supplier } from "@shared/schema";
import { Building, Users, Route, AlertTriangle, Plus, RotateCcw, Brain, Sparkles, Zap } from "lucide-react";

interface SupplyChainFormProps {
  onAssessmentCreated: (id: string) => void;
  isProcessing: boolean;
}

export default function SupplyChainForm({ onAssessmentCreated, isProcessing }: SupplyChainFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { name: "", location: "", criticality: "Medium", products: "" }
  ]);
  const [aiLoadingSuppliers, setAiLoadingSuppliers] = useState<number | null>(null);
  const [aiLoadingRisks, setAiLoadingRisks] = useState(false);
  const [detectedRisks, setDetectedRisks] = useState<Array<{name: string, score: number, explanation: string, checked: boolean}>>([]);

  const form = useForm<AssessmentInput>({
    resolver: zodResolver(assessmentInputSchema.omit({ suppliers: true })), // Validate suppliers separately
    defaultValues: {
      companyName: "",
      industry: "",
      suppliers: suppliers,
      logisticsRoutes: "",
      transportationMethods: {
        ocean: false,
        air: false,
        truck: false,
        rail: false,
      },
      riskFactors: "",
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: AssessmentInput) => {
      const response = await apiRequest("POST", "/api/assessments", data);
      return response.json();
    },
    onSuccess: (assessment) => {
      toast({
        title: "Assessment Created",
        description: "Your supply chain assessment has been submitted for AI analysis.",
      });
      onAssessmentCreated(assessment.id);
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssessmentInput) => {
    // Validate suppliers manually since they're in separate state
    if (suppliers.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one supplier is required.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if all suppliers have required fields
    const incompleteSuppliers = suppliers.filter(s => !s.name || !s.location);
    if (incompleteSuppliers.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in supplier name and location for all suppliers.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = { ...data, suppliers };
    console.log("Submitting assessment data:", formData);
    createAssessmentMutation.mutate(formData);
  };

  const addSupplier = () => {
    setSuppliers([...suppliers, { name: "", location: "", criticality: "Medium", products: "" }]);
  };

  const updateSupplier = (index: number, field: keyof Supplier, value: string) => {
    const updated = [...suppliers];
    updated[index] = { ...updated[index], [field]: value };
    setSuppliers(updated);
  };

  const removeSupplier = (index: number) => {
    if (suppliers.length > 1) {
      setSuppliers(suppliers.filter((_, i) => i !== index));
    }
  };

  // AI Fill Suppliers Handler
  const handleAiFillSupplier = async (index: number) => {
    const supplier = suppliers[index];
    if (!supplier.name || !supplier.location) return;
    
    setAiLoadingSuppliers(index);
    try {
      const response = await apiRequest('POST', '/api/ai/fill-suppliers', {
        companyName: form.getValues('companyName'),
        industry: form.getValues('industry'),
        supplierName: supplier.name,
        location: supplier.location
      });
      
      const data = await response.json();
      if (data.success && data.suggestions) {
        const newSuppliers = [...suppliers];
        newSuppliers[index] = {
          ...newSuppliers[index],
          products: data.suggestions.products,
          criticality: data.suggestions.criticality as "High" | "Medium" | "Low"
        };
        setSuppliers(newSuppliers);
        
        toast({
          title: "AI Suggestions Applied",
          description: `Filled products and criticality for ${supplier.name}. Reasoning: ${data.suggestions.reasoning}`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "AI Fill Failed",
        description: "Could not generate supplier suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAiLoadingSuppliers(null);
    }
  };

  // Auto-detect Risks Handler
  const handleAutoDetectRisks = async () => {
    setAiLoadingRisks(true);
    try {
      const formValues = form.getValues();
      const response = await apiRequest('POST', '/api/ai/detect-risks', {
        companyName: formValues.companyName,
        industry: formValues.industry,
        suppliers: suppliers,
        logisticsRoutes: formValues.logisticsRoutes,
        transportationMethods: formValues.transportationMethods
      });
      
      const data = await response.json();
      if (data.success && data.riskFactors) {
        setDetectedRisks(data.riskFactors);
        
        // Auto-check high-risk factors
        const highRiskFactors = data.riskFactors.filter((r: any) => r.score >= 70 && r.checked);
        if (highRiskFactors.length > 0) {
          const riskNames = highRiskFactors.map((r: any) => r.name).join(', ');
          form.setValue('riskFactors', riskNames);
        }
        
        toast({
          title: "AI Risk Detection Complete",
          description: `Detected ${data.riskFactors.length} potential risk factors. Review and select applicable ones.`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Auto-detect Failed",
        description: "Could not detect risk factors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAiLoadingRisks(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setSuppliers([{ name: "", location: "", criticality: "Medium", products: "" }]);
    setDetectedRisks([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Supply Chain Assessment</CardTitle>
            <p className="text-gray-600 mt-1">Input your supply chain data for AI-powered vulnerability analysis</p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetForm} data-testid="button-reset-form">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Company Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building className="text-primary mr-2 h-5 w-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your company name" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry Sector</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-industry">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Automotive">Automotive</SelectItem>
                          <SelectItem value="Energy">Energy</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Suppliers */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="text-primary mr-2 h-5 w-5" />
                Key Suppliers
              </h3>
              <div className="space-y-4">
                {suppliers.map((supplier, index) => (
                  <Card key={index} className="border-gray-200 bg-gray-50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier Name
                          </label>
                          <Input
                            placeholder="Enter supplier name"
                            value={supplier.name}
                            onChange={(e) => updateSupplier(index, "name", e.target.value)}
                            data-testid={`input-supplier-name-${index}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <Select
                            value={supplier.location}
                            onValueChange={(value) => updateSupplier(index, "location", value)}
                          >
                            <SelectTrigger data-testid={`select-supplier-location-${index}`}>
                              <SelectValue placeholder="Select port location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Shanghai Port, China">Shanghai Port, China</SelectItem>
                              <SelectItem value="Los Angeles Port, USA">Los Angeles Port, USA</SelectItem>
                              <SelectItem value="New York Port, USA">New York Port, USA</SelectItem>
                              <SelectItem value="Rotterdam Port, Netherlands">Rotterdam Port, Netherlands</SelectItem>
                              <SelectItem value="Singapore Port, Singapore">Singapore Port, Singapore</SelectItem>
                              <SelectItem value="Dubai Port, UAE">Dubai Port, UAE</SelectItem>
                              <SelectItem value="Mumbai Port, India">Mumbai Port, India</SelectItem>
                              <SelectItem value="Santos Port, Brazil">Santos Port, Brazil</SelectItem>
                              <SelectItem value="London Gateway, UK">London Gateway, UK</SelectItem>
                              <SelectItem value="Cape Town Port, South Africa">Cape Town Port, South Africa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* AI Fill Button */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAiFillSupplier(index)}
                            disabled={aiLoadingSuppliers === index || !supplier.name || !supplier.location}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            data-testid={`button-ai-fill-${index}`}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {aiLoadingSuppliers === index ? "AI Analyzing..." : "AI Fill"}
                          </Button>
                          {suppliers.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSupplier(index)}
                              data-testid={`button-remove-supplier-${index}`}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        {(!supplier.name || !supplier.location) && (
                          <p className="text-xs text-gray-500 mt-1">Enter supplier name and location first</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={addSupplier}
                  data-testid="button-add-supplier"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Supplier
                </Button>
              </div>
            </div>

            {/* Logistics Routes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Route className="text-primary mr-2 h-5 w-5" />
                Logistics Routes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logisticsRoutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Shipping Routes</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger data-testid="select-logistics-routes">
                            <SelectValue placeholder="Select primary shipping route" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New York Port to Mumbai Port">New York Port to Mumbai Port</SelectItem>
                            <SelectItem value="Shanghai Port to Los Angeles Port">Shanghai Port to Los Angeles Port</SelectItem>
                            <SelectItem value="Rotterdam Port to New York Port">Rotterdam Port to New York Port</SelectItem>
                            <SelectItem value="Singapore Port to Dubai Port">Singapore Port to Dubai Port</SelectItem>
                            <SelectItem value="Los Angeles Port to Shanghai Port">Los Angeles Port to Shanghai Port</SelectItem>
                            <SelectItem value="Mumbai Port to London Gateway">Mumbai Port to London Gateway</SelectItem>
                            <SelectItem value="Santos Port to Rotterdam Port">Santos Port to Rotterdam Port</SelectItem>
                            <SelectItem value="Dubai Port to Singapore Port">Dubai Port to Singapore Port</SelectItem>
                            <SelectItem value="Cape Town Port to Santos Port">Cape Town Port to Santos Port</SelectItem>
                            <SelectItem value="London Gateway to Cape Town Port">London Gateway to Cape Town Port</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Transportation Methods</FormLabel>
                  <div className="space-y-2 mt-2">
                    <FormField
                      control={form.control}
                      name="transportationMethods.ocean"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-transport-ocean"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Ocean Freight</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transportationMethods.air"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-transport-air"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Air Freight</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transportationMethods.truck"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-transport-truck"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Trucking</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transportationMethods.rail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-transport-rail"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Rail</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="text-primary mr-2 h-5 w-5" />
                  Known Risk Factors
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDetectRisks}
                  disabled={aiLoadingRisks}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  data-testid="button-auto-detect-risks"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {aiLoadingRisks ? "AI Detecting..." : "Auto-detect Risks"}
                </Button>
              </div>
              <FormField
                control={form.control}
                name="riskFactors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select applicable risk factors (check all that apply)</FormLabel>
                    <FormControl>
                      <div className="space-y-3 mt-2">
                        {/* AI Detected Risks */}
                        {detectedRisks.length > 0 && (
                          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                              <Sparkles className="h-4 w-4 mr-1" />
                              AI-Detected Risks
                            </h4>
                            <div className="space-y-2">
                              {detectedRisks.map((risk, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <Checkbox 
                                    checked={risk.checked}
                                    onCheckedChange={(checked) => {
                                      const updatedRisks = [...detectedRisks];
                                      updatedRisks[idx].checked = !!checked;
                                      setDetectedRisks(updatedRisks);
                                      
                                      // Update form value
                                      const checkedRisks = updatedRisks.filter(r => r.checked).map(r => r.name).join(', ');
                                      const otherRisks = field.value?.split(', ').filter(r => !detectedRisks.some(dr => dr.name === r)) || [];
                                      field.onChange([...otherRisks, ...updatedRisks.filter(r => r.checked).map(r => r.name)].filter(Boolean).join(', '));
                                    }}
                                    data-testid={`checkbox-ai-risk-${idx}`}
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{risk.name}</span>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <div className={`text-xs px-2 py-1 rounded ${risk.score >= 70 ? 'bg-red-100 text-red-700' : risk.score >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                        Risk: {risk.score}%
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">{risk.explanation}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 flex items-center">
                <Brain className="mr-1 h-4 w-4" />
                Data is processed securely using Gemini 3.6 Flash AI
              </div>
              <Button
                type="submit"
                disabled={createAssessmentMutation.isPending || isProcessing}
                data-testid="button-analyze-vulnerabilities"
              >
                {createAssessmentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Creating Assessment...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze Vulnerabilities
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
