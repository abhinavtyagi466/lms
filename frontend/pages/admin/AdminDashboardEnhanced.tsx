import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  BarChart3,
  Award,
  FileText,
  Zap,
  Shield,
  Lightbulb,
  Activity,
  Target,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';
import MetricCard from '../../components/ui/metric-card';
import { DashboardSkeleton } from '../../components/skeletons/dashboard-skeleton';
import { NoDataState, ErrorState } from '../../components/empty-states/empty-state';
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

export const AdminDashboardEnhanced: React.FC = () => {
  const { user, userType, setCurrentPage } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      
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
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error toast for auth failures, let the auth system handle it
      if (!error.message?.includes('Authentication failed')) {
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'not_started': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'certified': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getFilteredProgress = () => {
    if (selectedModule === 'all') return userProgress;
    return userProgress.filter(progress => progress.moduleId._id === selectedModule);
  };

  const getProgressStats = () => {
    const filtered = getFilteredProgress();
    const completed = filtered.filter(p => p.status === 'completed').length;
    const inProgress = filtered.filter(p => p.status === 'in_progress').length;
    const notStarted = filtered.filter(p => p.status === 'not_started').length;
    const total = filtered.length;
    
    return { completed, inProgress, notStarted, total };
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <ErrorState
          title="Failed to load dashboard"
          description={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  const progressStats = getProgressStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                  Monitor platform performance and user engagement
                </p>
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
                onClick={fetchDashboardData}
                variant="outline"
                className="flex items-center border-2 border-blue-600 dark:border-blue-500
                          text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                          px-6 py-3 rounded-xl shadow-lg hover:shadow-xl 
                          transition-all duration-300 transform hover:scale-105"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Field Executive"
            value={stats?.totalUsers || 0}
            change={12}
            trend="up"
            icon={<Users className="w-6 h-6" />}
            description={`${stats?.activeUsers || 0} active`}
            color="info"
          />

          <MetricCard
            title="Training Modules"
            value={stats?.totalModules || 0}
            change={8}
            trend="up"
            icon={<BookOpen className="w-6 h-6" />}
            description={`${stats?.completedModules || 0} completed`}
            color="success"
          />

          <MetricCard
            title="Average Progress"
            value={`${Math.round(stats?.averageProgress || 0)}%`}
            change={5}
            trend="up"
            icon={<Target className="w-6 h-6" />}
            description="Platform average"
            color="warning"
          />

          <MetricCard
            title="Certificates"
            value={stats?.certificatesIssued || 0}
            change={15}
            trend="up"
            icon={<Award className="w-6 h-6" />}
            description="Issued this month"
            color="primary"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Progress Overview */}
          <div className="lg:col-span-2 space-y-6">
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
                <div className="mb-6">
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Modules</option>
                    {/* Add module options here */}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {progressStats.completed}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {progressStats.inProgress}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">In Progress</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {progressStats.notStarted}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Not Started</div>
                  </div>
                </div>

                {userProgress.length === 0 ? (
                  <NoDataState
                    title="No user progress data"
                    description="User progress data will appear here once users start engaging with modules."
                  />
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getFilteredProgress().slice(0, 10).map((progress) => (
                      <div
                        key={progress._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {progress.userId.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {progress.userId.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {progress.moduleId.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(progress.status)}>
                            {progress.status.replace('_', ' ')}
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {Math.round(progress.videoProgress * 100)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(progress.lastAccessedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Analytics - TEMPORARILY HIDDEN FOR MEETING */}
            {/* <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Active Users</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats?.activeUsers || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Total Watch Time</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.round((stats?.totalWatchTime || 0) / 60)}h
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-gray-900 dark:text-white">Completion Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(stats?.averageProgress || 0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Right Column */}
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
                  onClick={() => setCurrentPage('user-management')}
                  variant="outline"
                  className="w-full justify-start border-blue-200 dark:border-blue-500 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button 
                  onClick={() => setCurrentPage('user-details')}
                  variant="outline"
                  className="w-full justify-start border-indigo-200 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <Users className="w-4 h-4 mr-2" />
                  User Details
                </Button>
                <Button 
                  onClick={() => setCurrentPage('user-lifecycle')}
                  variant="outline"
                  className="w-full justify-start border-purple-200 dark:border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  User Lifecycle
                </Button>
                <Button 
                  onClick={() => setCurrentPage('module-management')}
                  className="w-full justify-start bg-green-50 hover:bg-green-100 dark:bg-green-600 dark:hover:bg-green-700 text-green-700 dark:text-white border border-green-200 dark:border-green-500 transition-all duration-200"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Manage Modules
                </Button>
                <Button 
                  onClick={() => setCurrentPage('quiz-management')}
                  className="w-full justify-start bg-purple-50 hover:bg-purple-100 dark:bg-purple-600 dark:hover:bg-purple-700 text-purple-700 dark:text-white border border-purple-200 dark:border-purple-500 transition-all duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Manage Quizzes
                </Button>
                {/* TEMPORARILY HIDDEN FOR MEETING */}
                {/* <Button 
                  onClick={() => window.location.href = '/admin/reports'}
                  className="w-full justify-start bg-orange-50 hover:bg-orange-100 dark:bg-orange-600 dark:hover:bg-orange-700 text-orange-700 dark:text-white border border-orange-200 dark:border-orange-500 transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button> */}
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Platform is performing well</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm">Consider adding more modules</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm">User engagement is increasing</span>
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
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">API Server</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">File Storage</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Email Service</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Online
                    </Badge>
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
