import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { KPIEntryForm } from '../../components/KPIEntryForm';
import { apiService } from '../../services/apiService';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users, 
  Mail,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  RefreshCw,
  Activity
} from 'lucide-react';

interface KPIMetrics {
  tat: number;
  majorNeg: number;
  quality: number;
  neighbor: number;
  negativity: number;
  casesOnApp: number;
  insuff: number;
  overallScore: number;
}

interface RuleEngineResult {
  rating: string;
  training: string[];
  audits: string[];
  warnings: string[];
  emailRecipients: string[];
  color: string;
}

export const KPITriggers: React.FC = () => {
  const [input, setInput] = useState<KPIMetrics>({
    tat: 95,
    majorNeg: 0,
    quality: 0,
    neighbor: 90,
    negativity: 10,
    casesOnApp: 85,
    insuff: 0.5,
    overallScore: 72,
  });

  const [result, setResult] = useState<RuleEngineResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('entry');
  
  // Real Activity KPI states
  const [isGeneratingKPI, setIsGeneratingKPI] = useState(false);
  const [kpiGenerationResult, setKpiGenerationResult] = useState<any>(null);

  // Real Activity KPI handlers
  const handleGenerateAllUsersKPI = async () => {
    setIsGeneratingKPI(true);
    setKpiGenerationResult(null);
    
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const response = await apiService.kpi.generateRealActivityKPI(currentPeriod);
      
      if (response.success) {
        setKpiGenerationResult(response.data);
        alert('KPI generated successfully for all users!');
      } else {
        alert('Error generating KPI: ' + response.message);
      }
    } catch (error) {
      console.error('Error generating KPI:', error);
      alert('Error generating KPI. Please try again.');
    } finally {
      setIsGeneratingKPI(false);
    }
  };

  const handleGenerateCurrentMonthKPI = async () => {
    setIsGeneratingKPI(true);
    setKpiGenerationResult(null);
    
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const response = await apiService.kpi.generateRealActivityKPI(currentPeriod);
      
      if (response.success) {
        setKpiGenerationResult(response.data);
        alert('Current month KPI generated successfully!');
      } else {
        alert('Error generating KPI: ' + response.message);
      }
    } catch (error) {
      console.error('Error generating KPI:', error);
      alert('Error generating KPI. Please try again.');
    } finally {
      setIsGeneratingKPI(false);
    }
  };

  const runRuleEngine = () => {
    setIsCalculating(true);
    
    // Simulate processing time
    setTimeout(() => {
      let training: string[] = [];
      let audits: string[] = [];
      let warnings: string[] = [];
      let emailRecipients: string[] = [];
      let rating = '';
      let color = '';

      // ---- KPI SCORE BASED TRIGGERS ----
      if (input.overallScore >= 85) {
        rating = 'Outstanding';
        color = 'bg-green-100 text-green-800 border-green-200';
        emailRecipients = ['hr@company.com', 'manager@company.com'];
      } else if (input.overallScore >= 70) {
        rating = 'Excellent';
        color = 'bg-blue-100 text-blue-800 border-blue-200';
        audits.push('Audit Call');
        emailRecipients = ['manager@company.com'];
      } else if (input.overallScore >= 50) {
        rating = 'Satisfactory';
        color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        audits.push('Audit Call', 'Cross-check last 3 months data');
        emailRecipients = ['manager@company.com', 'audit@company.com'];
      } else if (input.overallScore >= 40) {
        rating = 'Need Improvement';
        color = 'bg-orange-100 text-orange-800 border-orange-200';
        training.push('Basic Training Module');
        audits.push('Audit Call', 'Cross-check last 3 months data', 'Dummy Audit Case');
        emailRecipients = ['manager@company.com', 'audit@company.com', 'training@company.com'];
      } else {
        rating = 'Unsatisfactory';
        color = 'bg-red-100 text-red-800 border-red-200';
        training.push('Basic Training Module');
        audits.push('Audit Call', 'Cross-check last 3 months data', 'Dummy Audit Case');
        warnings.push('Automatic Warning Letter');
        emailRecipients = ['hr@company.com', 'manager@company.com', 'audit@company.com', 'training@company.com'];
      }

      // ---- CONDITION BASED TRIGGERS ----
      if (input.overallScore < 55) {
        if (!training.includes('Basic Training Module')) {
          training.push('Basic Training Module');
        }
        if (!audits.includes('Audit Call')) {
          audits.push('Audit Call', 'Cross-check last 3 months data', 'Dummy Audit Case');
        }
      }
      
      if (input.overallScore < 40) {
        if (!warnings.includes('Automatic Warning Letter')) {
          warnings.push('Automatic Warning Letter');
        }
      }
      
      if (input.majorNeg > 0 && input.negativity < 25) {
        training.push('Negativity Handling Training');
        if (!audits.includes('Audit Call')) {
          audits.push('Audit Call', 'Cross-check last 3 months data');
        }
      }
      
      if (input.quality > 1) {
        training.push('Do\'s & Don\'ts Training');
        if (!audits.includes('Audit Call')) {
          audits.push('Audit Call', 'Cross-check last 3 months', 'RCA of complaints');
        }
      }
      
      if (input.casesOnApp < 80) {
        training.push('Application Usage Training');
      }
      
      if (input.insuff > 2) {
        audits.push('Cross Verification of insuff cases by another FE');
      }

      // Remove duplicates
      training = [...new Set(training)];
      audits = [...new Set(audits)];
      warnings = [...new Set(warnings)];
      emailRecipients = [...new Set(emailRecipients)];

      setResult({
        rating,
        training,
        audits,
        warnings,
        emailRecipients,
        color
      });
      
      setIsCalculating(false);
    }, 1000);
  };

  const handleInputChange = (field: keyof KPIMetrics, value: string) => {
    setInput(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return <Award className="w-4 h-4" />;
    if (score >= 70) return <TrendingUp className="w-4 h-4" />;
    if (score >= 50) return <Target className="w-4 h-4" />;
    if (score >= 40) return <AlertCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const handleKPISuccess = (result: any) => {
    console.log('KPI submitted successfully:', result);
    // You can add success handling here, like showing a notification
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">KPI Management & Automation</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete KPI entry, automation, and trigger management</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entry" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            KPI Entry
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Rule Simulator
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-6">
          <KPIEntryForm onSuccess={handleKPISuccess} />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            KPI Metrics Input
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tat">TAT %</Label>
                <Input
                  id="tat"
                  type="number"
                  value={input.tat}
                  onChange={(e) => handleInputChange('tat', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="majorNeg">Major Negativity %</Label>
                <Input
                  id="majorNeg"
                  type="number"
                  value={input.majorNeg}
                  onChange={(e) => handleInputChange('majorNeg', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quality">Quality Concern %</Label>
                <Input
                  id="quality"
                  type="number"
                  value={input.quality}
                  onChange={(e) => handleInputChange('quality', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="neighbor">Neighbor Check %</Label>
                <Input
                  id="neighbor"
                  type="number"
                  value={input.neighbor}
                  onChange={(e) => handleInputChange('neighbor', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="negativity">General Negativity %</Label>
                <Input
                  id="negativity"
                  type="number"
                  value={input.negativity}
                  onChange={(e) => handleInputChange('negativity', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="casesOnApp">Cases on App %</Label>
                <Input
                  id="casesOnApp"
                  type="number"
                  value={input.casesOnApp}
                  onChange={(e) => handleInputChange('casesOnApp', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insuff">Insuff %</Label>
                <Input
                  id="insuff"
                  type="number"
                  step="0.1"
                  value={input.insuff}
                  onChange={(e) => handleInputChange('insuff', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="overallScore">Overall KPI Score</Label>
                <Input
                  id="overallScore"
                  type="number"
                  value={input.overallScore}
                  onChange={(e) => handleInputChange('overallScore', e.target.value)}
                  className={`mt-1 ${getScoreColor(input.overallScore)}`}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={runRuleEngine} 
            disabled={isCalculating}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Run Rule Engine
              </>
            )}
          </Button>
        </Card>

        {/* Results Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Rule Engine Results
          </h2>

          {result ? (
            <div className="space-y-4">
              {/* Rating */}
              <div className="text-center p-4 rounded-lg border-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getScoreIcon(input.overallScore)}
                  <span className="text-lg font-semibold">Performance Rating</span>
                </div>
                <Badge className={`text-lg px-4 py-2 ${result.color}`}>
                  {result.rating}
                </Badge>
              </div>

              {/* Training Modules */}
              {result.training.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Training Modules Required
                  </h3>
                  <div className="space-y-1">
                    {result.training.map((training, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{training}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audits */}
              {result.audits.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Audit Actions Required
                  </h3>
                  <div className="space-y-1">
                    {result.audits.map((audit, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{audit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warning Actions
                  </h3>
                  <div className="space-y-1">
                    {result.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm">{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Recipients */}
              <div>
                <h3 className="font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Notifications
                </h3>
                <div className="space-y-1">
                  {result.emailRecipients.map((email, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">{email}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Enter KPI metrics and click "Run Rule Engine" to see results</p>
            </div>
          )}
        </Card>
      </div>

      {/* Rule Engine Logic Display */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Rule Engine Logic
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-blue-600 mb-2">KPI Score Based Triggers</h3>
            <ul className="space-y-1 text-sm">
              <li>• Score ≥ 85: Outstanding (No actions)</li>
              <li>• Score ≥ 70: Excellent (Audit Call)</li>
              <li>• Score ≥ 50: Satisfactory (Audit + Cross-check)</li>
              <li>• Score ≥ 40: Need Improvement (Training + Audit + Cross-check + Dummy)</li>
              <li>• Score &lt; 40: Unsatisfactory (All actions + Warning)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-green-600 mb-2">Condition Based Triggers</h3>
            <ul className="space-y-1 text-sm">
              <li>• Major Negativity &gt; 0: Negativity Training</li>
              <li>• Quality Concern &gt; 1%: Do's & Don'ts Training</li>
              <li>• Cases on App &lt; 80%: App Usage Training</li>
              <li>• Insuff &gt; 2%: Cross Verification</li>
              <li>• Score &lt; 55: Basic Training + Audit</li>
            </ul>
          </div>
        </div>
      </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Real Activity KPI Management
            </h2>
            
            <div className="space-y-6">
              {/* Real Activity KPI Generation */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Generate Real Activity Based KPIs
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Generate KPI scores based on actual user activity data (video watching, quiz attempts, module completion)
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleGenerateAllUsersKPI}
                    disabled={isGeneratingKPI}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGeneratingKPI ? 'animate-spin' : ''}`} />
                    Generate for All Users
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleGenerateCurrentMonthKPI}
                    disabled={isGeneratingKPI}
                    className="flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Generate Current Month
                  </Button>
                </div>
                
                {kpiGenerationResult && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Generation Results:</h4>
                    <div className="text-sm text-green-700">
                      <p>Period: {kpiGenerationResult.period}</p>
                      <p>Total Users: {kpiGenerationResult.totalUsers}</p>
                      <p>Successful: {kpiGenerationResult.successful}</p>
                      <p>Failed: {kpiGenerationResult.failed}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* KPI Analytics */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  KPI Analytics & Insights
                </h3>
                
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>KPI analytics and insights will be available here</p>
                  <p className="text-sm mt-2">Track performance trends, automation statistics, and system health</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
