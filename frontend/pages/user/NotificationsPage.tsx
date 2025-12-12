import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, AlertCircle, BookOpen, FileText, Award, Calendar, Trophy } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { apiService, UPLOADS_BASE_URL } from '../../services/apiService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'certificate' | 'training' | 'audit' | 'kpi' | 'performance';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  acknowledged: boolean;
  sentAt: string;
  createdAt?: string;
  metadata?: {
    kpiScore?: number;
    rating?: string;
    period?: string;
    trainingId?: string;
    auditId?: string;
    actionRequired?: boolean;
    actionUrl?: string;
    attachmentUrl?: string;
  };
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
  }>;
  sentBy?: {
    _id: string;
    name: string;
  };
}

interface Award {
  _id: string;
  type: string;
  title: string;
  description: string;
  awardDate: string;
  value?: number;
  document?: string;
  documentName?: string;
}

interface Certificate {
  _id: string;
  title: string;
  message?: string;
  description?: string;
  awardDate?: string;
  createdAt?: string;
  type: string;
  document?: string;
  documentName?: string;
  attachment?: string;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
  }>;
  sentBy?: {
    _id: string;
    name: string;
  };
}

interface Warning {
  _id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'dismissed';
  issuedAt: string;
  resolvedAt?: string;
  issuedBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  metadata?: {
    attachmentUrl?: string;
  };
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'notifications' | 'awards' | 'certificates' | 'warnings' | 'training'>('all');

