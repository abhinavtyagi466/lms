import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
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
  Save,
  Send,
  RotateCcw,
  User,
  Calendar,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiService } from '../services/apiService';

interface KPIMetrics {
  tat: number;
  majorNegativity: number;
  quality: number;
  neighborCheck: number;
  negativity: number;
  appUsage: number;
  insufficiency: number;
}

interface KPITriggers {
  training: {
    basic: boolean;
    negativity_handling: boolean;
    dos_donts: boolean;
    app_usage: boolean;
  };
  audit: {
    audit_call: boolean;
    cross_check: boolean;
    dummy_audit: boolean;
    cross_verify_insuff: boolean;
  };
  email: {
    kpi_notification: boolean;
    training_assignment: boolean;
    audit_notification: boolean;
    warning_letter: boolean;
  };
}

interface EmailRecipients {
  fe: boolean;
  coordinator: boolean;
  manager: boolean;
  hod: boolean;
  compliance: boolean;
}

interface KPIFormData {
  userId: string;
  period: string;
  comments: string;
  metrics: KPIMetrics;
  emailRecipients: EmailRecipients;
}

interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  department?: string;
}

interface KPIEntryFormProps {
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
  initialData?: Partial<KPIFormData>;
  mode?: 'create' | 'edit' | 'bulk';
}

