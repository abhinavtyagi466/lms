import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Award, 
  FileText, 
  Download, 
  Calendar,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'warnings' | 'awards'>('all');
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
    toast.success('All notifications marked as read');
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'warnings') return notification.type === 'warning';
    if (activeTab === 'awards') return notification.type === 'award';
    return true;
  });

  // Get unread count
  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?._id && !user?.id) return;
      
      try {
        setLoading(true);
        console.log('Fetching notifications for user:', user._id || user.id);
        
        const [
          warningsRes,
          awardsRes,
          auditsRes
        ] = await Promise.allSettled([
          apiService.users.getUserWarnings(user._id || user.id),
          apiService.awards.getAllAwards({ userId: user._id || user.id }),
          apiService.audits.getAllRecords({ userId: user._id || user.id })
        ]);

        console.log('Notifications API responses:', {
          warnings: warningsRes,
          awards: awardsRes,
          audits: auditsRes
        });

        const allNotifications: any[] = [];

        // Process warnings
        if (warningsRes.status === 'fulfilled') {
          const warnings = warningsRes.value.data?.warnings || warningsRes.value.warnings || [];
          warnings.forEach((warning: any) => {
            allNotifications.push({
              id: warning._id,
              type: 'warning',
              title: warning.reason || 'Warning',
              description: warning.description || 'You have received a warning',
              date: warning.createdAt,
              severity: warning.severity || 'medium',
              status: warning.status || 'active'
            });
          });
        }

        // Process awards
        if (awardsRes.status === 'fulfilled') {
          const awards = awardsRes.value.data?.awards || awardsRes.value.awards || [];
          awards.forEach((award: any) => {
            allNotifications.push({
              id: award._id,
              type: 'award',
              title: award.title || award.type || 'Award',
              description: award.description || 'Congratulations on your achievement!',
              date: award.awardDate || award.createdAt,
              status: award.status || 'approved',
              certificateUrl: award.certificateUrl
            });
          });
        }



        // Process audit records
        if (auditsRes.status === 'fulfilled') {
          const audits = auditsRes.value.data?.records || auditsRes.value.records || [];
          audits.forEach((audit: any) => {
            allNotifications.push({
              id: audit._id,
              type: audit.type === 'warning' ? 'warning' : 'audit',
              title: audit.reason || 'Audit Record',
              description: audit.description || 'An audit record has been created',
              date: audit.createdAt,
              severity: audit.severity || 'low',
              status: audit.status || 'active'
            });
          });
        }

        // Sort by date (newest first)
        allNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log('Processed notifications:', allNotifications);
        setNotifications(allNotifications);
        
      } catch (error: any) {
        console.error('Notifications fetch error:', error);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?._id, user?.id]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'award':
        return <Award className="w-5 h-5 text-yellow-600" />;
      case 'certificate':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'audit':
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string, severity?: string) => {
    switch (type) {
      case 'warning':
        return <Badge variant="destructive">Warning</Badge>;
      case 'award':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Award</Badge>;
      case 'certificate':
        return <Badge variant="default" className="bg-green-100 text-green-800">Certificate</Badge>;
      case 'audit':
        return <Badge variant="secondary">Audit</Badge>;
      default:
        return <Badge variant="outline">Notification</Badge>;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-gray-600">Your warnings, awards, and audit records</p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">{notifications.length} notifications</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('warnings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'warnings' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Warnings ({notifications.filter(n => n.type === 'warning').length})
        </button>
        <button
          onClick={() => setActiveTab('awards')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'awards' 
              ? 'border-yellow-600 text-yellow-600' 
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Awards ({notifications.filter(n => n.type === 'award').length})
        </button>

      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getNotificationBadge(notification.type, notification.severity)}
                      <span className="text-sm text-gray-500">
                        {getTimeAgo(notification.date)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">
                    {notification.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(notification.date).toLocaleDateString()}</span>
                    </div>
                    
                    {notification.certificateUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(notification.certificateUrl, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {activeTab === 'all' 
                ? "You don't have any notifications yet."
                : `You don't have any ${activeTab} yet.`
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
