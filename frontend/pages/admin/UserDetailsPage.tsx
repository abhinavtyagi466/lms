import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { ArrowLeft, User, Mail, Phone, Clock, CheckCircle, Play, FileQuestion, Target, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface UserDetailsPageProps {
  userId: string;
}


interface VideoProgress {
  [videoId: string]: {
    currentTime: number;
    duration: number;
  };
}

interface QuizResult {
  _id: string;
  moduleId: {
    _id: string;
    title: string;
  };
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  passed: boolean;
  completedAt: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
  }>;
}

interface QuizAttempt {
  _id: string;
  moduleId: {
    _id: string;
    title: string;
  };
  userId: string;
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
    averageScore: number;
    passRate: number;
    lastAttempt: string;
  }>;
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
  issuedBy: string;
  metadata?: any;
  createdBy?: string;
  createdAt: string;
}

interface LifecycleEvent {
  _id: string;
  userId: string;
  eventType: string;
  title: string;
  description: string;
  metadata?: any;
  createdBy?: string;
  createdAt: string;
}

export const UserDetailsPage: React.FC<UserDetailsPageProps> = ({ userId }) => {
  const { setCurrentPage } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [videoProgress, setVideoProgress] = useState<VideoProgress>({});
  const [modules, setModules] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [quizAttemptStats, setQuizAttemptStats] = useState<QuizAttemptStats | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'quiz' | 'attempts' | 'warnings' | 'lifecycle' | 'kpi'>('details');

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      console.log('UserDetailsPage: Fetching user details for userId:', userId);
      
      const userResponse = await apiService.users.getUserById(userId);
      console.log('UserDetailsPage: User response:', userResponse);
      console.log('UserDetailsPage: Response data:', userResponse?.data);
      console.log('UserDetailsPage: Response structure:', Object.keys(userResponse || {}));
      
      // Check if response has data property or if response itself is the data
      let userData = null;
      if (userResponse && userResponse.data) {
        userData = userResponse.data;
      } else if (userResponse && (userResponse as any)._id) {
        userData = userResponse;
      }
      
      if (userData) {
        console.log('UserDetailsPage: Setting user data:', userData);
        setUser(userData);
        
        if (userData._id) {
          fetchUserData(userData);
        }
      } else {
        console.error('UserDetailsPage: No user data in response');
        console.error('UserDetailsPage: Full response:', userResponse);
        toast.error('No user data received');
      }
    } catch (error) {
      console.error('UserDetailsPage: Error fetching user details:', error);
      toast.error('Failed to load user details: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (userData: any) => {
    if (!userData || !userData._id) return;
    
    try {
      console.log('UserDetailsPage: Fetching data for user:', userData._id);
      
      // Fetch user's video progress, modules, quiz results, quiz attempts, warnings, and lifecycle events in parallel
      const [progressResponse, modulesResponse, quizResultsResponse, quizStatsResponse, quizAttemptsResponse, warningsResponse, lifecycleResponse] = await Promise.all([
        apiService.progress.getUserProgress(userData._id),
        apiService.modules.getUserModules(userData._id), // Use getUserModules instead of getAllModules
        apiService.quizzes.getQuizResults(userData._id).catch(() => ({ data: { results: [] } })),
        apiService.quizAttempts.getQuizAttemptStats(userData._id).catch(() => ({ data: null })),
        apiService.quizAttempts.getUserQuizAttempts(userData._id, { limit: 20 }).catch(() => ({ data: [] })),
        apiService.users.getUserWarnings(userData._id).catch(() => ({ data: { warnings: [] } })),
        apiService.lifecycle.getUserLifecycle(userData._id, { limit: 20 }).catch(() => ({ data: { events: [] } }))
      ]);

      console.log('===== RESPONSE DEBUG =====');
      console.log('Progress Response:', progressResponse);
      console.log('Modules Response:', modulesResponse);
      console.log('Quiz Results Response:', quizResultsResponse);
      console.log('Quiz Stats Response:', quizStatsResponse);
      console.log('Quiz Attempts Response:', quizAttemptsResponse);
      console.log('==========================');

      // Set video progress - FIXED: Handle response properly
      if (progressResponse?.success && progressResponse.progress) {
        console.log('Setting video progress (format 1):', progressResponse.progress);
        setVideoProgress(progressResponse.progress);
      } else if (progressResponse?.data?.success && progressResponse.data.progress) {
        console.log('Setting video progress (format 2):', progressResponse.data.progress);
        setVideoProgress(progressResponse.data.progress);
      } else if (progressResponse?.data?.progress) {
        console.log('Setting video progress (format 3):', progressResponse.data.progress);
        setVideoProgress(progressResponse.data.progress);
      } else {
        console.log('No video progress found, setting empty object');
        setVideoProgress({});
      }

      // Set modules - FIXED: Handle multiple response formats
      let modulesList: any[] = [];
      if (modulesResponse?.success && modulesResponse.modules) {
        console.log('Modules found (format 1):', modulesResponse.modules.length);
        modulesList = modulesResponse.modules;
      } else if (modulesResponse?.data?.success && modulesResponse.data.modules) {
        console.log('Modules found (format 2):', modulesResponse.data.modules.length);
        modulesList = modulesResponse.data.modules;
      } else if (modulesResponse?.data && Array.isArray(modulesResponse.data)) {
        console.log('Modules found (format 3):', modulesResponse.data.length);
        modulesList = modulesResponse.data;
      } else if (modulesResponse && Array.isArray(modulesResponse)) {
        console.log('Modules found (format 4):', modulesResponse.length);
        modulesList = modulesResponse;
      }
      
      // Map moduleId to _id for consistency
      const mappedModules = modulesList.map((module: any) => ({
        ...module,
        _id: module._id || module.moduleId
      }));
      
      console.log('Final mapped modules:', mappedModules);
      setModules(mappedModules);

      // Set quiz results - FIXED: Handle multiple response formats
      let quizResultsList: any[] = [];
      if (quizResultsResponse?.success && quizResultsResponse.results) {
        console.log('Quiz results found (format 1):', quizResultsResponse.results.length);
        quizResultsList = quizResultsResponse.results;
      } else if (quizResultsResponse?.data?.results) {
        console.log('Quiz results found (format 2):', quizResultsResponse.data.results.length);
        quizResultsList = quizResultsResponse.data.results;
      } else if (quizResultsResponse?.data && Array.isArray(quizResultsResponse.data)) {
        console.log('Quiz results found (format 3):', quizResultsResponse.data.length);
        quizResultsList = quizResultsResponse.data;
      } else if (quizResultsResponse && Array.isArray(quizResultsResponse)) {
        console.log('Quiz results found (format 4):', quizResultsResponse.length);
        quizResultsList = quizResultsResponse;
      }
      setQuizResults(quizResultsList);

      // Set quiz attempt stats - FIXED: Handle multiple response formats
      let quizStatsData = null;
      if (quizStatsResponse?.success && quizStatsResponse.stats) {
        console.log('Quiz stats found (format 1)');
        quizStatsData = quizStatsResponse.stats;
      } else if (quizStatsResponse?.data) {
        console.log('Quiz stats found (format 2)');
        quizStatsData = quizStatsResponse.data;
      } else if (quizStatsResponse && !quizStatsResponse.data) {
        console.log('Quiz stats found (format 3)');
        quizStatsData = quizStatsResponse;
      }
      setQuizAttemptStats(quizStatsData);

      // Set quiz attempts - FIXED: Handle multiple response formats
      let quizAttemptsList: any[] = [];
      if (quizAttemptsResponse?.success && quizAttemptsResponse.attempts) {
        console.log('Quiz attempts found (format 1):', quizAttemptsResponse.attempts.length);
        quizAttemptsList = quizAttemptsResponse.attempts;
      } else if (quizAttemptsResponse?.data) {
        console.log('Quiz attempts found (format 2):', quizAttemptsResponse.data.length);
        quizAttemptsList = quizAttemptsResponse.data;
      } else if (quizAttemptsResponse && Array.isArray(quizAttemptsResponse)) {
        console.log('Quiz attempts found (format 3):', quizAttemptsResponse.length);
        quizAttemptsList = quizAttemptsResponse;
      }
      setQuizAttempts(quizAttemptsList);

      // Set warnings - FIXED: Handle multiple response formats
      let warningsList: any[] = [];
      if (warningsResponse?.success && warningsResponse.warnings) {
        console.log('Warnings found (format 1):', warningsResponse.warnings.length);
        warningsList = warningsResponse.warnings;
      } else if (warningsResponse?.data?.warnings) {
        console.log('Warnings found (format 2):', warningsResponse.data.warnings.length);
        warningsList = warningsResponse.data.warnings;
      } else if (warningsResponse?.data && Array.isArray(warningsResponse.data)) {
        console.log('Warnings found (format 3):', warningsResponse.data.length);
        warningsList = warningsResponse.data;
      }
      setWarnings(warningsList);

      // Set lifecycle events - FIXED: Handle multiple response formats
      let lifecycleEventsList: any[] = [];
      if (lifecycleResponse?.success && lifecycleResponse.events) {
        console.log('Lifecycle events found (format 1):', lifecycleResponse.events.length);
        lifecycleEventsList = lifecycleResponse.events;
      } else if (lifecycleResponse?.data?.events) {
        console.log('Lifecycle events found (format 2):', lifecycleResponse.data.events.length);
        lifecycleEventsList = lifecycleResponse.data.events;
      } else if (lifecycleResponse?.data && Array.isArray(lifecycleResponse.data)) {
        console.log('Lifecycle events found (format 3):', lifecycleResponse.data.length);
        lifecycleEventsList = lifecycleResponse.data;
      }
      setLifecycleEvents(lifecycleEventsList);

      console.log('===== FINAL STATE =====');
      console.log('Modules count:', mappedModules.length);
      console.log('Video progress keys:', Object.keys(progressResponse?.progress || progressResponse?.data?.progress || {}).length);
      console.log('Quiz results count:', quizResultsList.length);
      console.log('Quiz attempts count:', quizAttemptsList.length);
      console.log('Warnings count:', warningsList.length);
      console.log('Lifecycle events count:', lifecycleEventsList.length);
      console.log('======================');

    } catch (error) {
      console.error('UserDetailsPage: Error fetching user data:', error);
      toast.error('Failed to fetch user data: ' + (error as any).message);
    }
  };

  const handleBack = () => {
    setCurrentPage('user-management');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'audited': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateQuizStats = () => {
    if (!quizResults || quizResults.length === 0) {
      return {
        totalQuizzes: 0,
        passedQuizzes: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        passRate: 0
      };
    }

    const totalQuizzes = quizResults.length;
    const passedQuizzes = quizResults.filter(result => result.passed).length;
    const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
    const totalTimeSpent = quizResults.reduce((sum, result) => sum + result.timeSpent, 0);

    return {
      totalQuizzes,
      passedQuizzes,
      averageScore: Math.round(totalScore / totalQuizzes),
      totalTimeSpent,
      passRate: Math.round((passedQuizzes / totalQuizzes) * 100)
    };
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-lg text-gray-600 mb-6">The requested user details could not be loaded.</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to User Management
          </Button>
        </div>
      </div>
    );
  }

  const quizStats = calculateQuizStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to User Management
              </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
              <p className="text-gray-600 dark:text-gray-400">Complete information about {user.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Card className="w-full min-h-screen rounded-none overflow-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-600">User Details & Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(user.status)}>
                {user.status}
              </Badge>
              {user.isActive ? (
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Inactive</Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'details', label: 'User Details', icon: User },
                { id: 'progress', label: 'Video Progress', icon: Play },
                { id: 'quiz', label: 'Quiz Stats', icon: FileQuestion },
                { id: 'attempts', label: 'Quiz Attempts', icon: Target },
                { id: 'kpi', label: 'KPI Scores', icon: BarChart3 },
                { id: 'warnings', label: `Warnings (${warnings.length})`, icon: AlertTriangle },
                { id: 'lifecycle', label: 'Lifecycle Events', icon: Clock }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="font-medium">{user.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Employee ID:</span>
                        <span className="font-medium">{user.employeeId || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Department:</span>
                        <span className="font-medium">{user.department || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Manager:</span>
                        <span className="font-medium">{user.manager || 'N/A'}</span>
        </div>
      </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Personal</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Address:</span>
                        <span className="font-medium">{user.address || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Location:</span>
                        <span className="font-medium">{user.location || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">City:</span>
                        <span className="font-medium">{user.city || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">State:</span>
                        <span className="font-medium">{user.state || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">PAN Number:</span>
                        <span className="font-medium">{user.panNo || 'N/A'}</span>
                  </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Aadhaar Number:</span>
                        <span className="font-medium">{user.aadhaarNo || 'N/A'}</span>
                  </div>
                </div>
                  </Card>
                </div>

                {/* Performance Metrics */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Performance Metrics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{user.kpiScore || 0}%</div>
                      <div className="text-sm text-gray-600">KPI Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{quizStats.totalQuizzes}</div>
                      <div className="text-sm text-gray-600">Quizzes Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{quizStats.passRate}%</div>
                      <div className="text-sm text-gray-600">Quiz Pass Rate</div>
                    </div>
                  </div>
            </Card>

                {/* Account Information */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Account Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Last Login:</span>
                      <div className="font-medium">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Account Created:</span>
                      <div className="font-medium">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <div className="font-medium">
                        {user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Account Status:</span>
                      <div className="font-medium">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Inactive Information */}
                {!user.isActive && (
                  <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-red-800">Inactive Account Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Reason:</span>
                        <div className="font-medium text-red-800">{user.inactiveReason || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Remark:</span>
                        <div className="font-medium text-red-800">{user.inactiveRemark || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Inactive Date:</span>
                        <div className="font-medium text-red-800">
                          {user.inactiveDate ? formatDate(user.inactiveDate) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
                </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Video Progress</h3>
                </div>
                
                {modules.length === 0 ? (
                  <div className="text-center py-8">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No modules available</p>
                    <p className="text-xs text-gray-400 mt-2">Modules count: {modules.length}</p>
                    <p className="text-xs text-gray-400">Video progress keys: {Object.keys(videoProgress).length}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module) => {
                      // Map progress using ytVideoId instead of module._id
                      const progress = videoProgress[module.ytVideoId] || { currentTime: 0, duration: 0 };
                      const progressPercentage = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
                      
                      return (
                        <Card key={module._id} className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Play className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{module.title}</h4>
                              <p className="text-xs text-gray-600">{module.description}</p>
                  </div>
                </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{formatTime(progress.currentTime)}</span>
                              <span>{formatTime(progress.duration)}</span>
                            </div>
                </div>
            </Card>
                      );
                    })}
                  </div>
                )}
          </div>
        )}

            {activeTab === 'quiz' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileQuestion className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Quiz Statistics</h3>
                </div>
                
                {quizStats.totalQuizzes === 0 ? (
                  <div className="text-center py-8">
                    <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No quiz attempts found</p>
              </div>
                ) : (
                  <>
                    
                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{quizAttemptStats?.totalQuizzes || 0}</div>
                        <div className="text-sm text-gray-600">Total Quizzes</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{quizAttemptStats?.totalAttempts || 0}</div>
                        <div className="text-sm text-gray-600">Total Attempts</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{quizAttemptStats?.averageScore || 0}%</div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{formatTime(quizAttemptStats?.totalTimeSpent || 0)}</div>
                        <div className="text-sm text-gray-600">Total Time</div>
                      </Card>
            </div>

                    {/* Recent Quiz Results */}
                    <Card className="p-4">
                      <h4 className="font-semibold mb-4">Recent Quiz Results</h4>
                      <div className="space-y-3">
                        {quizResults.slice(0, 5).map((result) => (
                          <div key={result._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                result.passed ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {result.passed ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                )}
                              </div>
              <div>
                                <div className="font-medium">{result.moduleId.title}</div>
                                <div className="text-sm text-gray-600">
                                  {result.correctAnswers}/{result.totalQuestions} correct
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{result.score}%</div>
                              <div className="text-sm text-gray-600">{formatTime(result.timeSpent)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </>
                )}
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Quiz Attempts</h3>
            </div>
                
                {quizAttempts.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No quiz attempts found</p>
              </div>
            ) : (
                  <div className="space-y-4">
                    {quizAttempts.map((attempt) => (
                      <Card key={attempt._id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              attempt.passed ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {attempt.passed ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{attempt.moduleId.title}</div>
                              <div className="text-sm text-gray-600">
                                Attempt #{attempt.attemptNumber} • {formatDate(attempt.startTime)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{attempt.score}%</div>
                            <div className="text-sm text-gray-600">{formatTime(attempt.timeSpent)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <Badge className={getStatusColor(attempt.status)}>
                            {attempt.status}
                          </Badge>
                          {attempt.violations.length > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              {attempt.violations.length} Violations
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                          )}
                        </div>
            )}

            {activeTab === 'warnings' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Warnings & Alerts</h3>
                </div>
                
                {warnings.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-500">No warnings found</p>
                    <p className="text-xs text-gray-400 mt-2">Warnings count: {warnings.length}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {warnings.map((warning) => (
                      <Card key={warning._id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              warning.severity === 'critical' ? 'bg-red-100' :
                              warning.severity === 'high' ? 'bg-orange-100' :
                              warning.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                            }`}>
                              <AlertTriangle className={`w-4 h-4 ${
                                warning.severity === 'critical' ? 'text-red-600' :
                                warning.severity === 'high' ? 'text-orange-600' :
                                warning.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium">{warning.title}</div>
                              <div className="text-sm text-gray-600">{warning.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getSeverityColor(warning.severity)}>
                              {warning.severity}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Issued: {formatDate(warning.issuedAt)}</span>
                          {warning.resolvedAt && (
                            <span>Resolved: {formatDate(warning.resolvedAt)}</span>
                          )}
                          <Badge className={getStatusColor(warning.status)}>
                            {warning.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                                </div>
                )}
                                </div>
            )}

            {activeTab === 'kpi' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">KPI Scores</h3>
                              </div>
                                <Button
                    onClick={() => setCurrentPage(`kpi-scores/${userId}`)}
                                  variant="outline"
                    className="flex items-center gap-2"
                                >
                    <BarChart3 className="w-4 h-4" />
                    View Detailed KPI
                                </Button>
                </div>
                
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">KPI Scores</h3>
                  <p className="text-gray-600 mb-4">Click "View Detailed KPI" to see comprehensive performance metrics and analysis.</p>
                                <Button
                    onClick={() => setCurrentPage(`kpi-scores/${userId}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Open KPI Dashboard
                                </Button>
                              </div>
                                        </div>
                                      )}

            {activeTab === 'lifecycle' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Lifecycle Events</h3>
                                  </div>

                {lifecycleEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No lifecycle events found</p>
                    <p className="text-xs text-gray-400 mt-2">Lifecycle events count: {lifecycleEvents.length}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lifecycleEvents.map((event) => (
                      <Card key={event._id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                                            </div>
                          <div className="flex-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-600">{event.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(event.createdAt)} • {event.eventType}
                                    </div>
                                  </div>
                                </div>
                      </Card>
                    ))}
                  </div>
                          )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};