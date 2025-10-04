import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Filter, AlertCircle, BookOpen, FileText, Award, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { apiService } from '../../services/apiService';
import { useToast } from '../../components/ui/use-toast';

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

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'acknowledged'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response: any = await apiService.notifications.getAll(false);
      const notificationsData = response?.data || response || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...notifications];
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'acknowledged':
        filtered = filtered.filter(n => n.acknowledged);
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
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const handleAcknowledge = async (notificationId: string) => {
    try {
      await apiService.notifications.acknowledge(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, acknowledged: true, read: true } : n)
      );
      toast({
        title: 'Success',
        description: 'Notification acknowledged',
      });
    } catch (error) {
      console.error('Error acknowledging:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge',
        variant: 'destructive',
      });
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'You\'re all caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged ({notifications.filter(n => n.acknowledged).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Bell className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-sm">You don't have any notifications to display</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification._id}
              className={`p-6 transition-all hover:shadow-lg ${
                !notification.read ? 'border-l-4 border-l-blue-600 bg-blue-50 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
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

                  {/* Message */}
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {notification.message}
                  </p>

                  {/* Metadata */}
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
                      {notification.metadata.period && (
                        <Badge variant="outline" className="text-sm">
                          Period: {notification.metadata.period}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification._id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                    {notification.metadata?.actionRequired && !notification.acknowledged && (
                      <Button
                        size="sm"
                        onClick={() => handleAcknowledge(notification._id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {notification.metadata?.actionUrl && (
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => {
                          window.location.hash = `#${notification.metadata?.actionUrl}`;
                        }}
                      >
                        View Details →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
