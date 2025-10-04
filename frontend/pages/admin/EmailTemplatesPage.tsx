import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Eye, Send, BarChart3 } from 'lucide-react';
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
      const response: any = await apiService.emailTemplates.preview(template._id);
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
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
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
            <p className="text-sm mb-4">Create your first email template to get started</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
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

      {/* Preview Modal - Enhanced & Centered */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Mail className="w-7 h-7 text-blue-600" />
                  {selectedTemplate?.name}
                </DialogTitle>
                <DialogDescription className="mt-2 flex items-center gap-2">
                  <Badge className={getCategoryColor(selectedTemplate?.category || '')}>
                    {selectedTemplate?.category}
                  </Badge>
                  <span>•</span>
                  <span>Preview with sample data</span>
                </DialogDescription>
              </div>
              {selectedTemplate && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Used {selectedTemplate.usageCount} times</p>
                  {selectedTemplate.isActive ? (
                    <Badge variant="default" className="text-xs mt-1">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs mt-1">Inactive</Badge>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-6 px-2">
            {previewContent && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Email Subject Preview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <Label className="text-base font-bold text-blue-900 dark:text-blue-100">Subject Line</Label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white pl-13">
                    {previewContent.subject}
                  </p>
                </div>

                {/* Email Content Preview - Centered & Larger */}
                <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                  {/* Email Header Mockup */}
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-5 border-b-2 border-gray-300 dark:border-gray-600">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <Mail className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 dark:text-white">E-Learning Platform</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">noreply@company.com</p>
                      </div>
                    </div>
                  </div>

                  {/* Email Body - Larger & Better Spacing */}
                  <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 min-h-[400px]">
                    <div 
                      className="prose prose-base max-w-none dark:prose-invert
                                prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-bold
                                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:text-base prose-p:leading-relaxed
                                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
                                prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-li:my-2"
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.8',
                        fontSize: '15px'
                      }}
                    >
                      {previewContent.content}
                    </div>
                  </div>

                  {/* Email Footer Mockup */}
                  <div className="bg-gray-100 dark:bg-gray-800 p-5 border-t-2 border-gray-300 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      This is an automated email from E-Learning Platform. Please do not reply.
                    </p>
                  </div>
                </div>

                {/* Template Variables */}
                {selectedTemplate && selectedTemplate.variables.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                    <Label className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-3 block">
                      Template Variables ({selectedTemplate.variables.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <Badge 
                          key={variable} 
                          variant="outline" 
                          className="bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                        >
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Eye className="w-4 h-4" />
              <span>Sample data used for preview</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
                Close
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
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
    </div>
  );
};

