import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, AlertCircle, BookOpen, FileText, Award, Clock, Eye, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { apiService } from '../../services/apiService';
import { useToast } from '../ui/use-toast';

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

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response: any = await apiService.notifications.getAll(false);
      const notificationsData = response?.data || response || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData.slice(0, 10) : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response: any = await apiService.notifications.getUnreadCount();
      const count = response?.data?.count || response?.count || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.notifications.markAsRead([notificationId]);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast({
        title: 'Marked as read',
        description: 'Notification has been marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
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
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast({
        title: 'Acknowledged',
        description: 'Notification has been acknowledged',
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge notification',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'training':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'audit':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'kpi':
      case 'performance':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'certificate':
        return <Award className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 bg-blue-500 text-white hover:bg-blue-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-110"
        aria-label="Notifications"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs font-bold px-1 animate-bounce"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Notification Dropdown - Fixed Positioning */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0"
            style={{ zIndex: 999999 }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Card - Properly Centered */}
          <Card 
            className="fixed top-16 right-4 w-[420px] max-h-[calc(100vh-80px)] overflow-hidden shadow-2xl border-2 border-gray-300 dark:border-gray-600 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ zIndex: 1000000 }}
          >
          {/* Header - Enhanced */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-5 border-b-2 border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Notifications</h3>
                  <p className="text-sm text-blue-100 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : '✨ All caught up!'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    onClick={handleMarkAllAsRead}
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  onClick={handleToggleDropdown}
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications List - Enhanced */}
          <div className="overflow-y-auto max-h-[480px] bg-gray-50 dark:bg-gray-900">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Bell className="w-10 h-10 text-blue-400" />
                </div>
                <h4 className="text-gray-700 dark:text-gray-300 font-semibold mb-2">No notifications yet</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">We'll notify you when something important arrives</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`border-b border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 cursor-pointer ${
                    !notification.read 
                      ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:to-indigo-950 border-l-4 border-l-blue-500 hover:shadow-md' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification._id);
                    }
                    if (notification.metadata?.actionUrl) {
                      setIsOpen(false);
                      window.location.hash = notification.metadata.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon - Enhanced */}
                    <div className={`flex-shrink-0 mt-1 p-2.5 rounded-lg shadow-md ${
                      !notification.read 
                        ? 'bg-white dark:bg-gray-800 ring-2 ring-blue-200 dark:ring-blue-800' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content - Enhanced */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-bold ${
                          !notification.read 
                            ? 'text-blue-900 dark:text-blue-100' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1 animate-pulse shadow-lg shadow-blue-500/50"></div>
                        )}
                      </div>
                      
                      <p className={`text-xs mt-1 line-clamp-2 ${
                        !notification.read 
                          ? 'text-gray-700 dark:text-blue-200 font-medium' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {notification.message}
                      </p>

                      {/* Metadata - Enhanced */}
                      {notification.metadata && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {notification.metadata.kpiScore !== undefined && (
                            <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 border border-amber-300 dark:border-amber-700 rounded-md px-2.5 py-1 shadow-sm">
                              <span className="text-xs text-amber-900 dark:text-amber-100 font-bold">
                                📊 {notification.metadata.kpiScore}%
                              </span>
                            </div>
                          )}
                          {notification.metadata.rating && (
                            <Badge variant="outline" className="text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300">
                              {notification.metadata.rating}
                            </Badge>
                          )}
                          {notification.metadata.period && (
                            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                              📅 {notification.metadata.period}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions - Enhanced */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(notification.sentAt)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Read
                            </Button>
                          )}
                          {notification.metadata?.actionRequired && !notification.acknowledged && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs font-semibold bg-green-600 hover:bg-green-700 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledge(notification._id);
                              }}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Enhanced */}
          {notifications.length > 0 && (
            <div className="border-t-2 border-gray-300 dark:border-gray-700 p-4 bg-gradient-to-r from-gray-100 to-blue-50 dark:from-gray-800 dark:to-blue-900">
              <Button
                variant="ghost"
                className="w-full text-sm font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800 h-10 shadow-sm border border-blue-200 dark:border-blue-700"
                onClick={() => {
                  setIsOpen(false);
                  window.location.hash = '#/notifications';
                }}
              >
                <Bell className="w-4 h-4 mr-2" />
                View All Notifications
                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              </Button>
            </div>
          )}
        </Card>
        </>
      )}
    </div>
  );
};

