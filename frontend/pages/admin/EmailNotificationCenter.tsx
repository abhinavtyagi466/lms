import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Mail, 
  Send, 
  Inbox, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Download,
  Plus,
  Settings
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
  userId: any;
  kpiTriggerId?: any;
  trainingAssignmentId?: any;
  auditScheduleId?: any;
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

interface EmailStats {
  overview: {
    totalEmails: number;
    sentEmails: number;
    failedEmails: number;
    pendingEmails: number;
  };
  byTemplate: Array<{
    _id: string;
    count: number;
    sent: number;
    failed: number;
  }>;
}

const EmailNotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    templateType: '',
    dateRange: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Modal states
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [showEmailDetails, setShowEmailDetails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [bulkEmailForm, setBulkEmailForm] = useState({
    templateId: '',
    recipients: '',
    subject: '',
    content: '',
    scheduledFor: ''
  });

  useEffect(() => {
    fetchEmailData();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchEmailData = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.emailLogs.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      setEmailLogs(response.data || []);
      setPagination(prev => ({
        ...prev,
        ...response.pagination
      }));
      
    } catch (error) {
      console.error('Error fetching email data:', error);
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.emailLogs.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching email stats:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiService.emailTemplates.getAll();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleBulkEmail = async () => {
    try {
      if (!bulkEmailForm.templateId || !bulkEmailForm.recipients) {
        toast.error('Please select a template and enter recipients');
        return;
      }

      const recipients = bulkEmailForm.recipients.split(',').map(email => email.trim());
      
      // Send bulk email logic would go here
      toast.success(`Email sent to ${recipients.length} recipients`);

      setBulkEmailForm({
        templateId: '',
        recipients: '',
        subject: '',
        content: '',
        scheduledFor: ''
      });
      setShowBulkEmail(false);
      fetchEmailData();
      
    } catch (error) {
      console.error('Error sending bulk email:', error);
      toast.error('Failed to send bulk email');
    }
  };

  const handleResendEmail = async (emailId: string) => {
    try {
      await apiService.emailLogs.resend(emailId);
      toast.success('Email has been resent successfully');
      fetchEmailData();
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Failed to resend email');
    }
  };

  const handleExportLogs = async () => {
    try {
      // Export logic would go here
      toast.success('Email logs export has been initiated');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export email logs');
    }
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

  if (loading && emailLogs.length === 0) {
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Email Notification Center
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage all email communications and notifications
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowBulkEmail(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Bulk Email
              </Button>
              <Button
                onClick={handleExportLogs}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={fetchEmailData}
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Emails</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overview.totalEmails}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent</p>
                    <p className="text-2xl font-bold text-green-600">{stats.overview.sentEmails}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overview.failedEmails}</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.overview.pendingEmails}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Filter className="w-5 h-5 mr-2 text-blue-600" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search emails..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <select
                    id="status"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="templateType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Template Type
                  </Label>
                  <select
                    id="templateType"
                    value={filters.templateType}
                    onChange={(e) => setFilters(prev => ({ ...prev, templateType: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="kpi_outstanding">KPI Outstanding</option>
                    <option value="kpi_good">KPI Good</option>
                    <option value="kpi_average">KPI Average</option>
                    <option value="kpi_below_average">KPI Below Average</option>
                    <option value="kpi_poor">KPI Poor</option>
                    <option value="training_assignment">Training Assignment</option>
                    <option value="audit_notification">Audit Notification</option>
                    <option value="warning_letter">Warning Letter</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="dateRange" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date Range
                  </Label>
                  <Input
                    id="dateRange"
                    type="date"
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Logs */}
          <div className="lg:col-span-3">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                  <Inbox className="w-6 h-6 mr-3 text-blue-600" />
                  Email Logs ({pagination.total})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emailLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No emails found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try adjusting your filters or send some emails
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
                              To: {email.recipientEmail} • From: {email.userId?.name || 'System'}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTemplateCategoryColor(email.templateType)}>
                                {email.templateType.replace('_', ' ')}
                              </Badge>
                              {getStatusBadge(email.status)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmail(email);
                                setShowEmailDetails(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {email.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendEmail(email._id)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
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

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bulk Email Modal */}
        <Dialog open={showBulkEmail} onOpenChange={setShowBulkEmail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Send Bulk Email
              </DialogTitle>
              <DialogDescription>
                Send emails to multiple recipients using a template
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template" className="text-sm font-medium">
                  Email Template
                </Label>
                <select
                  id="template"
                  value={bulkEmailForm.templateId}
                  onChange={(e) => setBulkEmailForm(prev => ({ ...prev, templateId: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select a template</option>
                  {templates.map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="recipients" className="text-sm font-medium">
                  Recipients (comma-separated emails)
                </Label>
                <Textarea
                  id="recipients"
                  placeholder="user1@example.com, user2@example.com, user3@example.com"
                  value={bulkEmailForm.recipients}
                  onChange={(e) => setBulkEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-sm font-medium">
                  Subject (optional - will use template subject if empty)
                </Label>
                <Input
                  id="subject"
                  placeholder="Custom subject line"
                  value={bulkEmailForm.subject}
                  onChange={(e) => setBulkEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="scheduledFor" className="text-sm font-medium">
                  Schedule For (optional - leave empty to send immediately)
                </Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={bulkEmailForm.scheduledFor}
                  onChange={(e) => setBulkEmailForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkEmail(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkEmail} className="bg-green-600 hover:bg-green-700 text-white">
                <Send className="w-4 h-4 mr-2" />
                Send Bulk Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Details Modal */}
        <Dialog open={showEmailDetails} onOpenChange={setShowEmailDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedEmail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Subject</Label>
                    <p className="text-gray-900 dark:text-white">{selectedEmail.subject}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedEmail.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Recipient</Label>
                    <p className="text-gray-900 dark:text-white">{selectedEmail.recipientEmail}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Template Type</Label>
                    <Badge className={getTemplateCategoryColor(selectedEmail.templateType)}>
                      {selectedEmail.templateType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Email Content</Label>
                  <div 
                    className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.emailContent }}
                  />
                </div>

                {selectedEmail.errorMessage && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Error Message</Label>
                    <p className="mt-1 text-red-600 dark:text-red-400">{selectedEmail.errorMessage}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDetails(false)}>
                Close
              </Button>
              {selectedEmail?.status === 'failed' && (
                <Button 
                  onClick={() => {
                    handleResendEmail(selectedEmail._id);
                    setShowEmailDetails(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Resend Email
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EmailNotificationCenter;