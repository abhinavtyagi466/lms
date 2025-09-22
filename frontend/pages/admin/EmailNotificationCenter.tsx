import React, { useState, useEffect } from 'react';
// Version: 1.0 - Fresh implementation with new logic
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  BarChart3,
  Loader2,
  FileText,
  TrendingUp
} from 'lucide-react';
import { apiService } from '../../services/apiService';

interface EmailLog {
  _id: string;
  recipientEmail: string;
  recipientRole: string;
  templateType: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  kpiTriggerId?: string;
  errorMessage?: string;
  createdAt: string;
}

interface EmailTemplate {
  _id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

interface RecipientGroup {
  _id: string;
  name: string;
  description: string;
  recipients: string[];
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  successRate: number;
  templates: number;
  groups: number;
}

const EmailNotificationCenter: React.FC = () => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 0,
    templates: 0,
    groups: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Dialog states
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: '',
    subject: '',
    content: '',
    variables: [] as string[]
  });
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    recipients: [] as string[],
    roles: [] as string[]
  });
  const [sendForm, setSendForm] = useState({
    templateId: '',
    groupId: '',
    subject: '',
    content: '',
    scheduledAt: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEmailLogs(),
        loadTemplates(),
        loadRecipientGroups(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await apiService.emailLogs.getAll();
      const logs = response?.data;
      if (Array.isArray(logs)) {
        setEmailLogs(logs);
      } else {
        setEmailLogs([]);
      }
    } catch (error) {
      console.error('Failed to load email logs:', error);
      setEmailLogs([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiService.emailTemplates.getAll();
      const templateData = response?.data;
      if (Array.isArray(templateData)) {
        setTemplates(templateData);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    }
  };

  const loadRecipientGroups = async () => {
    try {
      const response = await apiService.recipientGroups.getAll();
      const groupData = response?.data;
      if (Array.isArray(groupData)) {
        setRecipientGroups(groupData);
      } else {
        setRecipientGroups([]);
      }
    } catch (error) {
      console.error('Failed to load recipient groups:', error);
      setRecipientGroups([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.emailStats.get();
      const statsData = response?.data;
      if (statsData && typeof statsData === 'object') {
        setStats(statsData);
      } else {
        setStats({
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          successRate: 0,
          templates: 0,
          groups: 0
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
        templates: 0,
        groups: 0
      });
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await apiService.emailTemplates.create({
        ...templateForm,
        category: templateForm.type
      });
      setShowTemplateDialog(false);
      setTemplateForm({ name: '', type: '', subject: '', content: '', variables: [] });
      loadTemplates();
      loadStats();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await apiService.recipientGroups.create({
        ...groupForm,
        role: groupForm.roles.join(', ')
      });
      setShowGroupDialog(false);
      setGroupForm({ name: '', description: '', recipients: [], roles: [] });
      loadRecipientGroups();
      loadStats();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      await apiService.emailLogs.schedule({
        templateId: sendForm.templateId,
        recipientGroupId: sendForm.groupId,
        scheduledFor: sendForm.scheduledAt,
        subject: sendForm.subject,
        content: sendForm.content
      });
      setShowSendDialog(false);
      setSendForm({ templateId: '', groupId: '', subject: '', content: '', scheduledAt: '' });
      loadEmailLogs();
      loadStats();
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleResendEmail = async (emailId: string) => {
    try {
      await apiService.emailLogs.resend(emailId);
      loadEmailLogs();
      loadStats();
    } catch (error) {
      console.error('Failed to resend email:', error);
    }
  };

  const handleRetryFailed = async () => {
    try {
      await apiService.emailLogs.retryFailed([]);
      loadEmailLogs();
      loadStats();
    } catch (error) {
      console.error('Failed to retry failed emails:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-green-100 text-green-800', label: 'Sent', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed', icon: AlertTriangle },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTemplateTypeBadge = (type: string) => {
    const typeConfig = {
      kpi_notification: { color: 'bg-blue-100 text-blue-800', label: 'KPI Notification' },
      training_assignment: { color: 'bg-purple-100 text-purple-800', label: 'Training Assignment' },
      audit_notification: { color: 'bg-orange-100 text-orange-800', label: 'Audit Notification' },
      warning_letter: { color: 'bg-red-100 text-red-800', label: 'Warning Letter' },
      performance_improvement: { color: 'bg-green-100 text-green-800', label: 'Performance Improvement' }
    };
    const config = typeConfig[type as keyof typeof typeConfig] || { color: 'bg-gray-100 text-gray-800', label: type };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getFilteredEmails = () => {
    if (!Array.isArray(emailLogs)) return [];
    
    return emailLogs.filter(email => {
      const matchesSearch = email.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.templateType?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || email.status === filterStatus;
      const matchesTemplate = filterTemplate === 'all' || email.templateType === filterTemplate;
      return matchesSearch && matchesStatus && matchesTemplate;
    });
  };

  const filteredEmails = getFilteredEmails();

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email._id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Center</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage email notifications and templates</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowSendDialog(true)}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Email
          </Button>
          <Button 
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Emails</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email History
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="recipients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="kpi_notification">KPI Notification</SelectItem>
                  <SelectItem value="training_assignment">Training Assignment</SelectItem>
                  <SelectItem value="audit_notification">Audit Notification</SelectItem>
                  <SelectItem value="warning_letter">Warning Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {selectedEmails.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleRetryFailed}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Selected
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleRetryFailed}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Retry Failed
              </Button>
            </div>
          </div>

          {/* Email History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Email History</CardTitle>
              <CardDescription>View and manage all email notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading emails...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.map((email) => (
                      <TableRow key={email._id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedEmails.includes(email._id)}
                            onCheckedChange={() => handleSelectEmail(email._id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{email.recipientEmail}</p>
                            <p className="text-sm text-gray-500">{email.recipientRole}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                        <TableCell>{getTemplateTypeBadge(email.templateType)}</TableCell>
                        <TableCell>{getStatusBadge(email.status)}</TableCell>
                        <TableCell>
                          {new Date(email.sentAt).toLocaleDateString()} {new Date(email.sentAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {email.status === 'failed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleResendEmail(email._id)}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <p className="text-sm text-gray-600">Manage email templates for notifications</p>
            </div>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{getTemplateTypeBadge(template.type)}</CardDescription>
                    </div>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{template.subject}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Recipient Groups</h3>
              <p className="text-sm text-gray-600">Manage email recipient groups</p>
            </div>
            <Button onClick={() => setShowGroupDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipientGroups.map((group) => (
              <Card key={group._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </div>
                    <Badge variant={group.isActive ? "default" : "secondary"}>
                      {group.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">
                    {group.recipients.length} recipients
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4" />
            <p>Email analytics and performance metrics</p>
            <p className="text-sm">will be available here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>Create a new email template for notifications</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="templateType">Template Type</Label>
                <Select value={templateForm.type} onValueChange={(value) => setTemplateForm({...templateForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kpi_notification">KPI Notification</SelectItem>
                    <SelectItem value="training_assignment">Training Assignment</SelectItem>
                    <SelectItem value="audit_notification">Audit Notification</SelectItem>
                    <SelectItem value="warning_letter">Warning Letter</SelectItem>
                    <SelectItem value="performance_improvement">Performance Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="templateSubject">Subject</Label>
              <Input
                id="templateSubject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                placeholder="Enter email subject"
              />
            </div>
            <div>
              <Label htmlFor="templateContent">Content</Label>
              <Textarea
                id="templateContent"
                value={templateForm.content}
                onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                placeholder="Enter email content (HTML supported)"
                rows={8}
              />
            </div>
            <Button onClick={handleCreateTemplate} className="w-full">
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Recipient Group</DialogTitle>
            <DialogDescription>Create a new recipient group for email notifications</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupForm.name}
                onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label htmlFor="groupDescription">Description</Label>
              <Textarea
                id="groupDescription"
                value={groupForm.description}
                onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                placeholder="Enter group description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="groupRecipients">Recipients (comma-separated emails)</Label>
              <Textarea
                id="groupRecipients"
                value={groupForm.recipients.join(', ')}
                onChange={(e) => setGroupForm({...groupForm, recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)})}
                placeholder="Enter email addresses separated by commas"
                rows={3}
              />
            </div>
            <Button onClick={handleCreateGroup} className="w-full">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>Send email to recipient groups</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sendTemplate">Template</Label>
              <Select value={sendForm.templateId} onValueChange={(value) => setSendForm({...sendForm, templateId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sendGroup">Recipient Group</Label>
              <Select value={sendForm.groupId} onValueChange={(value) => setSendForm({...sendForm, groupId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient group" />
                </SelectTrigger>
                <SelectContent>
                  {recipientGroups.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sendSubject">Subject</Label>
              <Input
                id="sendSubject"
                value={sendForm.subject}
                onChange={(e) => setSendForm({...sendForm, subject: e.target.value})}
                placeholder="Enter email subject"
              />
            </div>
            <div>
              <Label htmlFor="sendContent">Content</Label>
              <Textarea
                id="sendContent"
                value={sendForm.content}
                onChange={(e) => setSendForm({...sendForm, content: e.target.value})}
                placeholder="Enter email content"
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="sendSchedule">Schedule (optional)</Label>
              <Input
                id="sendSchedule"
                type="datetime-local"
                value={sendForm.scheduledAt}
                onChange={(e) => setSendForm({...sendForm, scheduledAt: e.target.value})}
              />
            </div>
            <Button onClick={handleSendEmail} className="w-full">
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailNotificationCenter;