export const KPIEntryForm: React.FC<KPIEntryFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<KPIFormData>({
    userId: '',
    period: '',
    comments: '',
    metrics: {
      tat: 0,
      majorNegativity: 0,
      quality: 0,
      neighborCheck: 0,
      negativity: 0,
      appUsage: 0,
      insufficiency: 0
    },
    emailRecipients: {
      fe: true,
      coordinator: true,
      manager: true,
      hod: false,
      compliance: false
    }
  });

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [rating, setRating] = useState<string>('');
  const [triggers, setTriggers] = useState<KPITriggers>({
    training: {
      basic: false,
      negativity_handling: false,
      dos_donts: false,
      app_usage: false
    },
    audit: {
      audit_call: false,
      cross_check: false,
      dummy_audit: false,
      cross_verify_insuff: false
    },
    email: {
      kpi_notification: true,
      training_assignment: false,
      audit_notification: false,
      warning_letter: false
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Calculate overall score and triggers when metrics change
  useEffect(() => {
    calculateScoreAndTriggers();
  }, [formData.metrics]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.users.getAllUsers({ limit: 1000 });
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateScoreAndTriggers = () => {
    const { metrics } = formData;
    
    // Calculate overall score (weighted average)
    const weights = {
      tat: 0.25,
      quality: 0.20,
      appUsage: 0.20,
      neighborCheck: 0.15,
      negativity: 0.10,
      majorNegativity: 0.05,
      insufficiency: 0.05
    };

    const overallScore = Math.round(
      (metrics.tat * weights.tat) +
      (metrics.quality * weights.quality) +
      (metrics.appUsage * weights.appUsage) +
      (metrics.neighborCheck * weights.neighborCheck) +
      ((100 - metrics.negativity) * weights.negativity) +
      ((10 - metrics.majorNegativity) * 10 * weights.majorNegativity) +
      ((10 - metrics.insufficiency) * 10 * weights.insufficiency)
    );

    setOverallScore(overallScore);

    // Determine rating
    let rating = '';
    if (overallScore >= 85) rating = 'Outstanding';
    else if (overallScore >= 70) rating = 'Excellent';
    else if (overallScore >= 50) rating = 'Satisfactory';
    else if (overallScore >= 40) rating = 'Need Improvement';
    else rating = 'Unsatisfactory';

    setRating(rating);

    // Calculate triggers
    const newTriggers: KPITriggers = {
      training: {
        basic: overallScore < 55 || overallScore < 40,
        negativity_handling: metrics.majorNegativity > 0 && metrics.negativity < 25,
        dos_donts: metrics.quality > 1,
        app_usage: metrics.appUsage < 80
      },
      audit: {
        audit_call: overallScore < 70,
        cross_check: overallScore < 70,
        dummy_audit: overallScore < 50,
        cross_verify_insuff: metrics.insufficiency > 2
      },
      email: {
        kpi_notification: true,
        training_assignment: overallScore < 55 || metrics.majorNegativity > 0 || metrics.quality > 1 || metrics.appUsage < 80,
        audit_notification: overallScore < 70,
        warning_letter: overallScore < 40
      }
    };

    setTriggers(newTriggers);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'Please select a user';
    }

    if (!formData.period) {
      newErrors.period = 'Please select a period';
    } else if (!/^\d{4}-\d{2}$/.test(formData.period)) {
      newErrors.period = 'Period must be in YYYY-MM format';
    }

    // Validate metrics
    const metrics = formData.metrics;
    if (metrics.tat < 0 || metrics.tat > 100) {
      newErrors.tat = 'TAT must be between 0 and 100';
    }
    if (metrics.quality < 0 || metrics.quality > 100) {
      newErrors.quality = 'Quality must be between 0 and 100';
    }
    if (metrics.appUsage < 0 || metrics.appUsage > 100) {
      newErrors.appUsage = 'App Usage must be between 0 and 100';
    }
    if (metrics.neighborCheck < 0 || metrics.neighborCheck > 100) {
      newErrors.neighborCheck = 'Neighbor Check must be between 0 and 100';
    }
    if (metrics.negativity < 0 || metrics.negativity > 100) {
      newErrors.negativity = 'Negativity must be between 0 and 100';
    }
    if (metrics.majorNegativity < 0 || metrics.majorNegativity > 10) {
      newErrors.majorNegativity = 'Major Negativity must be between 0 and 10';
    }
    if (metrics.insufficiency < 0 || metrics.insufficiency > 10) {
      newErrors.insufficiency = 'Insufficiency must be between 0 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('metrics.')) {
      const metricField = field.split('.')[1] as keyof KPIMetrics;
      setFormData(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [metricField]: parseFloat(value) || 0
        }
      }));
    } else if (field.startsWith('emailRecipients.')) {
      const recipientField = field.split('.')[1] as keyof EmailRecipients;
      setFormData(prev => ({
        ...prev,
        emailRecipients: {
          ...prev.emailRecipients,
          [recipientField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u._id === userId);
    setSelectedUser(user || null);
    handleInputChange('userId', userId);
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const kpiData = {
        userId: formData.userId,
        period: formData.period,
        comments: formData.comments,
        tat: formData.metrics.tat,
        quality: formData.metrics.quality,
        appUsage: formData.metrics.appUsage,
        negativity: formData.metrics.negativity,
        majorNegativity: formData.metrics.majorNegativity,
        neighborCheck: formData.metrics.neighborCheck,
        generalNegativity: formData.metrics.negativity,
        insufficiency: formData.metrics.insufficiency
      };

      const response = await apiService.kpi.submitKPI(kpiData);
      
      if (onSuccess) {
        onSuccess(response);
      }

      // Show success message
      setDraftSaved(false);
      
    } catch (error: any) {
      console.error('Error submitting KPI:', error);
      setErrors({ submit: error.message || 'Failed to submit KPI' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const draftData = {
      ...formData,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('kpiDraft', JSON.stringify(draftData));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleLoadDraft = () => {
    const draftData = localStorage.getItem('kpiDraft');
    if (draftData) {
      const parsed = JSON.parse(draftData);
      setFormData(prev => ({ ...prev, ...parsed }));
    }
  };

  const handleReset = () => {
    setFormData({
      userId: '',
      period: '',
      comments: '',
      metrics: {
        tat: 0,
        majorNegativity: 0,
        quality: 0,
        neighborCheck: 0,
        negativity: 0,
        appUsage: 0,
        insufficiency: 0
      },
      emailRecipients: {
        fe: true,
        coordinator: true,
        manager: true,
        hod: false,
        compliance: false
      }
    });
    setSelectedUser(null);
    setErrors({});
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return <Award className="w-4 h-4" />;
    if (score >= 70) return <TrendingUp className="w-4 h-4" />;
    if (score >= 50) return <Target className="w-4 h-4" />;
    if (score >= 40) return <AlertCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const generatePeriodOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const period = `${year}-${month}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: period, label: monthName });
    }

    return options;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {mode === 'bulk' ? 'Bulk KPI Entry' : 'KPI Entry Form'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Submit KPI scores with automated trigger processing
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={draftSaved}
          >
            <Save className="w-4 h-4 mr-2" />
            {draftSaved ? 'Saved!' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              User Selection
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Select User *</Label>
                <Select
                  value={formData.userId}
                  onValueChange={handleUserSelect}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isLoading ? "Loading users..." : "Select a user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-gray-500">
                            {user.employeeId} • {user.department || 'No Department'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.userId && (
                  <p className="text-red-500 text-sm mt-1">{errors.userId}</p>
                )}
              </div>

              {selectedUser && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Selected User</h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    {selectedUser.name} ({selectedUser.employeeId})
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {selectedUser.email} • {selectedUser.department || 'No Department'}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="period">Period *</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => handleInputChange('period', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {generatePeriodOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.period && (
                  <p className="text-red-500 text-sm mt-1">{errors.period}</p>
                )}
              </div>
            </div>
          </Card>

          {/* KPI Metrics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              KPI Metrics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tat">TAT (Turn Around Time) %</Label>
                <Input
                  id="tat"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.metrics.tat}
                  onChange={(e) => handleInputChange('metrics.tat', e.target.value)}
                  className="mt-1"
                />
                {errors.tat && (
                  <p className="text-red-500 text-sm mt-1">{errors.tat}</p>
                )}
              </div>

              <div>
                <Label htmlFor="quality">Quality %</Label>
                <Input
                  id="quality"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.metrics.quality}
                  onChange={(e) => handleInputChange('metrics.quality', e.target.value)}
                  className="mt-1"
                />
                {errors.quality && (
                  <p className="text-red-500 text-sm mt-1">{errors.quality}</p>
                )}
              </div>

              <div>
                <Label htmlFor="appUsage">App Usage %</Label>
                <Input
                  id="appUsage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.metrics.appUsage}
                  onChange={(e) => handleInputChange('metrics.appUsage', e.target.value)}
                  className="mt-1"
                />
                {errors.appUsage && (
                  <p className="text-red-500 text-sm mt-1">{errors.appUsage}</p>
                )}
              </div>

              <div>
                <Label htmlFor="neighborCheck">Neighbor Check %</Label>
                <Input
                  id="neighborCheck"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.metrics.neighborCheck}
                  onChange={(e) => handleInputChange('metrics.neighborCheck', e.target.value)}
                  className="mt-1"
                />
                {errors.neighborCheck && (
                  <p className="text-red-500 text-sm mt-1">{errors.neighborCheck}</p>
                )}
              </div>

              <div>
                <Label htmlFor="negativity">General Negativity %</Label>
                <Input
                  id="negativity"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.metrics.negativity}
                  onChange={(e) => handleInputChange('metrics.negativity', e.target.value)}
                  className="mt-1"
                />
                {errors.negativity && (
                  <p className="text-red-500 text-sm mt-1">{errors.negativity}</p>
                )}
              </div>

              <div>
                <Label htmlFor="majorNegativity">Major Negativity Count</Label>
                <Input
                  id="majorNegativity"
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={formData.metrics.majorNegativity}
                  onChange={(e) => handleInputChange('metrics.majorNegativity', e.target.value)}
                  className="mt-1"
                />
                {errors.majorNegativity && (
                  <p className="text-red-500 text-sm mt-1">{errors.majorNegativity}</p>
                )}
              </div>

              <div>
                <Label htmlFor="insufficiency">Insufficiency Count</Label>
                <Input
                  id="insufficiency"
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={formData.metrics.insufficiency}
                  onChange={(e) => handleInputChange('metrics.insufficiency', e.target.value)}
                  className="mt-1"
                />
                {errors.insufficiency && (
                  <p className="text-red-500 text-sm mt-1">{errors.insufficiency}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Comments */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Comments
            </h2>
            
            <Textarea
              placeholder="Add any additional comments or notes about this KPI score..."
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              rows={4}
            />
          </Card>

          {/* Email Recipients */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Recipients
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fe"
                  checked={formData.emailRecipients.fe}
                  onCheckedChange={(checked) => handleInputChange('emailRecipients.fe', checked)}
                />
                <Label htmlFor="fe">Field Executive</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coordinator"
                  checked={formData.emailRecipients.coordinator}
                  onCheckedChange={(checked) => handleInputChange('emailRecipients.coordinator', checked)}
                />
                <Label htmlFor="coordinator">Coordinator</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manager"
                  checked={formData.emailRecipients.manager}
                  onCheckedChange={(checked) => handleInputChange('emailRecipients.manager', checked)}
                />
                <Label htmlFor="manager">Manager</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hod"
                  checked={formData.emailRecipients.hod}
                  onCheckedChange={(checked) => handleInputChange('emailRecipients.hod', checked)}
                />
                <Label htmlFor="hod">Head of Department</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="compliance"
                  checked={formData.emailRecipients.compliance}
                  onCheckedChange={(checked) => handleInputChange('emailRecipients.compliance', checked)}
                />
                <Label htmlFor="compliance">Compliance Team</Label>
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleLoadDraft}
                  disabled={isSubmitting}
                >
                  Load Draft
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
                
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit KPI
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {errors.submit && (
              <p className="text-red-500 text-sm mt-2">{errors.submit}</p>
            )}
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Overall Score
            </h2>
            
            <div className="text-center p-4 rounded-lg border-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getScoreIcon(overallScore)}
                <span className="text-lg font-semibold">Performance Rating</span>
              </div>
              <Badge className={`text-lg px-4 py-2 ${getScoreColor(overallScore)}`}>
                {rating}
              </Badge>
              <p className="text-2xl font-bold mt-2">{overallScore}%</p>
            </div>
          </Card>

          {/* Trigger Preview */}
          {showPreview && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Trigger Preview
              </h2>
              
              <div className="space-y-4">
                {/* Training Triggers */}
                {Object.values(triggers.training).some(Boolean) && (
                  <div>
                    <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Training Required
                    </h3>
                    <div className="space-y-1">
                      {triggers.training.basic && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Basic Training Module</span>
                        </div>
                      )}
                      {triggers.training.negativity_handling && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Negativity Handling Training</span>
                        </div>
                      )}
                      {triggers.training.dos_donts && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Do's & Don'ts Training</span>
                        </div>
                      )}
                      {triggers.training.app_usage && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Application Usage Training</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit Triggers */}
                {Object.values(triggers.audit).some(Boolean) && (
                  <div>
                    <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Audit Required
                    </h3>
                    <div className="space-y-1">
                      {triggers.audit.audit_call && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Audit Call</span>
                        </div>
                      )}
                      {triggers.audit.cross_check && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Cross-check last 3 months</span>
                        </div>
                      )}
                      {triggers.audit.dummy_audit && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Dummy Audit Case</span>
                        </div>
                      )}
                      {triggers.audit.cross_verify_insuff && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Cross-verification of insuff cases</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Email Triggers */}
                {Object.values(triggers.email).some(Boolean) && (
                  <div>
                    <h3 className="font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Notifications
                    </h3>
                    <div className="space-y-1">
                      {triggers.email.kpi_notification && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                          <Mail className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">KPI Score Notification</span>
                        </div>
                      )}
                      {triggers.email.training_assignment && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                          <Mail className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">Training Assignment</span>
                        </div>
                      )}
                      {triggers.email.audit_notification && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                          <Mail className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">Audit Notification</span>
                        </div>
                      )}
                      {triggers.email.warning_letter && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                          <Mail className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">Warning Letter</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
