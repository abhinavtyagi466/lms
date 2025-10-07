import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Eye, Send, BarChart3, Edit, Copy, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
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

export const EmailTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ subject: string; content: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  // NEW: Edit Template State (ADDED WITHOUT TOUCHING EXISTING)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
      toast({
        title: 'Error',
        description: 'Failed to fetch email templates',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: 'Failed to preview template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await apiService.emailTemplates.delete(templateId);
      setTemplates(prev => prev.filter(t => t._id !== templateId));
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  // NEW: Edit Template Functions (ADDED WITHOUT TOUCHING EXISTING)
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
        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
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
        await fetchTemplates(); // Refresh the list
        toast({
          title: 'Success',
          description: 'Template duplicated successfully',
        });
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      kpi: 'bg-blue-100 text-blue-800',
      training: 'bg-green-100 text-green-800',
      audit: 'bg-orange-100 text-orange-800',
      warning: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800',
      achievement: 'bg-purple-100 text-purple-800',
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

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-7 h-7 text-white" />
              </div>
              Email Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-3 ml-1">
              Manage and preview automated email templates for KPI triggers, training assignments, and audit notifications
            </p>
          </div>
          {/* TEMPORARILY HIDDEN: Create Template Button */}
          {/* <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button> */}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Templates</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{templates.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{templates.filter(t => t.isActive).length}</p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Usage</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {templates.reduce((sum, t) => sum + t.usageCount, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Send className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Categories</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                {Object.keys(groupedTemplates).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Templates by Category */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : Object.keys(groupedTemplates).length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Mail className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-sm mb-4">Email templates will be available soon</p>
            {/* TEMPORARILY HIDDEN: Create Template Button */}
            {/* <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button> */}
          </div>
        </Card>
      ) : (
        Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 capitalize flex items-center gap-2">
              <Badge className={getCategoryColor(category)}>{category}</Badge>
              <span className="text-sm text-gray-500">({categoryTemplates.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTemplates.map((template) => (
                <Card key={template._id} className="p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-blue-300 dark:hover:border-blue-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {template.subject}
                        </p>
                      </div>
                    </div>
                    {template.isActive ? (
                      <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
                    {template.variables.slice(0, 3).map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                        +{template.variables.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      <span className="font-medium">{template.usageCount} uses</span>
                    </div>
                    {template.lastUsed && (
                      <span className="text-xs">
                        {new Date(template.lastUsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Preview
                    </Button>
                    {/* NEW: Edit Button (ADDED WITHOUT TOUCHING EXISTING) */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    {/* NEW: Duplicate Button (ADDED WITHOUT TOUCHING EXISTING) */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => handleDelete(template._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Preview Modal - Professionally Centered */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="p-0">
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <DialogTitle className="text-3xl font-bold flex items-center gap-4 text-gray-900 dark:text-white">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription className="mt-4 flex items-center gap-3 text-lg">
              <Badge className={getCategoryColor(selectedTemplate?.category || '')} variant="secondary">
                {selectedTemplate?.category}
              </Badge>
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Email Preview</span>
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-8 py-8 bg-gray-50/50 dark:bg-gray-900/50">
            {previewContent && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Email Subject */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Label className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 block">
                    Subject
                  </Label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {previewContent.subject}
                  </p>
                </div>

                {/* Email Content */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div 
                      className="prose max-w-none dark:prose-invert prose-sm
                                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                                prose-strong:text-gray-900 dark:prose-strong:text-white
                                prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                                prose-table:text-sm"
                      dangerouslySetInnerHTML={{ __html: previewContent.content }}
                    />
                  </div>
                </div>

                {/* Template Variables */}
                {selectedTemplate && selectedTemplate.variables.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Label className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-3 block">
                      Variables ({selectedTemplate.variables.length})
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
                          <code className="text-xs text-purple-700 dark:text-purple-300 font-mono">
                            {`{{${variable}}}`}
                          </code>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {getSampleValue(variable)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
            <div className="flex gap-4 w-full justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-8 py-3 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </Button>
              <Button 
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={async () => {
                  try {
                    const testEmail = prompt('Enter test email address:');
                    if (!testEmail) return;
                    
                    if (!testEmail.includes('@')) {
                      toast({
                        title: 'Invalid Email',
                        description: 'Please enter a valid email address',
                        variant: 'destructive',
                      });
                      return;
                    }

                    await apiService.emailTemplates.sendTest(selectedTemplate?._id || '', testEmail);
                    
                    toast({
                      title: 'Test Email Sent!',
                      description: `Test email sent to ${testEmail}. Check your inbox.`,
                    });
                  } catch (error) {
                    console.error('Error sending test email:', error);
                    toast({
                      title: 'Error',
                      description: 'Failed to send test email. Please check SMTP configuration.',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <Send className="w-5 h-5 mr-2" />
                Send Test Email
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for automated notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Template creation form coming soon!</p>
            <p className="text-sm mt-2">For now, templates are seeded from the backend.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Edit className="w-6 h-6 text-green-600" />
              Edit Email Template
            </DialogTitle>
            <DialogDescription className="mt-2">
              Customize the email template content and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 px-6 py-6">
          {editingTemplate && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName">Template Name</Label>
                  <input
                    id="editName"
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="editType">Template Type</Label>
                  <input
                    id="editType"
                    type="text"
                    value={editingTemplate.type}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, type: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCategory">Category</Label>
                  <select
                    id="editCategory"
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="kpi">KPI</option>
                    <option value="training">Training</option>
                    <option value="audit">Audit</option>
                    <option value="warning">Warning</option>
                    <option value="general">General</option>
                    <option value="achievement">Achievement</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="editActive"
                    type="checkbox"
                    checked={editingTemplate.isActive}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="editActive">Active</Label>
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="editSubject">Email Subject</Label>
                <input
                  id="editSubject"
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject..."
                />
              </div>

              {/* Variables */}
              <div>
                <Label htmlFor="editVariables">Variables (comma-separated)</Label>
                <input
                  id="editVariables"
                  type="text"
                  value={editingTemplate.variables.join(', ')}
                  onChange={(e) => setEditingTemplate(prev => prev ? { 
                    ...prev, 
                    variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="userName, employeeId, kpiScore..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use these variables in your content with double curly braces: {`{{userName}}`}
                </p>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="editContent">Email Content (HTML)</Label>
                <textarea
                  id="editContent"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter HTML content..."
                />
              </div>

              {/* Preview */}
              <div>
                <Label>Preview</Label>
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50 max-h-64 overflow-y-auto">
                  <div 
                    dangerouslySetInnerHTML={{ __html: editingTemplate.content }}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTemplate}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

