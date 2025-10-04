import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Mail, Send, TestTube, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface EmailTemplate {
  _id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  defaultRecipients: string[];
  isActive: boolean;
  createdAt: string;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const EmailTestingPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [testEmail, setTestEmail] = useState<string>('');
  const [customData, setCustomData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState<string>('');
  const [bulkTitle, setBulkTitle] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await apiService.emailTemplates.getAll();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch email templates');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiService.users.getAllUsers({ limit: 100 });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const handleTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      toast.error('Please select a template and enter test email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.emailTemplates.sendTest(selectedTemplate, {
        testEmail,
        sampleData: customData
      });

      const result: TestResult = {
        success: true,
        message: 'Test email sent successfully',
        data: response
      };

      setTestResults(prev => [result, ...prev]);
      toast.success('Test email sent successfully!');
    } catch (error: any) {
      const result: TestResult = {
        success: false,
        message: 'Failed to send test email',
        error: error.message
      };

      setTestResults(prev => [result, ...prev]);
      toast.error('Failed to send test email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkNotification = async () => {
    if (selectedUsers.length === 0 || !bulkTitle || !bulkMessage) {
      toast.error('Please select users and enter title/message');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.notifications.sendNotification({
        userIds: selectedUsers,
        title: bulkTitle,
        message: bulkMessage,
        type: 'info',
        priority: 'normal'
      });

      const result: TestResult = {
        success: true,
        message: `Notification sent to ${response.sentCount} users`,
        data: response
      };

      setTestResults(prev => [result, ...prev]);
      toast.success(`Notification sent to ${response.sentCount} users!`);
    } catch (error: any) {
      const result: TestResult = {
        success: false,
        message: 'Failed to send bulk notification',
        error: error.message
      };

      setTestResults(prev => [result, ...prev]);
      toast.error('Failed to send bulk notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    try {
      const response = await apiService.emailTemplates.preview(selectedTemplate, customData);
      
      // Open preview in new window
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head>
              <title>Email Preview - ${response.data?.subject || 'Template Preview'}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .subject { font-size: 18px; font-weight: bold; color: #333; }
                .content { line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="subject">Subject: ${response.data?.subject || 'No Subject'}</div>
              </div>
              <div class="content">
                ${response.data?.content || 'No content available'}
              </div>
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
    } catch (error: any) {
      toast.error('Failed to preview template');
    }
  };

  const selectedTemplateData = templates.find(t => t._id === selectedTemplate);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Email Testing Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test email templates and send notifications to users
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <TestTube className="w-4 h-4 mr-1" />
          Testing Mode
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Template Testing */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">Email Template Testing</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template">Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an email template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        <Badge variant={template.isActive ? "default" : "secondary"} className="ml-2">
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplateData && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Template Details:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Type:</strong> {selectedTemplateData.type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Subject:</strong> {selectedTemplateData.subject}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Recipients:</strong> {selectedTemplateData.defaultRecipients.join(', ')}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address to test"
              />
            </div>

            <div>
              <Label htmlFor="customData">Custom Data (JSON)</Label>
              <Textarea
                id="customData"
                value={JSON.stringify(customData, null, 2)}
                onChange={(e) => {
                  try {
                    setCustomData(JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, keep as string
                  }
                }}
                placeholder='{"userName": "John Doe", "kpiScore": "75.50", ...}'
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePreviewTemplate}
                variant="outline"
                disabled={!selectedTemplate}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleTestEmail}
                disabled={!selectedTemplate || !testEmail || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Bulk Notification Testing */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Bulk Notification Testing</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Select Users</Label>
              <Select
                value=""
                onValueChange={(userId) => {
                  if (userId && !selectedUsers.includes(userId)) {
                    setSelectedUsers(prev => [...prev, userId]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add users to notification list" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(user => !selectedUsers.includes(user._id)).map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUsers.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Selected Users ({selectedUsers.length}):</h4>
                <div className="space-y-1">
                  {selectedUsers.map((userId) => {
                    const user = users.find(u => u._id === userId);
                    return (
                      <div key={userId} className="flex items-center justify-between">
                        <span className="text-sm">{user?.name} ({user?.email})</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                        >
                          ×
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="bulkTitle">Notification Title</Label>
              <Input
                id="bulkTitle"
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value)}
                placeholder="Enter notification title"
              />
            </div>

            <div>
              <Label htmlFor="bulkMessage">Notification Message</Label>
              <Textarea
                id="bulkMessage"
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Enter notification message"
                rows={3}
              />
            </div>

            <Button
              onClick={handleBulkNotification}
              disabled={selectedUsers.length === 0 || !bulkTitle || !bulkMessage || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Users className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : `Send to ${selectedUsers.length} Users`}
            </Button>
          </div>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Test Results</h2>
          </div>

          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {result.message}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Error: {result.error}
                      </p>
                    )}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                          View Details
                        </summary>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
