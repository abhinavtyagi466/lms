import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { 
  Mail, 
  Send, 
  Inbox, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface EmailLog {
  _id: string;
  recipientEmail: string;
  recipientRole: string;
  templateType: string;
  subject: string;
  emailContent: string;
  status: 'sent' | 'pending' | 'failed' | 'delivered';
  sentAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  userId: string;
  kpiTriggerId?: string;
  trainingAssignmentId?: string;
  auditScheduleId?: string;
}

interface EmailTemplate {
  _id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

const UserEmailCenter: React.FC = () => {
  const { user, setCurrentPage } = useAuth();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    content: '',
    templateId: ''
  });

  useEffect(() => {
    fetchEmailData();
  }, []);

  const fetchEmailData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's email logs
      const logsResponse = await apiService.emailLogs.getByUser(user?._id || '');
      setEmailLogs(logsResponse.data || []);

      // Fetch available templates for user
      const templatesResponse = await apiService.emailTemplates.getAll();
      setTemplates(templatesResponse.data || []);
      
    } catch (error) {
      console.error('Error fetching email data:', error);
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  const handleComposeEmail = async () => {
    try {
      if (!composeForm.to || !composeForm.subject || !composeForm.content) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Send email using the custom template
      await apiService.emailTemplates.sendCustom({
        to: composeForm.to,
        subject: composeForm.subject,
        content: composeForm.content,
        fromUserId: user?._id || '',
        fromUserEmail: user?.email || ''
      });

      toast.success('Your email has been sent successfully');

      setComposeForm({ to: '', subject: '', content: '', templateId: '' });
      setShowCompose(false);
      fetchEmailData();
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setComposeForm(prev => ({
      ...prev,
      subject: template.subject,
      content: template.content,
      templateId: template._id
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTemplateCategoryColor = (category: string) => {
    const colors = {
      'kpi_outstanding': 'bg-green-100 text-green-800',
      'kpi_good': 'bg-blue-100 text-blue-800',
      'kpi_average': 'bg-yellow-100 text-yellow-800',
      'kpi_below_average': 'bg-orange-100 text-orange-800',
      'kpi_poor': 'bg-red-100 text-red-800',
      'training_assignment': 'bg-purple-100 text-purple-800',
      'audit_notification': 'bg-indigo-100 text-indigo-800',
      'warning_letter': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading email center...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage('dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Email Center
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your emails and communications
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Logs */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                  <Inbox className="w-6 h-6 mr-3 text-blue-600" />
                  Email History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emailLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No emails yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your email history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emailLogs.map((email) => (
                      <div
                        key={email._id}
                        className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {email.subject}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              To: {email.recipientEmail}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTemplateCategoryColor(email.templateType)}>
                                {email.templateType.replace('_', ' ')}
                              </Badge>
                              {getStatusBadge(email.status)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                          {email.emailContent.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(email.sentAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(email.sentAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {email.status === 'failed' && email.errorMessage && (
                            <span className="text-red-600 dark:text-red-400">
                              {email.errorMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Compose & Templates */}
          <div className="space-y-6">
            {/* Compose Email */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Send className="w-5 h-5 mr-2 text-green-600" />
                  Compose Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showCompose ? (
                  <Button
                    onClick={() => setShowCompose(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Email
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="to" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        To
                      </Label>
                      <Input
                        id="to"
                        type="email"
                        placeholder="recipient@example.com"
                        value={composeForm.to}
                        onChange={(e) => setComposeForm(prev => ({ ...prev, to: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Email subject"
                        value={composeForm.subject}
                        onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Message
                      </Label>
                      <Textarea
                        id="content"
                        placeholder="Type your message here..."
                        rows={4}
                        value={composeForm.content}
                        onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleComposeEmail}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCompose(false)}
                        className="px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Mail className="w-5 h-5 mr-2 text-purple-600" />
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No templates available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {templates.slice(0, 5).map((template) => (
                      <div
                        key={template._id}
                        className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {template.name}
                          </h4>
                          <Badge className={getTemplateCategoryColor(template.category)}>
                            {template.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.subject}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <User className="w-5 h-5 mr-2 text-indigo-600" />
                  Email Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Emails</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {emailLogs.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
                    <span className="font-semibold text-green-600">
                      {emailLogs.filter(e => e.status === 'sent' || e.status === 'delivered').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
                    <span className="font-semibold text-red-600">
                      {emailLogs.filter(e => e.status === 'failed').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEmailCenter;
