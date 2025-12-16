import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Settings,
  Save,
  RotateCcw,
  BarChart3,
  Target,
  Mail,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';
import { ConfirmationDialog } from '../../components/ui/confirmation-dialog';

interface KPIConfig {
  _id?: string;
  metric: string;
  weightage: number;
  thresholds: Array<{
    operator: string;
    value: number;
    score: number;
    label: string;
  }>;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

interface TriggerConfig {
  _id?: string;
  triggerType: string;
  condition: string;
  threshold: number;
  actions: string[];
  emailRecipients: string[];
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

interface EmailTemplateConfig {
  _id?: string;
  templateType: string;
  subject: string;
  isActive: boolean;
  defaultRecipients: string[];
  updatedAt?: string;
}

export const KPIConfigurationPage: React.FC = () => {
  const [kpiConfigs, setKpiConfigs] = useState<KPIConfig[]>([]);
  const [triggerConfigs, setTriggerConfigs] = useState<TriggerConfig[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('kpi-metrics');

  // Default KPI configurations
  const defaultKpiConfigs: KPIConfig[] = [
    {
      metric: 'TAT',
      weightage: 20,
      thresholds: [
        { operator: '>=', value: 95, score: 20, label: 'Excellent (95%+)' },
        { operator: '>=', value: 90, score: 10, label: 'Good (90-94%)' },
        { operator: '>=', value: 85, score: 5, label: 'Average (85-89%)' },
        { operator: '<', value: 85, score: 0, label: 'Poor (<85%)' }
      ],
      isActive: true
    },
    {
      metric: 'Major Negativity',
      weightage: 20,
      thresholds: [
        { operator: '>=', value: 2.5, score: 20, label: 'High (2.5%+)' },
        { operator: '>=', value: 2.0, score: 15, label: 'Medium (2.0-2.4%)' },
        { operator: '>=', value: 1.5, score: 5, label: 'Low (1.5-1.9%)' },
        { operator: '<', value: 1.5, score: 0, label: 'Excellent (<1.5%)' }
      ],
      isActive: true
    },
    {
      metric: 'Quality Concern',
      weightage: 20,
      thresholds: [
        { operator: '==', value: 0, score: 20, label: 'Perfect (0%)' },
        { operator: '<=', value: 0.25, score: 15, label: 'Good (0-0.25%)' },
        { operator: '<=', value: 0.5, score: 10, label: 'Average (0.26-0.5%)' },
        { operator: '>', value: 0.5, score: 0, label: 'Poor (>0.5%)' }
      ],
      isActive: true
    },
    {
      metric: 'Neighbor Check',
      weightage: 10,
      thresholds: [
        { operator: '>=', value: 90, score: 10, label: 'Excellent (90%+)' },
        { operator: '>=', value: 85, score: 5, label: 'Good (85-89%)' },
        { operator: '>=', value: 80, score: 2, label: 'Average (80-84%)' },
        { operator: '<', value: 80, score: 0, label: 'Poor (<80%)' }
      ],
      isActive: true
    },
    {
      metric: 'Negativity',
      weightage: 10,
      thresholds: [
        { operator: '>=', value: 25, score: 10, label: 'High (25%+)' },
        { operator: '>=', value: 20, score: 5, label: 'Medium (20-24%)' },
        { operator: '>=', value: 15, score: 2, label: 'Low (15-19%)' },
        { operator: '<', value: 15, score: 0, label: 'Excellent (<15%)' }
      ],
      isActive: true
    },
    {
      metric: 'App Usage',
      weightage: 10,
      thresholds: [
        { operator: '>=', value: 90, score: 10, label: 'Excellent (90%+)' },
        { operator: '>=', value: 85, score: 5, label: 'Good (85-89%)' },
        { operator: '>=', value: 80, score: 2, label: 'Average (80-84%)' },
        { operator: '<', value: 80, score: 0, label: 'Poor (<80%)' }
      ],
      isActive: true
    },
    {
      metric: 'Insufficiency',
      weightage: 10,
      thresholds: [
        { operator: '<', value: 1, score: 10, label: 'Excellent (<1%)' },
        { operator: '<=', value: 1.5, score: 5, label: 'Good (1-1.5%)' },
        { operator: '<=', value: 2, score: 2, label: 'Average (1.6-2%)' },
        { operator: '>', value: 2, score: 0, label: 'Poor (>2%)' }
      ],
      isActive: true
    }
  ];

  // Default trigger configurations
  const defaultTriggerConfigs: TriggerConfig[] = [
    {
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 85,
      actions: ['None'],
      emailRecipients: ['FE', 'Manager', 'HOD'],
      isActive: true
    },
    {
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 70,
      actions: ['Audit Call'],
      emailRecipients: ['Compliance Team', 'HOD'],
      isActive: true
    },
    {
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 50,
      actions: ['Audit Call', 'Cross-check last 3 months data'],
      emailRecipients: ['Compliance Team', 'HOD'],
      isActive: true
    },
    {
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 40,
      actions: ['Basic Training Module', 'Audit Call', 'Cross-check last 3 months data', 'Dummy Audit Case'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'HOD', 'Compliance Team'],
      isActive: true
    },
    {
      triggerType: 'score_based',
      condition: 'Overall KPI Score',
      threshold: 0,
      actions: ['Basic Training Module', 'Audit Call', 'Cross-check last 3 months data', 'Dummy Audit Case', 'Warning Letter'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'HOD', 'Compliance Team'],
      isActive: true
    },
    {
      triggerType: 'condition_based',
      condition: 'Major Negativity > 0% AND General Negativity < 25%',
      threshold: 0,
      actions: ['Negativity Handling Training Module', 'Audit Call'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
      isActive: true
    },
    {
      triggerType: 'condition_based',
      condition: 'Quality Concern > 1%',
      threshold: 1,
      actions: ['Do\'s & Don\'ts Training Module', 'Audit Call', 'RCA of complaints'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
      isActive: true
    },
    {
      triggerType: 'condition_based',
      condition: 'Cases Done on App < 80%',
      threshold: 80,
      actions: ['Application Usage Training'],
      emailRecipients: ['FE', 'Coordinator', 'Manager', 'Compliance Team', 'HOD'],
      isActive: true
    },
    {
      triggerType: 'condition_based',
      condition: 'Insufficiency > 2%',
      threshold: 2,
      actions: ['Cross-verification of selected insuff cases by another FE'],
      emailRecipients: ['Compliance Team', 'HOD'],
      isActive: true
    }
  ];

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      // Load KPI configurations from API
      const configResponse = await apiService.kpiConfiguration.getAll();
      if (configResponse.data?.success) {
        setKpiConfigs(configResponse.data.data.metrics || defaultKpiConfigs);
        setTriggerConfigs(configResponse.data.data.triggers || defaultTriggerConfigs);
      } else {
        // Fallback to defaults if API fails
        setKpiConfigs(defaultKpiConfigs);
        setTriggerConfigs(defaultTriggerConfigs);
      }

      // Load email templates
      const templatesResponse = await apiService.emailTemplates.getAll();
      setEmailTemplates(templatesResponse.data || []);

      toast.success('Configurations loaded successfully');
    } catch (error) {
      console.error('Error loading configurations:', error);
      // Use defaults on error
      setKpiConfigs(defaultKpiConfigs);
      setTriggerConfigs(defaultTriggerConfigs);
      toast.error('Failed to load configurations, using defaults');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKpiConfigChange = (index: number, field: string, value: any) => {
    const updated = [...kpiConfigs];
    if (field === 'weightage') {
      updated[index].weightage = Number(value);
    } else if (field === 'isActive') {
      updated[index].isActive = value;
    } else if (field.startsWith('threshold_')) {
      const thresholdIndex = parseInt(field.split('_')[1]);
      const thresholdField = field.split('_')[2];
      if (thresholdField === 'value') {
        updated[index].thresholds[thresholdIndex].value = Number(value);
      } else if (thresholdField === 'score') {
        updated[index].thresholds[thresholdIndex].score = Number(value);
      }
    }
    setKpiConfigs(updated);
  };

  const handleTriggerConfigChange = (index: number, field: string, value: any) => {
    const updated = [...triggerConfigs];
    if (field === 'threshold') {
      updated[index].threshold = Number(value);
    } else if (field === 'isActive') {
      updated[index].isActive = value;
    } else if (field === 'actions') {
      updated[index].actions = value;
    } else if (field === 'emailRecipients') {
      updated[index].emailRecipients = value;
    }
    setTriggerConfigs(updated);
  };

  const saveConfigurations = async () => {
    setIsSaving(true);
    try {
      // Save KPI metrics configuration
      await apiService.kpiConfiguration.updateMetrics(kpiConfigs);

      // Save trigger configuration
      await apiService.kpiConfiguration.updateTriggers(triggerConfigs);

      toast.success('KPI configurations saved successfully!');

    } catch (error) {
      console.error('Error saving configurations:', error);
      toast.error('Failed to save configurations');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      // Call API to reset configurations
      await apiService.kpiConfiguration.resetToDefaults();

      // Update local state
      setKpiConfigs(defaultKpiConfigs);
      setTriggerConfigs(defaultTriggerConfigs);
      setShowResetDialog(false);

      toast.success('Configurations reset to defaults');
    } catch (error) {
      console.error('Error resetting configurations:', error);
      toast.error('Failed to reset configurations');
    }
  };

  const getRatingColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading KPI configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-600" />
                KPI Configuration Control Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manually adjust KPI metrics, trigger thresholds, and email configurations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </Button>
              <Button
                onClick={() => setShowSaveDialog(true)}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kpi-metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              KPI Metrics
            </TabsTrigger>
            <TabsTrigger value="triggers" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Trigger Rules
            </TabsTrigger>
            <TabsTrigger value="email-templates" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Templates
            </TabsTrigger>
          </TabsList>

          {/* KPI Metrics Configuration */}
          <TabsContent value="kpi-metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  KPI Metrics & Scoring Configuration
                </CardTitle>
                <CardDescription>
                  Adjust weightages and scoring thresholds for each KPI metric
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {kpiConfigs.map((config, index) => (
                    <Card key={config.metric} className="border-2">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-lg px-3 py-1 border-gray-400 text-gray-800">
                              {config.metric}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`weightage-${index}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Weightage:
                              </Label>
                              <Input
                                id={`weightage-${index}`}
                                type="number"
                                value={config.weightage}
                                onChange={(e) => handleKpiConfigChange(index, 'weightage', e.target.value)}
                                className="w-20 h-8"
                                min="0"
                                max="100"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${index}`} className="text-sm text-gray-700 dark:text-gray-300">
                              Active:
                            </Label>
                            <input
                              id={`active-${index}`}
                              type="checkbox"
                              checked={config.isActive}
                              onChange={(e) => handleKpiConfigChange(index, 'isActive', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Condition</TableHead>
                              <TableHead>Threshold Value</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Rating</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {config.thresholds.map((threshold, thresholdIndex) => (
                              <TableRow key={thresholdIndex}>
                                <TableCell className="font-medium">
                                  {threshold.label}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={threshold.value}
                                    onChange={(e) => handleKpiConfigChange(index, `threshold_${thresholdIndex}_value`, e.target.value)}
                                    className="w-24 h-8"
                                    step="0.1"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={threshold.score}
                                    onChange={(e) => handleKpiConfigChange(index, `threshold_${thresholdIndex}_score`, e.target.value)}
                                    className="w-20 h-8"
                                    min="0"
                                    max="100"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRatingColor(threshold.score, config.weightage)}>
                                    {threshold.score}/{config.weightage}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trigger Rules Configuration */}
          <TabsContent value="triggers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Trigger Rules Configuration
                </CardTitle>
                <CardDescription>
                  Configure automatic triggers based on KPI scores and conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {triggerConfigs.map((config, index) => (
                    <Card key={index} className="border-2">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trigger Type</Label>
                            <Badge variant={config.triggerType === 'score_based' ? 'default' : 'secondary'} className={`mt-1 ${config.triggerType === 'score_based' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                              {config.triggerType === 'score_based' ? 'Score Based' : 'Condition Based'}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Condition</Label>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{config.condition}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Threshold</Label>
                            <Input
                              type="number"
                              value={config.threshold}
                              onChange={(e) => handleTriggerConfigChange(index, 'threshold', e.target.value)}
                              className="w-full h-8 mt-1"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</Label>
                            <input
                              type="checkbox"
                              checked={config.isActive}
                              onChange={(e) => handleTriggerConfigChange(index, 'isActive', e.target.checked)}
                              className="w-4 h-4 mt-2"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Actions</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {config.actions.map((action, actionIndex) => (
                              <Badge key={actionIndex} variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Recipients</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {config.emailRecipients.map((recipient, recipientIndex) => (
                              <Badge key={recipientIndex} variant="secondary" className="bg-purple-100 text-purple-700">
                                {recipient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Configuration */}
          <TabsContent value="email-templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Templates Configuration
                </CardTitle>
                <CardDescription>
                  Manage email templates and their default recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailTemplates.map((template) => (
                    <Card key={template._id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{template.templateType}</h4>
                            <p className="text-sm text-gray-600">{template.subject}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={template.isActive ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <div className="flex flex-wrap gap-1">
                              {template.defaultRecipients.map((recipient, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {recipient}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showResetDialog}
          onClose={() => setShowResetDialog(false)}
          onConfirm={resetToDefaults}
          title="Reset to Defaults"
          description="Are you sure you want to reset all KPI configurations to their default values? This action cannot be undone."
          type="warning"
          confirmText="Reset"
          cancelText="Cancel"
        />

        {/* Save Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onConfirm={() => {
            setShowSaveDialog(false);
            saveConfigurations();
          }}
          title="Save KPI Configuration Changes"
          description="Are you sure you want to update the KPI threshold values? This will affect how all future KPI scores are calculated. Please double-check the values before confirming."
          type="warning"
          confirmText="Yes, Save Changes"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
};
