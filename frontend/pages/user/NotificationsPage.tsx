import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Filter, AlertCircle, BookOpen, FileText, Award, Calendar, Mail, Trophy, Target } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { apiService } from '../../services/apiService';
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
  metadata?: {
    kpiScore?: number;
    rating?: string;
    period?: string;
    trainingId?: string;
    auditId?: string;
    actionRequired?: boolean;
    actionUrl?: string;
  };
}

interface Award {
  _id: string;
  type: string;
  title: string;
  description: string;
  awardDate: string;
  value?: number;
}

interface Certificate {
  _id: string;
  title: string;
  description: string;
  awardDate: string;
  type: string;
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'notifications' | 'awards' | 'certificates' | 'warnings' | 'training'>('all');

  useEffect(() => {
    if (user?._id) {
      fetchAllData();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [activeTab, notifications]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [notifRes, awardsRes, certsRes]: any[] = await Promise.all([
        apiService.notifications.getAll(false).catch(() => ({ data: [] })),
        apiService.awards.getUserAwards(user._id).catch(() => ({ awards: [] })),
        apiService.users.getUserCertificates(user._id).catch(() => ({ certificates: [] }))
      ]);
      
      const notificationsData = notifRes?.data || notifRes || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setAwards(awardsRes.awards || awardsRes || []);
      setCertificates(certsRes.certificates || certsRes || []);
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
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark as read',
        variant: 'destructive',
      });
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
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const warningCount = notifications.filter(n => n.type === 'warning' || n.type === 'error').length;
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">
                <Bell className="w-4 h-4 mr-2" />
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Mail className="w-4 h-4 mr-2" />
                Messages
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
                  <p className="text-gray-600">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card
                      key={notification._id}
                      className={`p-6 transition-all hover:shadow-lg ${
                        !notification.read ? 'border-l-4 border-l-blue-600 bg-blue-50 dark:bg-blue-900/10' : ''
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
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              {formatDate(notification.sentAt)}
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-4">{notification.message}</p>
                          {notification.metadata && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {notification.metadata.kpiScore !== undefined && (
                                <Badge variant="outline" className="text-sm">
                                  KPI Score: {notification.metadata.kpiScore}%
                                </Badge>
                              )}
                              {notification.metadata.rating && (
                                <Badge variant="outline" className="text-sm">
                                  Rating: {notification.metadata.rating}
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            {!notification.read && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(notification._id)}>
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

            {/* Messages Tab */}
            <TabsContent value="notifications" className="mt-6">
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No messages</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card key={notification._id} className={`p-6 ${!notification.read ? 'border-l-4 border-l-blue-600 bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{notification.title}</h3>
                          <p className="text-sm text-gray-700 mb-3">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(notification.sentAt)}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Training Tab */}
            <TabsContent value="training" className="mt-6">
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No training notifications</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card key={notification._id} className="p-6 border-l-4 border-l-blue-500">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{notification.title}</h3>
                          <p className="text-sm text-gray-700 mb-3">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(notification.sentAt)}</p>
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
                    <p className="text-gray-600">No awards received yet</p>
                    <p className="text-sm text-gray-500 mt-2">Keep up the good work!</p>
                  </div>
                ) : (
                  awards.map((award) => (
                    <Card key={award._id} className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{award.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{award.description}</p>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-green-100 text-green-800">{award.type}</Badge>
                            <span className="text-sm text-gray-500">{formatDate(award.awardDate)}</span>
                            {award.value && (
                              <Badge className="bg-yellow-100 text-yellow-800">₹{award.value}</Badge>
                            )}
                          </div>
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
                {certificates.length === 0 ? (
                  <div className="p-12 text-center">
                    <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No certificates earned yet</p>
                    <p className="text-sm text-gray-500 mt-2">Complete trainings to earn certificates!</p>
                  </div>
                ) : (
                  certificates.map((cert) => (
                    <Card key={cert._id} className="p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{cert.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{cert.description}</p>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-100 text-purple-800">{cert.type}</Badge>
                            <span className="text-sm text-gray-500">{formatDate(cert.awardDate)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Warnings Tab */}
            <TabsContent value="warnings" className="mt-6">
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">No warnings</p>
                    <p className="text-sm text-gray-500 mt-2">Great job! Keep it up!</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <Card key={notification._id} className="p-6 border-l-4 border-l-orange-500 bg-orange-50">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{notification.title}</h3>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(notification.sentAt)}</p>
                        </div>
                      </div>
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