  useEffect(() => {
    if (user && (user as any)?._id) {
      fetchAllData();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [activeTab, notifications]);

  const fetchAllData = async () => {
    if (!user || !(user as any)?._id) return;

    try {
      setLoading(true);
      const userId = (user as any)._id;
      const [notifRes, awardsRes, certsRes, warningsRes]: any[] = await Promise.all([
        apiService.notifications.getAll(false).catch(() => ({ data: [] })),
        apiService.awards.getUserAwards(userId).catch(() => ({ awards: [] })),
        apiService.users.getUserCertificates(userId).catch(() => ({ certificates: [] })),
        apiService.users.getUserWarnings(userId).catch(() => ({ warnings: [] }))
      ]);

      const notificationsData = notifRes?.data || notifRes || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);

      const awardsData = awardsRes?.awards || awardsRes?.data || awardsRes || [];
      setAwards(Array.isArray(awardsData) ? awardsData : []);

      const certsData = certsRes?.certificates || certsRes?.data || certsRes || [];
      setCertificates(Array.isArray(certsData) ? certsData : []);

      // Set warnings from dedicated Warning model
      const warningsData = warningsRes?.warnings || warningsRes?.data || warningsRes || [];
      setWarnings(Array.isArray(warningsData) ? warningsData : []);

      console.log('📋 Loaded data:', {
        notifications: notificationsData.length,
        awards: awardsData.length,
        certificates: certsData.length,
        warnings: warningsData.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...notifications];

    switch (activeTab) {
      case 'warnings':
        filtered = filtered.filter(n => n.type === 'warning' || n.type === 'error');
        break;
      case 'training':
        filtered = filtered.filter(n => n.type === 'training');
        break;
      case 'notifications':
        filtered = filtered.filter(n => !['certificate', 'warning', 'training'].includes(n.type));
        break;
      default:
        break;
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.notifications.markAsRead([notificationId]);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleAcknowledge = async (notificationId: string) => {
    try {
      await apiService.notifications.acknowledge(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, acknowledged: true, read: true } : n)
      );
      toast.success('Notification acknowledged');
    } catch (error) {
      console.error('Error acknowledging:', error);
      toast.error('Failed to acknowledge');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'training':
        return <BookOpen className="w-6 h-6 text-blue-600" />;
      case 'audit':
        return <FileText className="w-6 h-6 text-orange-600" />;
      case 'kpi':
      case 'performance':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'certificate':
        return <Award className="w-6 h-6 text-green-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500 text-white">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">High</Badge>;
      case 'normal':
        return <Badge className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100">Normal</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500">Low</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const warningCount = warnings.length; // Use dedicated warnings array
  const trainingCount = notifications.filter(n => n.type === 'training').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-3">
                <Bell className="w-10 h-10" />
                Notifications & Updates
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'You\'re all caught up! 🎉'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline" className="px-6 py-3 rounded-xl">
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('all')}>
            <div className="text-center">
              <Bell className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">All</p>
            </div>
          </Card>
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('training')}>
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{trainingCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Training</p>
            </div>
          </Card>
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('awards')}>
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{awards.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Awards</p>
            </div>
          </Card>
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('certificates')}>
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{certificates.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Certificates</p>
            </div>
          </Card>
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('warnings')}>
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{warningCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Warnings</p>
            </div>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            {/* Mobile Dropdown */}
            <div className="md:hidden mb-6">
              <Select value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <span>All ({notifications.length})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="training">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Training ({trainingCount})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="awards">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>Awards ({awards.length})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="certificates">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>Certificates ({certificates.length})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warnings">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Warnings ({warningCount})</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-5">
              <TabsTrigger value="all">
                <Bell className="w-4 h-4 mr-2" />
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="training">
                <BookOpen className="w-4 h-4 mr-2" />
                Training ({trainingCount})
              </TabsTrigger>
              <TabsTrigger value="awards">
                <Award className="w-4 h-4 mr-2" />
                Awards ({awards.length})
              </TabsTrigger>
              <TabsTrigger value="certificates">
                <Trophy className="w-4 h-4 mr-2" />
                Certificates ({certificates.length})
              </TabsTrigger>
              <TabsTrigger value="warnings">
                <AlertCircle className="w-4 h-4 mr-2" />
                Warnings ({warningCount})
              </TabsTrigger>
            </TabsList>

            {/* All Notifications Tab */}
            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card
                      key={notification._id}
                      className={`p-6 transition-all hover:shadow-lg bg-white dark:bg-gray-800 ${!notification.read ? 'border-l-4 border-l-blue-600 bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <Badge className="text-xs bg-blue-500 text-white">New</Badge>
                              )}
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {formatDate(notification.sentAt)}
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-4">{notification.message}</p>
                          {notification.metadata && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {notification.metadata.kpiScore !== undefined && (
                                <Badge variant="outline" className="text-sm text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                                  KPI Score: {notification.metadata.kpiScore}%
                                </Badge>
                              )}
                              {notification.metadata.rating && (
                                <Badge variant="outline" className="text-sm text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                                  Rating: {notification.metadata.rating}
                                </Badge>
                              )}
                            </div>
                          )}
                          {notification.attachments && notification.attachments.length > 0 && (
                            <div className="mb-4 space-y-2">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments:</p>
                              {notification.attachments.map((attachment, idx) => (
                                <a
                                  key={idx}
                                  href={attachment.filePath.startsWith('http') ? attachment.filePath : `${UPLOADS_BASE_URL}${attachment.filePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>{attachment.fileName}</span>
                                  {attachment.fileSize && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      ({(attachment.fileSize / 1024).toFixed(2)} KB)
                                    </span>
                                  )}
                                </a>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            {!notification.read && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(notification._id)} className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                                <Check className="w-4 h-4 mr-2" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>



            {/* Training Tab */}
            <TabsContent value="training" className="mt-6">
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No training notifications</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card key={notification._id} className="p-6 border-l-4 border-l-blue-500 bg-white dark:bg-gray-800">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{notification.title}</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(notification.sentAt)}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Awards Tab */}
            <TabsContent value="awards" className="mt-6">
              <div className="space-y-4">
                {awards.length === 0 ? (
                  <div className="p-12 text-center">
                    <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No awards received yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Keep up the good work!</p>
                  </div>
                ) : (
                  awards.map((award) => (
                    <Card key={award._id} className="p-6 border-l-4 border-l-green-500 bg-white dark:bg-gray-800 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{award.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{award.description}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">{award.type}</Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(award.awardDate)}</span>
                            {award.value && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">₹{award.value}</Badge>
                            )}
                          </div>
                          {award.document && (
                            <div className="mt-3">
                              <a
                                href={award.document.startsWith('http') ? award.document : `${UPLOADS_BASE_URL}${award.document}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <FileText className="w-4 h-4" />
                                <span>View Attachment: {award.documentName || 'Document'}</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Certificates & Awards</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {certificates.length} received
                  </Badge>
                </div>

                {certificates.length === 0 ? (
                  <div className="p-12 text-center">
                    <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No certificates earned yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Complete trainings to earn certificates!</p>
                  </div>
                ) : (
                  certificates.map((cert) => (
                    <Card key={cert._id} className="p-6 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-green-800 dark:text-green-200 mb-1">{cert.title || 'Certificate'}</h3>
                            <p className="text-sm text-green-700 dark:text-green-300">{cert.message || cert.description || 'Training completion certificate'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                            {cert.type || 'Certificate'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-green-700 dark:text-green-300 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Issued: {cert.createdAt ? formatDate(cert.createdAt) : cert.awardDate ? formatDate(cert.awardDate) : 'N/A'}
                        </span>
                        {cert.sentBy && (
                          <span>By: {typeof cert.sentBy === 'object' ? cert.sentBy.name : 'Admin'}</span>
                        )}
                        <Badge className="bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100">Sent</Badge>
                      </div>

                      {/* Show attachment if available - check both attachments array and attachment field */}
                      {((cert.attachments && cert.attachments.length > 0) || cert.attachment || cert.document) && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                          <a
                            href={(() => {
                              // Check attachments array first (new format)
                              if (cert.attachments && cert.attachments.length > 0) {
                                const filePath = cert.attachments[0].filePath;
                                return filePath.startsWith('http') ? filePath : `${UPLOADS_BASE_URL}${filePath}`;
                              }
                              // Fallback to attachment field
                              if (cert.attachment) {
                                return cert.attachment.startsWith('http') ? cert.attachment : `${UPLOADS_BASE_URL}${cert.attachment}`;
                              }
                              // Fallback to document field
                              if (cert.document) {
                                return cert.document.startsWith('http') ? cert.document : `${UPLOADS_BASE_URL}${cert.document}`;
                              }
                              return '#';
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:underline text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            View Certificate Document
                            {cert.attachments && cert.attachments.length > 0 && cert.attachments[0].fileName && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">({cert.attachments[0].fileName})</span>
                            )}
                          </a>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Warnings Tab */}
            <TabsContent value="warnings" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Warnings & Alerts</h3>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    {warnings.length} total
                  </Badge>
                </div>

                {warnings.length === 0 ? (
                  <div className="p-12 text-center">
                    <Check className="w-16 h-16 mx-auto text-green-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No warnings found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Great job! Keep it up! 🎉</p>
                  </div>
                ) : (
                  warnings.map((warning) => (
                    <Card key={warning._id} className="p-6 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${warning.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' :
                            warning.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                              warning.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-blue-100 dark:bg-blue-900'
                            }`}>
                            <AlertCircle className={`w-6 h-6 ${warning.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                              warning.severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                warning.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                              }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{warning.title}</h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{warning.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getSeverityColor(warning.severity)}>
                            {warning.severity.charAt(0).toUpperCase() + warning.severity.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Issued: {formatDate(warning.issuedAt)}
                        </span>
                        {warning.resolvedAt && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Check className="w-4 h-4" />
                            Resolved: {formatDate(warning.resolvedAt)}
                          </span>
                        )}
                        {warning.issuedBy && (
                          <span>By: {typeof warning.issuedBy === 'object' ? warning.issuedBy.name : 'Admin'}</span>
                        )}
                        <Badge className={getStatusColor(warning.status)}>
                          {warning.status.charAt(0).toUpperCase() + warning.status.slice(1)}
                        </Badge>
                      </div>

                      {/* Show attachment if available */}
                      {warning.metadata?.attachmentUrl && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <a
                            href={warning.metadata.attachmentUrl.startsWith('http')
                              ? warning.metadata.attachmentUrl
                              : `${UPLOADS_BASE_URL}${warning.metadata.attachmentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            View Attachment Document
                          </a>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
