import React, { useState, useEffect } from 'react';
import { 
  BookOpen, BarChart3, Award, AlertTriangle, TrendingUp, Clock, 
  CheckCircle, FileText, Target, FileQuestion, Bell, Calendar,
  User, Video, Trophy, Activity, Zap, Star, Users, Eye, Play,
  GraduationCap, BookMarked, TrendingDown, ArrowUpRight,
  ArrowDownRight, Clock3, Medal, Shield, Lightbulb, Mail,
  ClipboardList, UserCheck, AlertCircle, TrendingUp as TrendingUpIcon,
  PieChart, LineChart, RefreshCw, ExternalLink, ChevronRight,
  Smartphone, Phone
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

// Enhanced KPI Score interface matching backend structure
interface KPIScore {
  _id: string;
  userId: string;
  period: string;
  // Raw operational data
  rawData: {
    totalCases: number;
    tatCases: number;
    majorNegEvents: number;
    clientComplaints: number;
    fatalIssues: number;
    opsRejections: number;
    neighborChecksRequired: number;
    neighborChecksDone: number;
    generalNegEvents: number;
    appCases: number;
    insuffCases: number;
  };
  // Calculated metrics
  metrics: {
    tat: { percentage: number; score: number };
    majorNegativity: { percentage: number; score: number };
    quality: { percentage: number; score: number };
    neighborCheck: { percentage: number; score: number };
    negativity: { percentage: number; score: number };
    appUsage: { percentage: number; score: number };
    insufficiency: { percentage: number; score: number };
  };
  overallScore: number;
  rating: string;
  triggeredActions: string[];
  // Override system
  override: {
    isOverridden: boolean;
    score?: number;
    rating?: string;
    reason?: string;
    overriddenBy?: string;
    overriddenAt?: string;
  };
  // Edge case flags
  edgeCases: {
    zeroCases: boolean;
    naMetrics: string[];
    excludedMetrics: string[];
    insufficientData: boolean;
  };
  // References
  kpiConfigId: string;
  // Audit trail
  auditTrail: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    details: string;
    previousValues: any;
  }>;
  // Existing fields
  submittedBy: string;
  comments?: string;
  trainingAssignments: any[];
  emailLogs: any[];
  auditSchedules: any[];
  processedAt: string;
  automationStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TrainingAssignment {
  _id: string;
  userId: string;
  trainingType: string;
  assignedBy: string;
  dueDate: string;
  status: string;
  completionDate?: string;
  score?: number;
  createdAt: string;
}

interface AuditSchedule {
  _id: string;
  userId: string;
  auditType: string;
  scheduledDate: string;
  status: string;
  completedDate?: string;
  findings?: string;
  createdAt: string;
}

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface QuizAttempt {
  _id: string;
  userId: string;
  moduleId: {
    _id: string;
    title: string;
  };
  attemptNumber: number;
  startTime: string;
  endTime?: string;
  timeSpent: number;
  score: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'terminated' | 'violation';
  violations: Array<{
    type: string;
    timestamp: string;
    description: string;
    severity: string;
  }>;
  createdAt: string;
}

interface QuizAttemptStats {
  totalAttempts: number;
  totalQuizzes: number;
  averageScore: number;
  passRate: number;
  totalTimeSpent: number;
  violations: number;
  recentAttempts: QuizAttempt[];
  moduleStats: Array<{
    moduleId: string;
    moduleTitle: string;
    attempts: number;
    bestScore: number;
    lastAttempt: string;
    passed: boolean;
  }>;
}

interface UserActivity {
  _id: string;
  userId: string;
  activityType: string;
  description: string;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    type: string;
    os: string;
    browser: string;
    version: string;
  };
  location: {
    country: string;
    region: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  sessionId: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
  relatedEntity?: {
    type: string;
    id: string;
  };
  tags: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  isSuspicious: boolean;
  riskScore: number;
  createdAt: string;
}

interface ActivitySummary {
  summary: Array<{
    _id: string;
    count: number;
    lastActivity: string;
    successRate: number;
    avgDuration: number;
    suspiciousCount: number;
  }>;
  totalActivities: number;
  suspiciousActivities: number;
  recentActivities: UserActivity[];
  period: string;
}

interface LoginAttempts {
  attempts: UserActivity[];
  statistics: {
    totalAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    successRate: number;
    uniqueIPs: number;
    uniqueDevices: number;
  };
  period: string;
}

interface SessionData {
  summary: {
    totalSessions: number;
    totalDuration: number;
    avgDuration: number;
    totalPageViews: number;
    totalActions: number;
    suspiciousSessions: number;
    uniqueDevices: string[];
    uniqueLocations: string[];
    lastSession: string;
  };
  recentSessions: Array<{
    sessionId: string;
    startTime: string;
    endTime?: string;
    duration: number;
    ipAddress: string;
    deviceInfo: any;
    location: any;
    isActive: boolean;
    lastActivity: string;
    activityCount: number;
    pageViews: number;
    isSuspicious: boolean;
    terminatedReason?: string;
  }>;
  devicePatterns: Array<{
    _id: {
      deviceType: string;
      os: string;
      browser: string;
    };
    sessionCount: number;
    totalDuration: number;
    avgDuration: number;
    lastUsed: string;
  }>;
  locationPatterns: Array<{
    _id: {
      city: string;
      region: string;
      country: string;
    };
    sessionCount: number;
    totalDuration: number;
    lastUsed: string;
  }>;
  period: string;
}

export const UserDashboard: React.FC = () => {
  const { user, setCurrentPage } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [lifecycleStats, setLifecycleStats] = useState<LifecycleStats | null>(null);
  const [recentLifecycleEvents, setRecentLifecycleEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // KPI-related state
  const [kpiScore, setKpiScore] = useState<KPIScore | null>(null);
  const [trainingAssignments, setTrainingAssignments] = useState<TrainingAssignment[]>([]);
  const [auditSchedules, setAuditSchedules] = useState<AuditSchedule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [kpiHistory, setKpiHistory] = useState<KPIScore[]>([]);
  
  // Quiz attempt state
  const [quizAttemptStats, setQuizAttemptStats] = useState<QuizAttemptStats | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  
  // User activity state
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempts | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
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
          warningsData,
          awardsData,
          lifecycleStatsData,
          lifecycleEventsData,
          kpiData,
          kpiHistoryData,
          trainingData,
          auditData,
          notificationsData,
          quizStatsData,
          quizAttemptsData,
          activitySummaryData,
          loginAttemptsData,
          sessionDataData,
          recentActivitiesData
        ] = await Promise.allSettled([
          apiService.users.getProfile(userId).catch(() => ({ data: { name: (user as any)?.name, email: (user as any)?.email } })),
          apiService.modules.getUserModules(userId).catch(() => ({ data: { modules: [] } })),
          apiService.users.getUserWarnings(userId).catch(() => ({ data: { warnings: [] } })),
          apiService.awards.getAllAwards({ userId }).catch(() => ({ data: { awards: [] } })),
          apiService.lifecycle.getLifecycleStats(userId).catch(() => ({ data: { statistics: null } })),
          apiService.lifecycle.getUserLifecycle(userId, { limit: 10 }).catch(() => ({ data: { events: [] } })),
          apiService.kpi.getUserKPI(userId).catch(() => ({ data: null })),
          apiService.kpi.getUserKPIHistory(userId).catch(() => ({ data: [] })),
          apiService.trainingAssignments.getUserAssignments(userId).catch(() => ({ data: [] })),
          apiService.auditScheduling.getUserAuditHistory(userId).catch(() => ({ data: [] })),
          apiService.notifications.getUserNotifications(userId).catch(() => ({ data: [] })),
          apiService.quizAttempts.getQuizAttemptStats(userId).catch(() => ({ data: null })),
          apiService.quizAttempts.getUserQuizAttempts(userId, { limit: 10 }).catch(() => ({ data: [] })),
          apiService.userActivity.getActivitySummary(userId, 30).catch(() => ({ data: null })),
          apiService.userActivity.getLoginAttempts(userId, 30).catch(() => ({ data: null })),
          apiService.userActivity.getSessionData(userId, 7).catch(() => ({ data: null })),
          apiService.userActivity.getRecentActivities(userId, { limit: 10 }).catch(() => ({ data: [] }))
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
            averageScore: 0,
            totalQuizzes,
            completedQuizzes,
            totalWatchTime: Math.round(totalWatchTime),
            lastActivity: new Date().toLocaleDateString()
          });
        }
        
        setWarnings(warningsData.status === 'fulfilled' ? (warningsData.value as any).data?.warnings || [] : []);
        setAwards(awardsData.status === 'fulfilled' ? (awardsData.value as any).data?.awards || [] : []);
        setLifecycleStats(lifecycleStatsData.status === 'fulfilled' ? (lifecycleStatsData.value as any).data?.statistics : null);
        setRecentLifecycleEvents(lifecycleEventsData.status === 'fulfilled' ? (lifecycleEventsData.value as any).data?.events || [] : []);
        
        // Set KPI-related data
        setKpiScore(kpiData.status === 'fulfilled' ? (kpiData.value as any).data : null);
        setKpiHistory(kpiHistoryData.status === 'fulfilled' ? (kpiHistoryData.value as any).data || [] : []);
        setTrainingAssignments(trainingData.status === 'fulfilled' ? (trainingData.value as any).data || [] : []);
        setAuditSchedules(auditData.status === 'fulfilled' ? (auditData.value as any).data || [] : []);
        setNotifications(notificationsData.status === 'fulfilled' ? (notificationsData.value as any).data || [] : []);
        
        // Set quiz attempt data
        console.log('Quiz Stats Data:', quizStatsData);
        console.log('Quiz Attempts Data:', quizAttemptsData);
        setQuizAttemptStats(quizStatsData.status === 'fulfilled' ? (quizStatsData.value as any).data : null);
        setQuizAttempts(quizAttemptsData.status === 'fulfilled' ? (quizAttemptsData.value as any).data || [] : []);
        
        // Set user activity data
        setActivitySummary(activitySummaryData.status === 'fulfilled' ? (activitySummaryData.value as any).data : null);
        setLoginAttempts(loginAttemptsData.status === 'fulfilled' ? (loginAttemptsData.value as any).data : null);
        setSessionData(sessionDataData.status === 'fulfilled' ? (sessionDataData.value as any).data : null);
        setRecentActivities(recentActivitiesData.status === 'fulfilled' ? (recentActivitiesData.value as any).data || [] : []);
        
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

  const getKPIRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'below average': return 'text-orange-600 bg-orange-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrainingTypeIcon = (type: string) => {
    switch (type) {
      case 'basic': return <GraduationCap className="w-4 h-4" />;
      case 'negativity_handling': return <Shield className="w-4 h-4" />;
      case 'dos_donts': return <CheckCircle className="w-4 h-4" />;
      case 'app_usage': return <Smartphone className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getAuditTypeIcon = (type: string) => {
    switch (type) {
      case 'audit_call': return <Phone className="w-4 h-4" />;
      case 'cross_check': return <UserCheck className="w-4 h-4" />;
      case 'dummy_audit': return <ClipboardList className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'assigned': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'scheduled': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
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
                KPI Score: {kpiScore?.overallScore || 0}
                {kpiScore?.rating && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getKPIRatingColor(kpiScore.rating)}`}>
                    {kpiScore.rating}
                  </span>
                )}
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
                  <p className="text-3xl font-bold text-gray-900">
                    {quizAttemptStats ? Math.round(quizAttemptStats.averageScore) : 
                     quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length) : 
                     0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <FileQuestion className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Trophy className="w-4 h-4 mr-1 text-yellow-500 dark:text-yellow-400" />
                  {quizAttemptStats ? quizAttemptStats.totalAttempts : quizAttempts.length} attempts
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

        {/* KPI Performance Section */}
        {kpiScore && (
          <div className="mb-8">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  KPI Performance Overview
                </CardTitle>
                <CardDescription>
                  Your current performance metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Overall Score */}
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{kpiScore.overallScore}</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                    <Badge className={`mt-2 ${getKPIRatingColor(kpiScore.rating)}`}>
                      {kpiScore.rating}
                    </Badge>
                  </div>
                  
                  {/* Individual Metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">TAT</span>
                      <span className="font-semibold">{kpiScore.metrics?.tat?.percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quality</span>
                      <span className="font-semibold">{kpiScore.metrics?.quality?.percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">App Usage</span>
                      <span className="font-semibold">{kpiScore.metrics?.appUsage?.percentage || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Major Negativity</span>
                      <span className="font-semibold">{kpiScore.metrics?.majorNegativity?.percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Neighbor Check</span>
                      <span className="font-semibold">{kpiScore.metrics?.neighborCheck?.percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Insufficiency</span>
                      <span className="font-semibold">{kpiScore.metrics?.insufficiency?.percentage || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {kpiScore.automationStatus === 'completed' ? '✓' : '⏳'}
                    </div>
                    <div className="text-sm text-gray-600">Automation</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {kpiScore.automationStatus === 'completed' ? 'Processed' : 'Pending'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced KPI Details Section */}
        {kpiScore && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Raw Data Section */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Raw Operational Data
                </CardTitle>
                <CardDescription>
                  Source data for KPI calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cases:</span>
                      <span className="font-semibold">{kpiScore.rawData?.totalCases || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TAT Cases:</span>
                      <span className="font-semibold">{kpiScore.rawData?.tatCases || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">App Cases:</span>
                      <span className="font-semibold">{kpiScore.rawData?.appCases || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Complaints:</span>
                      <span className="font-semibold">{kpiScore.rawData?.clientComplaints || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Neighbor Checks:</span>
                      <span className="font-semibold">{kpiScore.rawData?.neighborChecksDone || 0}/{kpiScore.rawData?.neighborChecksRequired || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Major Neg Events:</span>
                      <span className="font-semibold">{kpiScore.rawData?.majorNegEvents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insufficient Cases:</span>
                      <span className="font-semibold">{kpiScore.rawData?.insuffCases || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ops Rejections:</span>
                      <span className="font-semibold">{kpiScore.rawData?.opsRejections || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Override & Edge Cases Section */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Target className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Score Details & Overrides
                </CardTitle>
                <CardDescription>
                  Override information and edge case handling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Override Information */}
                  {kpiScore.override?.isOverridden && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                        <span className="text-sm font-semibold text-yellow-800">Score Overridden</span>
                      </div>
                      <div className="text-xs text-yellow-700">
                        <div>Reason: {kpiScore.override.reason}</div>
                        <div>Overridden At: {new Date(kpiScore.override.overriddenAt || '').toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}

                  {/* Edge Cases */}
                  {kpiScore.edgeCases && (
                    <div className="space-y-2">
                      {kpiScore.edgeCases.zeroCases && (
                        <div className="flex items-center text-sm text-orange-600">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          No cases handled in this period
                        </div>
                      )}
                      {kpiScore.edgeCases.insufficientData && (
                        <div className="flex items-center text-sm text-yellow-600">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Insufficient data for accurate scoring
                        </div>
                      )}
                      {kpiScore.edgeCases.naMetrics && kpiScore.edgeCases.naMetrics.length > 0 && (
                        <div className="flex items-center text-sm text-blue-600">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          N/A Metrics: {kpiScore.edgeCases.naMetrics.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Triggered Actions */}
                  {kpiScore.triggeredActions && kpiScore.triggeredActions.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Triggered Actions:</div>
                      <div className="flex flex-wrap gap-1">
                        {kpiScore.triggeredActions.map((action, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {action.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz Attempts Section */}
        {true && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Quiz Statistics Card */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <FileQuestion className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Quiz Performance Summary
                </CardTitle>
                <CardDescription>
                  Your quiz attempt statistics and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quizAttemptStats ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {quizAttemptStats.totalAttempts}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Attempts</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {quizAttemptStats.totalQuizzes}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Taken</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {Math.round(quizAttemptStats.averageScore)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {Math.round(quizAttemptStats.passRate)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</div>
                      </div>
                    </div>
                    
                    {quizAttemptStats.violations > 0 && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            {quizAttemptStats.violations} Quiz Violation(s) Detected
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : quizAttempts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {quizAttempts.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Attempts</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {new Set(quizAttempts.map(attempt => attempt.moduleId)).size}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Taken</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {Math.round((quizAttempts.filter(attempt => attempt.passed).length / quizAttempts.length) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</div>
                      </div>
                    </div>
                    
                    {quizAttempts.some(attempt => attempt.violations && attempt.violations.length > 0) && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            Quiz Violation(s) Detected
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No quiz data available</p>
                    <p className="text-sm">Take some quizzes to see your performance here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Quiz Attempts */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Clock className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Recent Quiz Attempts
                </CardTitle>
                <CardDescription>
                  Your latest quiz performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizAttempts.slice(0, 5).map((attempt) => (
                    <div key={attempt._id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          attempt.passed 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {attempt.passed ? (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {attempt.moduleId?.title || 'Unknown Module'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Attempt #{attempt.attemptNumber} • {new Date(attempt.startTime).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          attempt.passed 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {attempt.score}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(attempt.timeSpent / 60)}m
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {quizAttempts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No quiz attempts yet</p>
                      <p className="text-sm">Start taking quizzes to see your performance here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Activity & Lifestyle Section */}
        {(activitySummary || loginAttempts || sessionData) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Summary Card */}
            {activitySummary && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                    <Activity className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Activity Summary
                  </CardTitle>
                  <CardDescription>
                    Your activity patterns over the last {activitySummary.period}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {activitySummary.totalActivities}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Activities</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {activitySummary.suspiciousActivities}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Suspicious</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">Top Activities:</h4>
                    {activitySummary.summary.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50/50 dark:bg-gray-700/50 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {activity._id.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{activity.count}</span>
                          {activity.suspiciousCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {activity.suspiciousCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Login Attempts Card */}
            {loginAttempts && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                    <User className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    Login Security
                  </CardTitle>
                  <CardDescription>
                    Login attempts and security metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {loginAttempts.statistics.successRate}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {loginAttempts.statistics.uniqueDevices}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Devices</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Attempts:</span>
                      <span className="font-medium">{loginAttempts.statistics.totalAttempts}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Successful:</span>
                      <span className="font-medium text-green-600">{loginAttempts.statistics.successfulLogins}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                      <span className="font-medium text-red-600">{loginAttempts.statistics.failedLogins}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Unique IPs:</span>
                      <span className="font-medium">{loginAttempts.statistics.uniqueIPs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Session Data Section */}
        {sessionData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Session Summary */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Clock className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Session Summary
                </CardTitle>
                <CardDescription>
                  Your session activity over the last {sessionData.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {sessionData.summary.totalSessions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                  </div>
                  <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {Math.round(sessionData.summary.avgDuration / 60)}m
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Time:</span>
                    <span className="font-medium">{Math.round(sessionData.summary.totalDuration / 3600)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Page Views:</span>
                    <span className="font-medium">{sessionData.summary.totalPageViews}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Actions:</span>
                    <span className="font-medium">{sessionData.summary.totalActions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Unique Devices:</span>
                    <span className="font-medium">{sessionData.summary.uniqueDevices.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Usage Patterns */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <Smartphone className="w-5 h-5 mr-2 text-pink-600 dark:text-pink-400" />
                  Device Usage
                </CardTitle>
                <CardDescription>
                  Your device usage patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionData.devicePatterns.slice(0, 3).map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                            {device._id.deviceType}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {device._id.os} • {device._id.browser}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{device.sessionCount} sessions</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(device.avgDuration / 60)}m avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activities Section */}
        {recentActivities.length > 0 && (
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                <Activity className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Your latest platform activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.slice(0, 8).map((activity) => (
                  <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.success 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {activity.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {activity.description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={`${
                          activity.severity === 'critical' ? 'border-red-300 text-red-700 bg-red-50' :
                          activity.severity === 'high' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                          activity.severity === 'medium' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                          'border-gray-300 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {activity.severity}
                      </Badge>
                      {activity.isSuspicious && (
                        <Badge variant="destructive" className="text-xs">
                          Suspicious
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

            {/* Training Assignments */}
            {trainingAssignments.length > 0 && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                    <GraduationCap className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Training Assignments
                  </CardTitle>
                  <CardDescription>
                    Your assigned training modules and progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trainingAssignments.slice(0, 5).map((training) => (
                      <div key={training._id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                            {getTrainingTypeIcon(training.trainingType)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 capitalize">
                              {training.trainingType.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Due: {new Date(training.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(training.status)}>
                            {training.status.replace('_', ' ')}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Information */}
            {auditSchedules.length > 0 && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                    <ClipboardList className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                    Audit Information
                  </CardTitle>
                  <CardDescription>
                    Your scheduled audits and compliance status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditSchedules.slice(0, 5).map((audit) => (
                      <div key={audit._id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                            {getAuditTypeIcon(audit.auditType)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 capitalize">
                              {audit.auditType.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Scheduled: {new Date(audit.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status.replace('_', ' ')}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
            {/* Notifications */}
            {notifications.length > 0 && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                    <Bell className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification._id} className={`p-3 rounded-lg border-l-4 ${
                        notification.isRead ? 'bg-gray-50 border-l-gray-300' : 'bg-blue-50 border-l-blue-500'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  {kpiScore && (
                    <>
                      <div className="border-t border-white/20 pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">KPI Performance</span>
                          <span className="text-sm font-semibold">{kpiScore.overallScore}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Training Assignments</span>
                          <span className="text-sm font-semibold">{trainingAssignments.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Upcoming Audits</span>
                          <span className="text-sm font-semibold">
                            {auditSchedules.filter(a => a.status === 'scheduled').length}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};