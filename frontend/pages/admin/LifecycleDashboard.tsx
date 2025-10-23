import React, { useEffect, useState } from 'react';
import { Clock, Users, Activity, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { apiService } from '../../services/apiService';

interface UserWithActivity {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  isActive?: boolean;
  status?: string;
  lastLogin?: string | Date;
  sessionStatus?: 'online' | 'offline';
  totalSessions?: number;
  deviceInfo?: string;
}

export const LifecycleDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserWithActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userActivities, setUserActivities] = useState<Map<string, any>>(new Map());

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiService.users.listSimple();
      // Handle different response formats safely
      const usersList = res?.data?.users || res?.users || res?.data || res || [];
      setUsers(Array.isArray(usersList) ? usersList : []);
      
      // Load activity data for each user (in background)
      if (Array.isArray(usersList) && usersList.length > 0) {
        loadUserActivities(usersList);
      }
    } catch (e) {
      console.error('Error loading users:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivities = async (usersList: any[]) => {
    const activityMap = new Map();
    
    console.log('=== LOADING USER ACTIVITIES ===');
    console.log('Total users:', usersList.length);
    
    // Load activities for first 15 users to avoid overwhelming the API
    const usersToLoad = usersList.slice(0, 15);
    console.log('Loading activities for:', usersToLoad.length, 'users');
    
    // Process users in batches to avoid API overload
    const batchSize = 3;
    for (let i = 0; i < usersToLoad.length; i += batchSize) {
      const batch = usersToLoad.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        try {
          console.log(`Fetching activity for user: ${user.name} (${user._id})`);
          
          const [sessionData, loginAttempts] = await Promise.allSettled([
            apiService.userActivity.getSessionData(user._id, 7).catch((err) => {
              console.error(`Session data error for ${user.name}:`, err);
              return null;
            }),
            apiService.userActivity.getLoginAttempts(user._id, 30).catch((err) => {
              console.error(`Login attempts error for ${user.name}:`, err);
              return null;
            })
          ]);
          
          console.log(`Session data for ${user.name}:`, sessionData);
          console.log(`Login attempts for ${user.name}:`, loginAttempts);

          const activity: any = {
            isOnline: false,
            lastSession: null,
            totalSessions: 0,
            deviceInfo: 'Unknown',
            successfulLogins: 0,
            lastLogin: null
          };
          
          if (sessionData.status === 'fulfilled' && sessionData.value?.data) {
            const sessions = sessionData.value.data;
            activity.lastSession = sessions.summary?.lastSession;
            activity.totalSessions = sessions.summary?.totalSessions || 0;
            activity.isOnline = sessions.recentSessions?.some((s: any) => s.isActive) || false;
            activity.deviceInfo = sessions.devicePatterns?.[0]?._id?.browser || 'Unknown';
          }
          
          if (loginAttempts.status === 'fulfilled' && loginAttempts.value?.data) {
            const logins = loginAttempts.value.data;
            activity.successfulLogins = logins.statistics?.successfulLogins || 0;
            activity.lastLogin = logins.attempts?.[0]?.createdAt;
          }
          
          // Fallback: Use user's lastLogin if no session data
          if (!activity.lastSession && user.lastLogin) {
            activity.lastLogin = user.lastLogin;
            activity.lastSession = user.lastLogin;
          }
          
          activityMap.set(user._id, activity);
        } catch (error) {
          // Silently handle individual user errors with default values
          activityMap.set(user._id, {
            isOnline: false,
            lastSession: null,
            totalSessions: 0,
            deviceInfo: 'Unknown',
            successfulLogins: 0,
            lastLogin: null
          });
        }
      }));
      
      // Small delay between batches to be gentle on the API
      if (i + batchSize < usersToLoad.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setUserActivities(activityMap);
  };

  useEffect(() => {
    loadUsers();
    // connect socket.io without extra dependency (served by backend)
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.async = true;
    script.onload = () => {
      const io = (window as any).io ? (window as any).io() : null;
      if (io) {
        io.on('user:created', () => {
          loadUsers();
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const formatLastActivity = (lastSession: string, lastLogin: string) => {
    const sessionDate = lastSession ? new Date(lastSession) : null;
    const loginDate = lastLogin ? new Date(lastLogin) : null;
    
    if (!sessionDate && !loginDate) return 'Never';
    
    const mostRecent = sessionDate && loginDate 
      ? (sessionDate > loginDate ? sessionDate : loginDate)
      : (sessionDate || loginDate);
    
    const now = new Date();
    const diffMs = now.getTime() - mostRecent!.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return mostRecent!.toLocaleDateString();
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
      <div>
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Lifecycle Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track employee journey, login activity, and session details</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Online Now</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {Array.from(userActivities.values()).filter(a => a.isOnline).length}
              </p>
            </div>
            <Wifi className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Today</p>
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                {Array.from(userActivities.values()).filter(a => {
                  if (!a.lastSession) return false;
                  const lastSession = new Date(a.lastSession);
                  const today = new Date();
                  return lastSession.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactive</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {users.length - Array.from(userActivities.values()).filter(a => a.lastSession).length}
              </p>
            </div>
            <WifiOff className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          User Activity & Login Details
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2">User</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Last Activity</th>
                <th className="text-left py-3 px-2">Sessions</th>
                <th className="text-left py-3 px-2">Device</th>
                <th className="text-left py-3 px-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const activity = userActivities.get(user._id) || {};
                return (
                  <tr key={user._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {activity.isOnline ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Online
                          </Badge>
                        ) : activity.lastSession ? (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            Offline
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Never Active
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white">
                          {formatLastActivity(activity.lastSession, activity.lastLogin)}
                        </p>
                        {activity.successfulLogins > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.successfulLogins} logins
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {activity.totalSessions || 0}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.deviceInfo || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};