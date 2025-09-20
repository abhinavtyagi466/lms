import React, { useState, useEffect } from 'react';
import { 
  BookOpen, BarChart3, Award, AlertTriangle, TrendingUp, Clock, 
  CheckCircle, FileText, Target, FileQuestion, Bell, Calendar,
  User, Video, Trophy, Activity, Zap, Star, Users, Eye, Play,
  GraduationCap, BookMarked, TrendingDown, ArrowUpRight,
  ArrowDownRight, Clock3, Medal, Shield, Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';
import { ModuleWithProgress } from '../../types';

interface UserStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  notStartedModules: number;
  averageScore: number;
  totalQuizzes: number;
  completedQuizzes: number;
  totalWatchTime: number;
  lastActivity: string;
}

interface LifecycleStats {
  totalEvents: number;
  positiveEvents: number;
  negativeEvents: number;
  milestones: number;
  typeDistribution: Array<{ type: string; count: number }>;
  latestEvent: any;
  firstEvent: any;
}

export const UserDashboard: React.FC = () => {
  const { user, setCurrentPage } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [lifecycleStats, setLifecycleStats] = useState<LifecycleStats | null>(null);
  const [recentLifecycleEvents, setRecentLifecycleEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalModules: 0,
    completedModules: 0,
    inProgressModules: 0,
    notStartedModules: 0,
    averageScore: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    totalWatchTime: 0,
    lastActivity: ''
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!(user as any)?._id && !(user as any)?.id) return;
      
      try {
        setLoading(true);
        const userId = (user as any)._id || (user as any).id;
        
        // Fetch all data from APIs
        const [
          profileData,
          modulesData,
          kpiScore,
          warningsData,
          awardsData,
          lifecycleStatsData,
          lifecycleEventsData
        ] = await Promise.allSettled([
          apiService.users.getProfile(userId).catch(() => ({ data: { name: (user as any)?.name, email: (user as any)?.email } })),
          apiService.modules.getUserModules(userId).catch(() => ({ data: { modules: [] } })),
          apiService.kpi.getKPIScore(userId).catch(() => ({ data: { overallScore: 0, rating: 'N/A' } })),
          apiService.users.getUserWarnings(userId).catch(() => ({ data: { warnings: [] } })),
          apiService.awards.getAllAwards({ userId }).catch(() => ({ data: { awards: [] } })),
          apiService.lifecycle.getLifecycleStats(userId).catch(() => ({ data: { statistics: null } })),
          apiService.lifecycle.getUserLifecycle(userId, { limit: 10 }).catch(() => ({ data: { events: [] } }))
        ]);
        
        // Set data with proper error handling
        setUserProfile(profileData.status === 'fulfilled' ? profileData.value : { name: (user as any)?.name, email: (user as any)?.email });
        
        if (modulesData.status === 'fulfilled' && (modulesData.value as any).success) {
          const modulesList = (modulesData.value as any).modules || [];
          setModules(modulesList);
          
          // Calculate comprehensive stats
          const completed = modulesList.filter((m: ModuleWithProgress) => m.progress >= 0.95).length;
          const inProgress = modulesList.filter((m: ModuleWithProgress) => m.progress > 0 && m.progress < 0.95).length;
          const notStarted = modulesList.filter((m: ModuleWithProgress) => m.progress === 0).length;
          const totalQuizzes = modulesList.filter((m: ModuleWithProgress) => m.quizInfo).length;
          const completedQuizzes = modulesList.filter((m: ModuleWithProgress) => m.quizInfo && m.progress >= 0.95).length;
          
          // Calculate total watch time (estimated)
          const totalWatchTime = modulesList.reduce((acc: number, m: ModuleWithProgress) => {
            return acc + (m.progress * 30); // Assuming 30 minutes per module
          }, 0);
          
          setStats({
            totalModules: modulesList.length,
            completedModules: completed,
            inProgressModules: inProgress,
            notStartedModules: notStarted,
            averageScore: kpiScore.status === 'fulfilled' ? (kpiScore.value as any).data?.overallScore || 0 : 0,
            totalQuizzes,
            completedQuizzes,
            totalWatchTime: Math.round(totalWatchTime),
            lastActivity: new Date().toLocaleDateString()
          });
        }
        
        setKpiData(kpiScore.status === 'fulfilled' ? kpiScore.value : null);
        setWarnings(warningsData.status === 'fulfilled' ? (warningsData.value as any).data?.warnings || [] : []);
        setAwards(awardsData.status === 'fulfilled' ? (awardsData.value as any).data?.awards || [] : []);
        setLifecycleStats(lifecycleStatsData.status === 'fulfilled' ? (lifecycleStatsData.value as any).data?.statistics : null);
        setRecentLifecycleEvents(lifecycleEventsData.status === 'fulfilled' ? (lifecycleEventsData.value as any).data?.events || [] : []);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'milestone': return <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'certification': return <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />;
      default: return <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'border-l-yellow-500 bg-yellow-50';
      case 'warning': return 'border-l-red-500 bg-red-50';
      case 'milestone': return 'border-l-blue-500 bg-blue-50';
      case 'certification': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  Welcome back, {userProfile?.data?.name || user?.name || 'Learner'}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                  {userProfile?.data?.email || user?.email} • Member since {userProfile?.data?.createdAt ? new Date(userProfile?.data?.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-white/70 dark:bg-gray-700/70 border-blue-200 dark:border-blue-500 text-blue-700 dark:text-blue-300 px-5 py-2.5 rounded-full shadow-sm">
                <Target className="w-4 h-4 mr-2" />
                KPI Score: {stats.averageScore || 0}
              </Badge>
              <Button 
                onClick={() => setCurrentPage('modules')}
                className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 dark:from-gray-800 dark:to-gray-900 dark:hover:from-gray-900 dark:hover:to-black dark:text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Modules</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalModules}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500 dark:text-green-400" />
                  {stats.completedModules} completed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Learning Progress</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalModules > 0 ? Math.round((stats.completedModules / stats.totalModules) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={stats.totalModules > 0 ? (stats.completedModules / stats.totalModules) * 100 : 0} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{stats.inProgressModules} in progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quiz Performance</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageScore || 0}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <FileQuestion className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Trophy className="w-4 h-4 mr-1 text-yellow-500 dark:text-yellow-400" />
                  {stats.completedQuizzes}/{stats.totalQuizzes} completed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Watch Time</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalWatchTime}m</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Activity className="w-4 h-4 mr-1 text-blue-500 dark:text-blue-400" />
                  Last active: {stats.lastActivity}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Learning Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Progress Chart */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Learning Progress Overview
                </CardTitle>
                <CardDescription>
                  Track your progress across all training modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules.slice(0, 5).map((module, index) => (
                    <div key={module.moduleId} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{module.title}</h4>
                          <p className="text-sm text-gray-600">{module.tags?.join(', ') || 'General'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {Math.round(module.progress * 100)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {module.progress >= 0.95 ? 'Completed' : 'In Progress'}
                          </p>
                        </div>
                        <Progress value={module.progress * 100} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                  {modules.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p>No modules available yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                  <Activity className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest learning milestones and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLifecycleEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${getEventColor(event.type || 'default')}`}>
                      {getEventIcon(event.type || 'default')}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title || 'Activity'}</p>
                        <p className="text-xs text-gray-600">{event.description || 'No description available'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentLifecycleEvents.length === 0 && (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Notifications */}
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
                  onClick={() => setCurrentPage('modules')}
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Modules
                </Button>
                <Button 
                  onClick={() => setCurrentPage('quizzes')}
                  variant="outline"
                  className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Take Quizzes
                </Button>
                <Button 
                  onClick={() => setCurrentPage('notifications')}
                  variant="outline"
                  className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  View Notifications
                </Button>
              </CardContent>
            </Card>

            {/* Recent Warnings */}
            {warnings.length > 0 && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg border-l-4 border-l-red-500 dark:border-l-red-400">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-semibold text-red-700">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Recent Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {warnings.slice(0, 3).map((warning, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg">
                        <p className="text-sm font-medium text-red-800">{warning.title || 'Warning'}</p>
                        <p className="text-xs text-red-600 mt-1">{warning.description || 'No description'}</p>
                        <p className="text-xs text-red-500 mt-1">
                          {new Date(warning.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Awards */}
            {awards.length > 0 && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg border-l-4 border-l-yellow-500 dark:border-l-yellow-400">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-semibold text-yellow-700">
                    <Award className="w-5 h-5 mr-2" />
                    Recent Awards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {awards.slice(0, 3).map((award, index) => (
                      <div key={index} className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800">{award.title || 'Award'}</p>
                        <p className="text-xs text-yellow-600 mt-1">{award.description || 'No description'}</p>
                        <p className="text-xs text-yellow-500 mt-1">
                          {new Date(award.awardDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <span className="text-sm">Learning Efficiency</span>
                    <span className="text-sm font-semibold">
                      {stats.totalModules > 0 ? Math.round((stats.completedModules / stats.totalModules) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quiz Success Rate</span>
                    <span className="text-sm font-semibold">
                      {stats.totalQuizzes > 0 ? Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Time Investment</span>
                    <span className="text-sm font-semibold">{stats.totalWatchTime}m</span>
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