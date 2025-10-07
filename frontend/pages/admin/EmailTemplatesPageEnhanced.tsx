import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Eye, Send, BarChart3, Edit, Copy, Settings, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { apiService } from '../../services/apiService';
import { useToast } from '../../components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';

interface EmailTemplate {
  _id: string;
  name: string;
  type: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed?: string;
}

export const EmailTemplatesPageEnhanced: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ subject: string; content: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response: any = await apiService.emailTemplates.getAll();
      const templatesData = response?.data || response || [];
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      sonnerToast.error('Failed to fetch email templates');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      // Call the preview API with sample data
      const sampleData = getSampleData();
      const response: any = await apiService.emailTemplates.preview(template._id, sampleData);
      
      const previewData = response?.data || response;
      setPreviewContent(previewData);
      setSelectedTemplate(template);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error('Error previewing template:', error);
      sonnerToast.error('Failed to preview template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await apiService.emailTemplates.delete(templateId);
      setTemplates(prev => prev.filter(t => t._id !== templateId));
      sonnerToast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      sonnerToast.error('Failed to delete template');
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setIsEditModalOpen(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      setIsUpdating(true);
      const response = await apiService.emailTemplates.update(editingTemplate._id, editingTemplate);
      
      if (response && (response as any).success) {
        setTemplates(prev => prev.map(t => 
          t._id === editingTemplate._id ? editingTemplate : t
        ));
        setIsEditModalOpen(false);
        setEditingTemplate(null);
        sonnerToast.success('Template updated successfully');
        await fetchTemplates(); // Refresh
      }
    } catch (error) {
      console.error('Error updating template:', error);
      sonnerToast.error('Failed to update template');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const duplicateTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        _id: undefined
      };
      
      const response = await apiService.emailTemplates.create(duplicateTemplate);
      
      if (response && (response as any).success) {
        await fetchTemplates();
        sonnerToast.success('Template duplicated successfully');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      sonnerToast.error('Failed to duplicate template');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      kpi: 'bg-blue-500 text-white',
      training: 'bg-green-500 text-white',
      audit: 'bg-orange-500 text-white',
      warning: 'bg-red-500 text-white',
      general: 'bg-gray-500 text-white',
      achievement: 'bg-purple-500 text-white',
    };
    return colors[category] || colors.general;
  };

  // Sample data for preview
  const getSampleData = () => ({
    userName: 'John Doe',
    employeeId: 'EMP001',
    email: 'john.doe@company.com',
    kpiScore: '85.50',
    rating: 'Excellent',
    period: 'Oct-2025',
    tatPercentage: '92.50',
    majorNegPercentage: '2.30',
    qualityPercentage: '0.45',
    neighborCheckPercentage: '88.00',
    generalNegPercentage: '18.00',
    onlinePercentage: '85.00',
    insuffPercentage: '1.20',
    trainingType: 'Basic Training Module',
    trainingReason: 'Performance improvement required',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    trainingDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    priority: 'High',
    auditType: 'Audit Call + Cross-check',
    auditScope: 'Last 3 months performance review',
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    preAuditDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    auditDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    performanceConcerns: 'Low TAT, Quality issues, Insufficiency rate above target',
    improvementAreas: 'TAT Management, Quality Control, Documentation'
  });

  // Function to get sample value for a variable
  const getSampleValue = (variable: string) => {
    const sampleData = getSampleData();
    return sampleData[variable as keyof typeof sampleData] || `Sample ${variable}`;
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesFilter = activeFilter === 'all' || template.category === activeFilter;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  const categories = ['all', 'kpi', 'training', 'audit', 'warning', 'general', 'achievement'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Mail className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Email Templates
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                    Manage automated email templates for KPI triggers, training & audits
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="bg-white dark:bg-gray-800 border-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  SMTP Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Templates</p>
                  <p className="text-4xl font-bold">{templates.length}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Mail className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Active Templates</p>
                  <p className="text-4xl font-bold">{templates.filter(t => t.isActive).length}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Total Sent</p>
                  <p className="text-4xl font-bold">
                    {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Send className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Categories</p>
                  <p className="text-4xl font-bold">
                    {Object.keys(groupedTemplates).length}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800 shadow-lg border-0">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={activeFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(cat)}
                  className={activeFilter === cat ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
            <div className="w-full md:w-80">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="p-12 bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <AlertCircle className="w-20 h-20 mb-4 text-gray-300" />
              <h3 className="text-2xl font-semibold mb-2">No templates found</h3>
              <p className="text-sm mb-4">Try adjusting your search or filters</p>
            </div>
          </Card>
        ) : (
          Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`${getCategoryColor(category)} px-4 py-2 text-sm font-bold`}>
                  {category.toUpperCase()}
                </Badge>
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTemplates.map((template) => (
                  <Card 
                    key={template._id} 
                    className="group relative overflow-hidden bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      {template.isActive ? (
                        <Badge className="bg-green-500 text-white shadow-lg">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Template Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {template.subject}
                          </p>
                        </div>
                      </div>

                      {/* Variables */}
                      <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                        {template.variables.slice(0, 3).map((variable) => (
                          <Badge 
                            key={variable} 
                            variant="outline" 
                            className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          >
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          >
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          <span className="font-semibold">{template.usageCount}</span>
                          <span>uses</span>
                        </div>
                        {template.lastUsed && (
                          <span className="text-xs">
                            {new Date(template.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>

                      {/* Secondary Actions */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => handleDelete(template._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Preview Modal */}
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="p-0">
            <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-3xl font-bold flex items-center gap-4 text-gray-900 dark:text-white">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    {selectedTemplate?.name}
                  </DialogTitle>
                  <DialogDescription className="mt-2 flex items-center gap-2">
                    <Badge className={getCategoryColor(selectedTemplate?.category || '')}>
                      {selectedTemplate?.category}
                    </Badge>
                    <span>•</span>
                    <span>Email Preview</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 py-6 px-2">
              {previewContent && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Subject */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <Label className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 block">
                      Subject Line
                    </Label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {previewContent.subject}
                    </p>
                  </div>

                  {/* Email Content */}
                  <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-8">
                      <div 
                        className="prose prose-lg max-w-none dark:prose-invert
                                  prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-bold prose-headings:mb-4
                                  prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:text-base prose-p:leading-relaxed prose-p:mb-4
                                  prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
                                  prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-li:my-2 prose-li:leading-relaxed
                                  prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-li:my-2 prose-li:leading-relaxed
                                  prose-table:text-gray-700 dark:prose-table:text-gray-300 prose-th:bg-gray-100 dark:prose-th:bg-gray-800
                                  prose-td:border-gray-200 dark:prose-td:border-gray-700 prose-a:text-blue-600 dark:prose-a:text-blue-400"
                        style={{
                          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          lineHeight: '1.7',
                          fontSize: '16px'
                        }}
                        dangerouslySetInnerHTML={{ __html: previewContent.content }}
                      />
                    </div>
                  </div>
                </div>

                {/* Template Variables with Sample Values */}
                {selectedTemplate && selectedTemplate.variables.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                    <Label className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4 block">
                      Template Variables ({selectedTemplate.variables.length})
                    </Label>
                    <div className="space-y-3">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600 font-mono text-xs"
                            >
                              {`{{${variable}}}`}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">→</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {getSampleValue(variable)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> These are sample values used for preview. Actual emails will use real data from the system.
                      </p>
                    </div>
                  </div>
                )}
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
                Close
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="w-4 h-4 mr-2" />
                Send Test Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="p-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit Email Template</DialogTitle>
              <DialogDescription>
                Customize the email template content and settings
              </DialogDescription>
            </DialogHeader>
            
            {editingTemplate && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editName" className="text-sm font-semibold mb-2 block">
                      Template Name
                    </Label>
                    <Input
                      id="editName"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCategory" className="text-sm font-semibold mb-2 block">
                      Category
                    </Label>
                    <select
                      id="editCategory"
                      value={editingTemplate.category}
                      onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, category: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kpi">KPI</option>
                      <option value="training">Training</option>
                      <option value="audit">Audit</option>
                      <option value="warning">Warning</option>
                      <option value="general">General</option>
                      <option value="achievement">Achievement</option>
                    </select>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <input
                    id="editActive"
                    type="checkbox"
                    checked={editingTemplate.isActive}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="editActive" className="text-sm font-semibold cursor-pointer">
                    Template is active and can be used
                  </Label>
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="editSubject" className="text-sm font-semibold mb-2 block">
                    Email Subject
                  </Label>
                  <Input
                    id="editSubject"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                    className="w-full"
                    placeholder="Enter email subject..."
                  />
                </div>

                {/* Variables */}
                <div>
                  <Label htmlFor="editVariables" className="text-sm font-semibold mb-2 block">
                    Template Variables (comma-separated)
                  </Label>
                  <Input
                    id="editVariables"
                    value={editingTemplate.variables.join(', ')}
                    onChange={(e) => setEditingTemplate(prev => prev ? { 
                      ...prev, 
                      variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
                    } : null)}
                    className="w-full"
                    placeholder="userName, employeeId, kpiScore..."
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Use these variables in content with double braces: {`{{userName}}`}
                  </p>
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="editContent" className="text-sm font-semibold mb-2 block">
                    Email Content (HTML Supported)
                  </Label>
                  <textarea
                    id="editContent"
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Enter HTML content..."
                  />
                </div>

                {/* Live Preview */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Live Preview
                  </Label>
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 max-h-80 overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: editingTemplate.content }}
                      className="prose prose-sm max-w-none dark:prose-invert"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="border-t pt-4 mt-6">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTemplate}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Update Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

