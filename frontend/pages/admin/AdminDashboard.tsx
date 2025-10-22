import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Award,
  FileText,
  Zap,
  Shield,
  Lightbulb,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  totalModules: number;
  totalQuizzes: number;
  activeUsers: number;
  completedModules: number;
  averageProgress: number;
  totalWatchTime: number;
  certificatesIssued: number;
}

interface UserProgress {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  moduleId: {
    _id: string;
    title: string;
    ytVideoId: string;
  };
  videoProgress: number;
  videoWatched: boolean;
  status: string;
  lastAccessedAt: string;
  completedAt?: string;
}


export const AdminDashboard: React.FC = () => {
  const { user, userType } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    // Only fetch data if user is authenticated and is admin
    if (user && userType === 'admin') {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, userType]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data in parallel
      const [
        statsResponse,
        progressResponse
      ] = await Promise.allSettled([
        apiService.reports.getAdminStats(),
        apiService.reports.getAllUserProgress()
      ]);

      // Handle stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value?.data) {
        setStats(statsResponse.value.data);
      }

      // Handle user progress data
      if (progressResponse.status === 'fulfilled' && progressResponse.value?.data) {
        setUserProgress(progressResponse.value.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error toast for auth failures, let the auth system handle it
      if (!error.message?.includes('Authentication failed')) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'certified': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-blue-500 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-purple-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <Shield className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">Monitor platform performance and user engagement</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
  <Badge 
    variant="outline" 
    className="flex items-center bg-gradient-to-r from-gray-800 to-gray-900 
              hover:from-gray-900 hover:to-black 
              text-blue-700 px-6 py-3 
              rounded-xl shadow-lg hover:shadow-xl 
              transition-all duration-300 transform hover:scale-105  
              border border-indigo-200 dark:border-indigo-500"
  >
    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
    <BarChart3 className="w-5 h-5 mr-2" />
    Real-time Data
  </Badge>

  <Button 
    onClick={() => window.location.reload()}
    className="flex items-center bg-gradient-to-r from-gray-800 to-gray-900 
              hover:from-gray-900 hover:to-black 
              text-blue-700 px-6 py-3 
              rounded-xl shadow-lg hover:shadow-xl 
              transition-all duration-300 transform hover:scale-105  
              border border-indigo-200 dark:border-indigo-500"
  >
    <Zap className="w-5 h-5 mr-2" />
    Refresh Data
  </Button>
</div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 dark:bg-gradient-to-br dark:from-blue-500 dark:to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500 dark:text-green-400" />
                  {stats?.activeUsers || 0} active
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Training Modules</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalModules || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 dark:bg-gradient-to-br dark:from-green-500 dark:to-emerald-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500 dark:text-green-400" />
                  {stats?.completedModules || 0} completed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Progress</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.averageProgress || 0}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 dark:bg-gradient-to-br dark:from-purple-500 dark:to-violet-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={stats?.averageProgress || 0} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Platform average</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Certificates</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.certificatesIssued || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 dark:bg-gradient-to-br dark:from-yellow-500 dark:to-orange-600 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Star className="w-4 h-4 mr-1 text-yellow-500 dark:text-yellow-400" />
                  Issued this month
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Progress & Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Progress Overview */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                  <Users className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  User Progress Overview
                </CardTitle>
                <CardDescription>
                  Monitor user engagement and completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex space-x-3">
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Modules</option>
                    {Array.from(new Set(userProgress.map(p => p.moduleId.title))).map((title, index) => (
                      <option key={index} value={title}>{title}</option>
                    ))}
                  </select>
                  <Button 
                    onClick={fetchDashboardData}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Progress Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {userProgress.filter(p => p.status === 'completed' || p.status === 'certified').length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {userProgress.filter(p => p.status === 'in_progress').length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {userProgress.filter(p => p.status === 'not_started').length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Not Started</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {userProgress
                    .filter(progress => selectedModule === 'all' || progress.moduleId.title === selectedModule)
                    .slice(0, 8)
                    .map((progress) => (
                    <div key={progress._id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-600 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white drop-shadow-lg" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{progress.userId.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{progress.moduleId.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Last accessed: {new Date(progress.lastAccessedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {Math.round(progress.videoProgress)}%
                          </p>
                          <Badge className={getStatusColor(progress.status)}>
                            {progress.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Progress value={progress.videoProgress} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                  {userProgress.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p>No user progress data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Platform Analytics */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Platform Analytics
                </CardTitle>
                <CardDescription>
                  Key performance indicators and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Watch Time</span>
                      <span className="text-lg font-bold text-blue-800 dark:text-blue-200">{stats?.totalWatchTime || 0}h</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Quiz Completion</span>
                      <span className="text-lg font-bold text-green-800 dark:text-green-200">{stats?.totalQuizzes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Avg. Session Time</span>
                      <span className="text-lg font-bold text-indigo-800 dark:text-indigo-200">
                        {stats && stats.totalUsers > 0 ? Math.round((stats.totalWatchTime || 0) / stats.totalUsers * 60) : 0}m
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Sessions</span>
                      <span className="text-lg font-bold text-purple-800 dark:text-purple-200">{stats?.activeUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Success Rate</span>
                      <span className="text-lg font-bold text-orange-800 dark:text-orange-200">
                        {stats && stats.totalModules > 0 ? Math.round((stats.completedModules / stats.totalModules) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                      <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Engagement Rate</span>
                      <span className="text-lg font-bold text-teal-800 dark:text-teal-200">
                        {stats && stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Insights */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Zap className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/admin/user-management'}
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin/module-management'}
                  variant="outline"
                  className="w-full justify-start border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Manage Modules
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin/quiz-management'}
                  variant="outline"
                  className="w-full justify-start border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Manage Quizzes
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin/reports'}
                  variant="outline"
                  className="w-full justify-start border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Engagement</span>
                    <span className="text-sm font-semibold">
                      {stats && stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Module Completion</span>
                    <span className="text-sm font-semibold">
                      {stats && stats.totalModules > 0 ? Math.round((stats.completedModules / stats.totalModules) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Progress</span>
                    <span className="text-sm font-semibold">{stats?.averageProgress || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Shield className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Database</span>
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">API Server</span>
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">File Storage</span>
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Last Updated</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date().toLocaleTimeString()}</span>
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