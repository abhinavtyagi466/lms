import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { ArrowLeft, User, Mail, Phone, Clock, CheckCircle, Play, FileQuestion, Target, TrendingUp, AlertTriangle, BarChart3, Download, FileText, Award, XCircle } from 'lucide-react';
import { apiService, UPLOADS_BASE_URL } from '../../services/apiService';
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
  type?: string;
  category?: string;
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
  const [personalisedModules, setPersonalisedModules] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [kpiScores, setKpiScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'quiz' | 'attempts' | 'warnings' | 'lifecycle' | 'kpi' | 'personalised' | 'certificates'>('details');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  // Debug avatar changes
  useEffect(() => {
    if (user?.avatar) {
      console.log('Avatar value:', user.avatar);
      const imageUrl = user.avatar.startsWith('http') ? user.avatar : `${window.location.origin}${user.avatar}`;
      console.log('Constructed image URL:', imageUrl);
    }
  }, [user?.avatar]);

  // Refresh user details when page becomes visible or when user is updated
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        console.log('Page became visible, refreshing user details...');
        fetchUserDetails();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userUpdated' && e.newValue === userId && userId) {
        console.log('User updated detected, refreshing user details...');
        fetchUserDetails();
        localStorage.removeItem('userUpdated');
      }
    };

    const handleFocus = () => {
      if (userId) {
        console.log('Window focused, refreshing user details...');
        fetchUserDetails();
      }
    };

    const handleWarningCreated = (e: any) => {
      if (e.detail?.userId === userId) {
        console.log('Warning created for this user, refreshing data...');
        fetchUserDetails();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('warningCreated', handleWarningCreated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('warningCreated', handleWarningCreated);
    };
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
        console.log('UserDetailsPage: Avatar field:', userData.avatar);
        console.log('UserDetailsPage: Full user object:', JSON.stringify(userData, null, 2));
        setUser(userData);
        setImageError(false); // Reset image error when user data changes

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

      // Fetch user's video progress, modules, quiz results, quiz attempts, warnings, lifecycle events, awards, and certificates in parallel
      const [progressResponse, modulesResponse, quizResultsResponse, quizStatsResponse, quizAttemptsResponse, warningsResponse, lifecycleResponse, awardsResponse, certificatesResponse] = await Promise.all([
        apiService.progress.getUserProgress(userData._id),
        apiService.modules.getUserModules(userData._id), // Use getUserModules instead of getAllModules
        apiService.quizzes.getQuizResults(userData._id).catch(() => ({ data: { results: [] } })),
        apiService.quizAttempts.getQuizAttemptStats(userData._id).catch(() => ({ data: null })),
        apiService.quizAttempts.getUserQuizAttempts(userData._id, { limit: 20 }).catch(() => ({ data: [] })),
        apiService.users.getUserWarnings(userData._id).catch(() => ({ data: { warnings: [] } })),
        apiService.lifecycle.getUserLifecycle(userData._id, { limit: 50 }).catch(() => ({ data: { events: [] } })),
        apiService.awards.getUserAwards(userData._id).catch(() => ({ data: { awards: [] } })),
        apiService.users.getUserCertificates(userData._id).catch(() => ({ data: { certificates: [] } }))
      ]);

      console.log('===== RESPONSE DEBUG =====');
      console.log('Progress Response:', progressResponse);
      console.log('Modules Response:', modulesResponse);
      console.log('Quiz Results Response:', quizResultsResponse);
      console.log('Quiz Stats Response:', quizStatsResponse);
      console.log('Quiz Attempts Response:', quizAttemptsResponse);
      console.log('==========================');

      // Set video progress - FIXED: Handle response properly
      if ((progressResponse as any)?.success && (progressResponse as any).progress) {
        console.log('Setting video progress (format 1):', (progressResponse as any).progress);
        setVideoProgress((progressResponse as any).progress);
      } else if ((progressResponse as any)?.data?.success && (progressResponse as any).data.progress) {
        console.log('Setting video progress (format 2):', (progressResponse as any).data.progress);
        setVideoProgress((progressResponse as any).data.progress);
      } else if ((progressResponse as any)?.data?.progress) {
        console.log('Setting video progress (format 3):', (progressResponse as any).data.progress);
        setVideoProgress((progressResponse as any).data.progress);
      } else {
        console.log('No video progress found, setting empty object');
        setVideoProgress({});
      }

      // Set modules - FIXED: Handle multiple response formats
      let modulesList: any[] = [];
      if ((modulesResponse as any)?.success && (modulesResponse as any).modules) {
        console.log('Modules found (format 1):', (modulesResponse as any).modules.length);
        modulesList = (modulesResponse as any).modules;
      } else if ((modulesResponse as any)?.data?.success && (modulesResponse as any).data.modules) {
        console.log('Modules found (format 2):', (modulesResponse as any).data.modules.length);
        modulesList = (modulesResponse as any).data.modules;
      } else if ((modulesResponse as any)?.data && Array.isArray((modulesResponse as any).data)) {
        console.log('Modules found (format 3):', (modulesResponse as any).data.length);
        modulesList = (modulesResponse as any).data;
      } else if (modulesResponse && Array.isArray(modulesResponse)) {
        console.log('Modules found (format 4):', modulesResponse.length);
        modulesList = modulesResponse;
      }

      // Map moduleId to _id for consistency
      const mappedModules = modulesList.map((module: any) => ({
        ...module,
        _id: module._id || module.moduleId
      }));

      // De-duplicate modules: Keep only unique modules by _id
      // For duplicates, prefer the one with higher progress or personalized version
      const uniqueModulesMap = new Map();
      mappedModules.forEach((module: any) => {
        const key = (module._id || module.moduleId)?.toString();
        if (!key) return;

        const existing = uniqueModulesMap.get(key);
        if (!existing) {
          uniqueModulesMap.set(key, module);
        } else {
          // Keep the one with higher progress
          const existingProgress = existing.progress || 0;
          const currentProgress = module.progress || 0;
          if (currentProgress > existingProgress) {
            uniqueModulesMap.set(key, module);
          }
        }
      });

      const uniqueModules = Array.from(uniqueModulesMap.values());
      console.log('Final unique modules:', uniqueModules.length, 'from', mappedModules.length);
      setModules(uniqueModules);

      // Set quiz results - FIXED: Handle multiple response formats
      let quizResultsList: any[] = [];
      if ((quizResultsResponse as any)?.success && (quizResultsResponse as any).results) {
        console.log('Quiz results found (format 1):', (quizResultsResponse as any).results.length);
        quizResultsList = (quizResultsResponse as any).results;
      } else if ((quizResultsResponse as any)?.data?.results) {
        console.log('Quiz results found (format 2):', (quizResultsResponse as any).data.results.length);
        quizResultsList = (quizResultsResponse as any).data.results;
      } else if ((quizResultsResponse as any)?.data && Array.isArray((quizResultsResponse as any).data)) {
        console.log('Quiz results found (format 3):', (quizResultsResponse as any).data.length);
        quizResultsList = (quizResultsResponse as any).data;
      } else if (quizResultsResponse && Array.isArray(quizResultsResponse)) {
        console.log('Quiz results found (format 4):', quizResultsResponse.length);
        quizResultsList = quizResultsResponse;
      }
      setQuizResults(quizResultsList);

      // Set quiz attempt stats - FIXED: Handle multiple response formats
      let quizStatsData = null;
      if ((quizStatsResponse as any)?.success && (quizStatsResponse as any).stats) {
        console.log('Quiz stats found (format 1)');
        quizStatsData = (quizStatsResponse as any).stats;
      } else if ((quizStatsResponse as any)?.data) {
        console.log('Quiz stats found (format 2)');
        quizStatsData = (quizStatsResponse as any).data;
      } else if (quizStatsResponse && !(quizStatsResponse as any).data) {
        console.log('Quiz stats found (format 3)');
        quizStatsData = quizStatsResponse;
      }
      setQuizAttemptStats(quizStatsData);

      // Set quiz attempts - FIXED: Handle multiple response formats
      let quizAttemptsList: any[] = [];
      if ((quizAttemptsResponse as any)?.success && (quizAttemptsResponse as any).attempts) {
        console.log('Quiz attempts found (format 1):', (quizAttemptsResponse as any).attempts.length);
        quizAttemptsList = (quizAttemptsResponse as any).attempts;
      } else if ((quizAttemptsResponse as any)?.data) {
        console.log('Quiz attempts found (format 2):', (quizAttemptsResponse as any).data.length);
        quizAttemptsList = (quizAttemptsResponse as any).data;
      } else if (quizAttemptsResponse && Array.isArray(quizAttemptsResponse)) {
        console.log('Quiz attempts found (format 3):', quizAttemptsResponse.length);
        quizAttemptsList = quizAttemptsResponse;
      }
      setQuizAttempts(quizAttemptsList);

      // Set warnings - FIXED: Handle multiple response formats
      let warningsList: any[] = [];
      if ((warningsResponse as any)?.success && (warningsResponse as any).warnings) {
        console.log('Warnings found (format 1):', (warningsResponse as any).warnings.length);
        warningsList = (warningsResponse as any).warnings;
      } else if ((warningsResponse as any)?.data?.warnings) {
        console.log('Warnings found (format 2):', (warningsResponse as any).data.warnings.length);
        warningsList = (warningsResponse as any).data.warnings;
      } else if ((warningsResponse as any)?.data && Array.isArray((warningsResponse as any).data)) {
        console.log('Warnings found (format 3):', (warningsResponse as any).data.length);
        warningsList = (warningsResponse as any).data;
      }
      setWarnings(warningsList);

      // Set lifecycle events - FIXED: Handle multiple response formats
      let lifecycleEventsList: any[] = [];
      if ((lifecycleResponse as any)?.success && (lifecycleResponse as any).events) {
        console.log('Lifecycle events found (format 1):', (lifecycleResponse as any).events.length);
        lifecycleEventsList = (lifecycleResponse as any).events;
      } else if ((lifecycleResponse as any)?.data?.events) {
        console.log('Lifecycle events found (format 2):', (lifecycleResponse as any).data.events.length);
        lifecycleEventsList = (lifecycleResponse as any).data.events;
      } else if ((lifecycleResponse as any)?.data && Array.isArray((lifecycleResponse as any).data)) {
        console.log('Lifecycle events found (format 3):', (lifecycleResponse as any).data.length);
        lifecycleEventsList = (lifecycleResponse as any).data;
      }
      setLifecycleEvents(lifecycleEventsList);

      // Set awards/certificates
      let awardsList: any[] = [];
      if ((awardsResponse as any)?.success && (awardsResponse as any).awards) {
        awardsList = (awardsResponse as any).awards;
      } else if ((awardsResponse as any)?.data?.awards) {
        awardsList = (awardsResponse as any).data.awards;
      } else if (awardsResponse?.data && Array.isArray(awardsResponse.data)) {
        awardsList = awardsResponse.data;
      }
      setAwards(awardsList);

      // Set certificates (sent via Send Certificate feature)
      let certificatesList: any[] = [];
      if ((certificatesResponse as any)?.success && (certificatesResponse as any).certificates) {
        console.log('Certificates found (format 1):', (certificatesResponse as any).certificates.length);
        certificatesList = (certificatesResponse as any).certificates;
      } else if ((certificatesResponse as any)?.data?.certificates) {
        console.log('Certificates found (format 2):', (certificatesResponse as any).data.certificates.length);
        certificatesList = (certificatesResponse as any).data.certificates;
      } else if ((certificatesResponse as any)?.data && Array.isArray((certificatesResponse as any).data)) {
        console.log('Certificates found (format 3):', (certificatesResponse as any).data.length);
        certificatesList = (certificatesResponse as any).data;
      }
      setCertificates(certificatesList);
      console.log('Certificates count:', certificatesList.length);

      // Fetch personalised modules
      try {
        const personalisedResponse = await apiService.modules.getPersonalisedModules(userId);
        if (personalisedResponse && (personalisedResponse as any).success && (personalisedResponse as any).data) {
          setPersonalisedModules((personalisedResponse as any).data);
        }
      } catch (error) {
        console.error('Error fetching personalised modules:', error);
        setPersonalisedModules([]);
      }

      // Fetch KPI scores for this user
      try {
        const kpiResponse = await apiService.kpi.getUserKPIScores(userId);
        let kpiList: any[] = [];
        if ((kpiResponse as any)?.success && (kpiResponse as any).data) {
          kpiList = Array.isArray((kpiResponse as any).data) ? (kpiResponse as any).data : [];
        } else if ((kpiResponse as any)?.data) {
          kpiList = Array.isArray((kpiResponse as any).data) ? (kpiResponse as any).data : [];
        } else if (Array.isArray(kpiResponse)) {
          kpiList = kpiResponse;
        }
        console.log('KPI Scores found:', kpiList.length);
        setKpiScores(kpiList);
      } catch (error) {
        console.error('Error fetching KPI scores:', error);
        setKpiScores([]);
      }

      console.log('===== FINAL STATE =====');
      console.log('Modules count:', mappedModules.length);
      console.log('Video progress keys:', Object.keys((progressResponse as any)?.progress || (progressResponse as any)?.data?.progress || {}).length);
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
    // Floor all values to remove decimals
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

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
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
              <p className="text-gray-600 dark:text-gray-400">Complete information about {user.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Card className="w-full min-h-screen rounded-none overflow-auto">

          {/* Header with Profile Photo */}
          <div className="flex items-start justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-600">User Details & Progress</p>
              </div>
            </div>
            {/* Profile Photo Section (Right Side - Like Resume) */}
            <div className="flex flex-col items-end gap-3">
              {/* Single Image Box - Resume Style */}
              <div className="w-28 h-28 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center overflow-hidden shadow-md relative">
                {user.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' && !imageError ? (
                  <img
                    key={user.avatar}
                    src={user.avatar.startsWith('http') ? user.avatar : `${UPLOADS_BASE_URL}${user.avatar}`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.error('❌ Image failed to load');
                      console.error('Avatar path:', user.avatar);
                      console.error('Full URL:', img.src);
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully');
                      console.log('Avatar path:', user.avatar);
                      setImageError(false);
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center absolute inset-0"
                  style={{ display: (user.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' && !imageError) ? 'none' : 'flex' }}
                >
                  <span className="text-3xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Active Badge */}
              <div className="text-center">
                <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
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
                { id: 'personalised', label: `Personalised Modules (${personalisedModules.length})`, icon: TrendingUp },
                { id: 'warnings', label: `Warnings (${warnings.length})`, icon: AlertTriangle },
                { id: 'certificates', label: `Certificates (${certificates.length})`, icon: Award },
                { id: 'lifecycle', label: 'Lifecycle Events', icon: Clock }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === id
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

                {/* Uploaded Documents Section */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                  </div>
                  {user.documents && user.documents.length > 0 ? (
                    <div className="space-y-3">
                      {user.documents.map((doc: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-sm">{doc.name}</div>
                              <div className="text-xs text-gray-500">
                                {doc.type} • {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const fileUrl = doc.filePath.startsWith('http') ? doc.filePath : `${UPLOADS_BASE_URL}${doc.filePath}`;
                              // Create a temporary anchor element to trigger download
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              link.download = doc.name;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No documents uploaded</p>
                    </div>
                  )}
                </Card>

                {/* Exit Management Information */}
                {!user.isActive && (
                  <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-red-800">Exit Information</h3>
                    </div>
                    <div className="space-y-3">
                      {user.exitDetails?.exitDate && (
                        <div>
                          <span className="text-sm text-gray-600">Exit Date:</span>
                          <div className="font-medium text-red-800">
                            {formatDate(user.exitDetails.exitDate)}
                          </div>
                        </div>
                      )}
                      {user.exitDetails?.exitReason && (
                        <div>
                          <span className="text-sm text-gray-600">Exit Reason:</span>
                          <div className="font-medium text-red-800">
                            {user.exitDetails.exitReason.mainCategory}
                            {user.exitDetails.exitReason.subCategory &&
                              ` - ${user.exitDetails.exitReason.subCategory}`
                            }
                          </div>
                        </div>
                      )}
                      {user.exitDetails?.exitReasonDescription && (
                        <div>
                          <span className="text-sm text-gray-600">Description:</span>
                          <div className="font-medium text-red-800">
                            {user.exitDetails.exitReasonDescription}
                          </div>
                        </div>
                      )}
                      {user.exitDetails?.proofDocument && (
                        <div>
                          <span className="text-sm text-gray-600">Proof Document:</span>
                          <div className="mt-1">
                            <button
                              onClick={() => {
                                apiService.users.downloadExitDocument(userId);
                                toast.success('Downloading exit document...');
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <FileQuestion className="w-4 h-4" />
                              {user.exitDetails.proofDocument.fileName || 'Download Document'}
                            </button>
                          </div>
                        </div>
                      )}
                      {user.exitDetails?.verifiedBy && (
                        <div>
                          <span className="text-sm text-gray-600">Verification Status:</span>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.exitDetails.verifiedBy === 'HR' ? 'bg-green-100 text-green-800' :
                              user.exitDetails.verifiedBy === 'Compliance' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                              {user.exitDetails.verifiedBy}
                            </span>
                            {user.exitDetails.verifiedByUser && (
                              <span className="ml-2 text-xs text-gray-600">
                                by {user.exitDetails.verifiedByUser.name}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {user.exitDetails?.remarks && (
                        <div>
                          <span className="text-sm text-gray-600">Remarks:</span>
                          <div className="font-medium text-red-800">
                            {user.exitDetails.remarks}
                          </div>
                        </div>
                      )}

                      {/* Fallback to old fields if exit details don't exist */}
                      {!user.exitDetails && (
                        <>
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
                        </>
                      )}
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
                      // Use the progress calculated by the backend (prioritizes UserProgress)
                      // module.progress is 0-1, convert to 0-100
                      const progressPercentage = Math.round((module.progress || 0) * 100);

                      // Get time details from legacy videoProgress if available, for display purposes
                      const legacyProgress = videoProgress[module.ytVideoId] || { currentTime: 0, duration: 0 };

                      return (
                        <Card key={module._id} className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Play className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-semibold text-sm truncate" title={module.title}>{module.title || 'Untitled Module'}</h4>
                              <p className="text-xs text-gray-600 truncate">{module.description || 'No description'}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-500">
                              {/* Show time based progress */}
                              <span>{legacyProgress.duration > 0 ? formatTime(legacyProgress.currentTime || (module.progress || 0) * legacyProgress.duration) : `${progressPercentage}%`}</span>
                              <span>{legacyProgress.duration > 0 ? formatTime(legacyProgress.duration) : 'Total'}</span>
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
                        {quizResults.filter(r => r.moduleId).slice(0, 5).map((result) => (
                          <div key={result._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result.passed ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                {result.passed ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{result.moduleId?.title || 'Unknown Module'}</div>
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
                    {quizAttempts.filter(a => a.moduleId).map((attempt) => (
                      <Card key={attempt._id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${attempt.passed ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                              {attempt.passed ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{attempt.moduleId?.title || 'Unknown Module'}</div>
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
                          {(attempt.violations?.length || 0) > 0 && (
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${warning.severity === 'critical' ? 'bg-red-100' :
                              warning.severity === 'high' ? 'bg-orange-100' :
                                warning.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                              }`}>
                              <AlertTriangle className={`w-4 h-4 ${warning.severity === 'critical' ? 'text-red-600' :
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

                        {warning.metadata?.attachmentUrl && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <a
                              href={warning.metadata.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              View Attachment
                            </a>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'kpi' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold dark:text-white">KPI Performance Scores</h3>
                  </div>
                  <Button
                    onClick={() => setCurrentPage('kpi-audit-dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 shrink-0"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Open KPI Dashboard
                  </Button>
                </div>

                {kpiScores.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">No KPI Scores Available</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">This user doesn't have any KPI scores recorded yet.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">KPI scores are generated when admin uploads performance data via the KPI Upload Dashboard.</p>

                    {/* Button - ALWAYS VISIBLE */}
                    <Button
                      onClick={() => setCurrentPage('kpi-audit-dashboard')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Open KPI Dashboard
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Latest KPI Score Card */}
                    {kpiScores.length > 0 && (() => {
                      const latestKPI = kpiScores[0];
                      const getRatingColor = (rating: string) => {
                        switch (rating?.toLowerCase()) {
                          case 'outstanding': return 'bg-green-100 text-green-800 border-green-200';
                          case 'excellent': return 'bg-blue-100 text-blue-800 border-blue-200';
                          case 'satisfactory': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                          case 'need improvement': return 'bg-orange-100 text-orange-800 border-orange-200';
                          case 'unsatisfactory': return 'bg-red-100 text-red-800 border-red-200';
                          default: return 'bg-gray-100 text-gray-800 border-gray-200';
                        }
                      };
                      const getScoreColor = (score: number) => {
                        if (score >= 85) return 'text-green-600';
                        if (score >= 70) return 'text-blue-600';
                        if (score >= 50) return 'text-yellow-600';
                        if (score >= 40) return 'text-orange-600';
                        return 'text-red-600';
                      };
                      return (
                        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Latest KPI Score - {latestKPI.period || 'N/A'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                              <div className={`text-4xl font-bold ${getScoreColor(latestKPI.overallScore || latestKPI.kpiScore || 0)}`}>
                                {(latestKPI.overallScore || latestKPI.kpiScore || 0).toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-600 mt-1">Overall Score</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                              <Badge className={`text-lg px-4 py-2 ${getRatingColor(latestKPI.rating)}`}>
                                {latestKPI.rating || 'N/A'}
                              </Badge>
                              <div className="text-sm text-gray-600 mt-2">Rating</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                              <div className="text-2xl font-bold text-purple-600">
                                {latestKPI.rawData?.totalCases || latestKPI.metrics?.totalCases || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">Total Cases</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                              <div className="text-lg font-medium text-gray-700">
                                {latestKPI.period || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">Period</div>
                            </div>
                          </div>

                          {/* Metrics Breakdown */}
                          {(latestKPI.metrics || latestKPI.rawData) && (
                            <div className="mt-6 pt-4 border-t border-blue-200">
                              <h5 className="font-medium text-gray-700 mb-3">Performance Metrics</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {latestKPI.metrics?.tat !== undefined && (
                                  <div className="p-3 bg-white rounded-lg text-center">
                                    <div className="text-sm text-gray-600">TAT %</div>
                                    <div className="font-bold">{latestKPI.metrics.tat.percentage || latestKPI.metrics.tat || 0}%</div>
                                  </div>
                                )}
                                {latestKPI.metrics?.majorNegativity !== undefined && (
                                  <div className="p-3 bg-white rounded-lg text-center">
                                    <div className="text-sm text-gray-600">Major Negativity</div>
                                    <div className="font-bold">{latestKPI.metrics.majorNegativity.percentage || latestKPI.metrics.majorNegativity || 0}%</div>
                                  </div>
                                )}
                                {latestKPI.metrics?.quality !== undefined && (
                                  <div className="p-3 bg-white rounded-lg text-center">
                                    <div className="text-sm text-gray-600">Quality</div>
                                    <div className="font-bold">{latestKPI.metrics.quality.percentage || latestKPI.metrics.quality || 0}%</div>
                                  </div>
                                )}
                                {latestKPI.metrics?.appUsage !== undefined && (
                                  <div className="p-3 bg-white rounded-lg text-center">
                                    <div className="text-sm text-gray-600">App Usage</div>
                                    <div className="font-bold">{latestKPI.metrics.appUsage.percentage || latestKPI.metrics.appUsage || 0}%</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })()}

                    {/* KPI History */}
                    {kpiScores.length > 1 && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-gray-600" />
                          KPI Score History
                        </h4>
                        <div className="space-y-3">
                          {kpiScores.slice(0, 6).map((kpi, index) => (
                            <div key={kpi._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium">{kpi.period || 'Unknown Period'}</div>
                                  <div className="text-sm text-gray-500">
                                    {kpi.createdAt ? formatDate(kpi.createdAt) : 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-bold text-lg">{(kpi.overallScore || kpi.kpiScore || 0).toFixed(1)}%</div>
                                </div>
                                <Badge className={`${(kpi.rating?.toLowerCase() === 'outstanding') ? 'bg-green-100 text-green-800' :
                                  (kpi.rating?.toLowerCase() === 'excellent') ? 'bg-blue-100 text-blue-800' :
                                    (kpi.rating?.toLowerCase() === 'satisfactory') ? 'bg-yellow-100 text-yellow-800' :
                                      (kpi.rating?.toLowerCase() === 'need improvement') ? 'bg-orange-100 text-orange-800' :
                                        'bg-red-100 text-red-800'
                                  }`}>
                                  {kpi.rating || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                        {kpiScores.length > 6 && (
                          <div className="text-center mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setCurrentPage('kpi-audit-dashboard')}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View All {kpiScores.length} Records →
                            </Button>
                          </div>
                        )}
                      </Card>
                    )}

                    {/* For More Info Link */}
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage('kpi-audit-dashboard')}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <TrendingUp className="w-4 h-4" />
                        For More Info - Open KPI Dashboard
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'lifecycle' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Lifecycle Events & User Information</h3>
                </div>

                {/* User Status Information */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{user.isActive ? '✓' : '✗'}</div>
                      <div className="text-sm text-gray-700 font-medium">Status</div>
                      <Badge className={user.isActive ? 'bg-green-100 text-green-800 mt-1' : 'bg-red-100 text-red-800 mt-1'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{warnings.length}</div>
                      <div className="text-sm text-gray-700 font-medium">Warnings</div>
                      <div className="text-xs text-gray-500 mt-1">Total warnings issued</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{certificates.length}</div>
                      <div className="text-sm text-gray-700 font-medium">Certificates</div>
                      <div className="text-xs text-gray-500 mt-1">Awards & certificates</div>
                    </div>
                  </div>
                </Card>

                {/* Unified Timeline */}
                <div className="space-y-3">
                  <h4 className="text-md font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Timeline
                  </h4>

                  {(() => {
                    // Merge all events into a single list
                    const allEvents = [
                      ...lifecycleEvents.map(e => ({ ...e, _source: 'lifecycle' })),
                      ...warnings.map(w => ({
                        _id: w._id,
                        title: w.title,
                        description: w.description,
                        createdAt: w.issuedAt,
                        type: 'warning',
                        category: 'negative',
                        _source: 'warning'
                      })),
                      ...certificates.map(c => ({
                        _id: c._id,
                        title: c.title || 'Certificate Issued',
                        description: c.message || c.description || 'Certificate awarded',
                        createdAt: c.createdAt || c.awardDate,
                        type: 'achievement',
                        category: 'positive',
                        _source: 'certificate'
                      })),
                      ...awards.map(a => ({
                        _id: a._id,
                        title: a.title,
                        description: a.description,
                        createdAt: a.awardDate,
                        type: 'award',
                        category: 'positive',
                        _source: 'award'
                      }))
                    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    if (allEvents.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No lifecycle events found</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {allEvents.map((event, index) => {
                          // Determine icon and color based on event type/source
                          let Icon = Clock;
                          let iconColor = 'blue';
                          let bgColor = 'blue-50';
                          let borderColor = 'blue-200';

                          if (event.type === 'achievement' || event.type === 'award' || event._source === 'certificate' || event._source === 'award') {
                            Icon = Award;
                            iconColor = 'green';
                            bgColor = 'green-50';
                            borderColor = 'green-200';
                          } else if (event.type === 'warning' || event._source === 'warning') {
                            Icon = AlertTriangle;
                            iconColor = 'red';
                            bgColor = 'red-50';
                            borderColor = 'red-200';
                          } else if (event.type === 'exit' || event.type === 'left') {
                            Icon = XCircle;
                            iconColor = 'gray';
                            bgColor = 'gray-50';
                            borderColor = 'gray-200';
                          } else if (event.type === 'reactivation') {
                            Icon = CheckCircle;
                            iconColor = 'green';
                            bgColor = 'green-50';
                            borderColor = 'green-200';
                          }

                          return (
                            <Card key={`${event._source}-${event._id}-${index}`} className={`p-4 border-${borderColor} bg-${bgColor}`}>
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 bg-${iconColor}-100 rounded-full flex items-center justify-center`}>
                                  <Icon className={`w-4 h-4 text-${iconColor}-600`} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-sm text-gray-700">{event.description}</div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge className={`bg-${iconColor}-100 text-${iconColor}-800`}>
                                      {event.type || 'Event'}
                                    </Badge>
                                    {event.category && (
                                      <Badge variant="outline">
                                        {event.category}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {formatDate(event.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Certificates & Awards</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {certificates.length} received
                  </Badge>
                </div>

                {certificates.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No certificates received yet</p>
                    <p className="text-xs text-gray-400 mt-2">Certificates will appear here when sent to this user</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificates.map((cert: any) => (
                      <Card key={cert._id} className="p-4 border-green-200 bg-green-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Award className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-green-800">{cert.title || 'Certificate'}</div>
                              <div className="text-sm text-green-700">{cert.message || cert.description || 'Training completion certificate'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800">
                              {cert.type || 'Certificate'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-green-700">
                          <span>Issued: {cert.createdAt ? formatDate(cert.createdAt) : 'N/A'}</span>
                          {cert.sentBy && (
                            <span>By: {typeof cert.sentBy === 'object' ? cert.sentBy.name : 'Admin'}</span>
                          )}
                          <Badge className="bg-green-200 text-green-800">Sent</Badge>
                        </div>

                        {/* Show attachment if available - check both attachments array and attachment field */}
                        {(cert.attachments && cert.attachments.length > 0) || cert.attachment ? (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <a
                              href={(() => {
                                // Check attachments array first (new format)
                                if (cert.attachments && cert.attachments.length > 0) {
                                  const filePath = cert.attachments[0].filePath;
                                  return filePath.startsWith('http') ? filePath : `${UPLOADS_BASE_URL}${filePath}`;
                                }
                                // Fallback to attachment field (old format)
                                if (cert.attachment) {
                                  return cert.attachment.startsWith('http') ? cert.attachment : `${UPLOADS_BASE_URL}${cert.attachment}`;
                                }
                                return '#';
                              })()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-green-600 hover:text-green-800 hover:underline text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              View Attachment
                              {cert.attachments && cert.attachments.length > 0 && cert.attachments[0].fileName && (
                                <span className="text-xs text-gray-500">({cert.attachments[0].fileName})</span>
                              )}
                            </a>
                          </div>
                        ) : null}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'personalised' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Personalised Modules</h3>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {personalisedModules.length} assigned
                  </Badge>
                </div>

                {personalisedModules.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No personalised modules assigned</p>
                    <p className="text-xs text-gray-400 mt-2">This user has no special training modules assigned</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {personalisedModules.map((module) => {
                      const progressPercent = Math.round((module.progress || 0) * 100);
                      const isCompleted = progressPercent >= 95;

                      return (
                        <Card key={module._id} className={`p-4 ${isCompleted ? 'border-2 border-green-400' : 'border-2 border-purple-300'}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-bold text-sm">P</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="font-medium">{module.title}</div>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  Personalised
                                </Badge>
                                {isCompleted && (
                                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Completed
                                  </Badge>
                                )}
                              </div>

                              <div className="text-sm text-gray-600 mb-2">{module.description}</div>

                              {/* Personalisation Details */}
                              <div className="bg-purple-50 p-3 rounded-lg mb-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <strong className="text-purple-700">Reason:</strong>
                                    <div className="text-purple-600">{(module as any).personalisedReason || 'Special training assignment'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-purple-700">Priority:</strong>
                                    <div className="text-purple-600 capitalize">{(module as any).personalisedPriority || 'medium'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-purple-700">Assigned By:</strong>
                                    <div className="text-purple-600">{(module as any).personalisedBy?.name || 'Admin'}</div>
                                  </div>
                                  <div>
                                    <strong className="text-purple-700">Assigned Date:</strong>
                                    <div className="text-purple-600">
                                      {formatDate((module as any).personalisedAt || module.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Progress */}
                              <div className="mb-3">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{progressPercent}%</span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                              </div>

                              {/* Module Stats */}
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center p-2 bg-gray-50 rounded">
                                  <div className="font-semibold text-gray-700">Video</div>
                                  <div className="text-gray-600">{progressPercent >= 95 ? 'Completed' : 'In Progress'}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded">
                                  <div className="font-semibold text-gray-700">Quiz</div>
                                  <div className="text-gray-600">{module.hasQuiz ? 'Available' : 'N/A'}</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded">
                                  <div className="font-semibold text-gray-700">Status</div>
                                  <div className="text-gray-600">{isCompleted ? 'Completed' : 'Active'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div >
    </div >
  );
};
