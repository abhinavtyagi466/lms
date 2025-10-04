import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { X, User, Mail, Phone, Clock, CheckCircle, Play, FileQuestion, Award, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface UserDetailsModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    employeeId?: string;
    department?: string;
    // Personal data fields
    address?: string;
    location?: string;
    city?: string;
    state?: string;
    aadhaarNo?: string;
    panNo?: string;
    manager?: string;
    kpiScore?: number;
    lastLogin?: string;
    isActive?: boolean;
    inactiveReason?: string;
    inactiveRemark?: string;
    inactiveDate?: string;
    inactiveBy?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  isFullScreen?: boolean; // New prop for full screen mode
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
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
  completedAt: string;
  attemptNumber: number;
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

interface Warning {
  _id: string;
  userId: string;
  type: string;
  title: string;
  reason: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'closed' | 'cancelled';
  document?: string;
  documentName?: string;
  actionRequired?: string;
  dueDate?: string;
  completedDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface LifecycleEvent {
  _id: string;
  userId: string;
  type: 'joined' | 'training' | 'audit' | 'warning' | 'achievement' | 'exit';
  title: string;
  description: string;
  category: 'milestone' | 'positive' | 'negative' | 'neutral';
  attachments?: Array<{
    type: string;
    path: string;
    name: string;
    uploadedAt: string;
  }>;
  metadata?: any;
  createdBy?: string;
  createdAt: string;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  isFullScreen = false
}) => {
  const [videoProgress, setVideoProgress] = useState<VideoProgress>({});
  const [modules, setModules] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [quizAttemptStats, setQuizAttemptStats] = useState<QuizAttemptStats | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'quiz' | 'attempts' | 'warnings' | 'lifecycle'>('details');

  useEffect(() => {
    if (isOpen && user && user._id) {
      console.log('UserDetailsModal: Opening with user:', user);
      fetchUserData();
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    if (!user || !user._id) return;
    
    try {
      setLoading(true);
      console.log('UserDetailsModal: Fetching data for user:', user._id);
      
      // Fetch user's video progress, modules, quiz results, quiz attempts, warnings, and lifecycle events in parallel
      const [progressResponse, modulesResponse, quizResultsResponse, quizStatsResponse, quizAttemptsResponse, warningsResponse, lifecycleResponse] = await Promise.all([
        apiService.progress.getUserProgress(user._id),
        apiService.modules.getUserModules(user._id), // Fixed: Use getUserModules instead of getAllModules
        apiService.quizzes.getQuizResults(user._id).catch(() => ({ data: { results: [] } })),
        apiService.quizAttempts.getQuizAttemptStats(user._id).catch(() => ({ data: null })),
        apiService.quizAttempts.getUserQuizAttempts(user._id, { limit: 20 }).catch(() => ({ data: [] })),
        apiService.users.getUserWarnings(user._id).catch(() => ({ data: { warnings: [] } })),
        apiService.lifecycle.getUserLifecycle(user._id, { limit: 20 }).catch(() => ({ data: { events: [] } }))
      ]);

      console.log('UserDetailsModal: Progress response:', progressResponse);
      console.log('UserDetailsModal: Modules response:', modulesResponse);
      console.log('UserDetailsModal: Quiz results response:', quizResultsResponse);

      // Set video progress
      if (progressResponse?.data?.success && progressResponse.data.progress) {
        console.log('UserDetailsModal: Setting video progress:', progressResponse.data.progress);
        setVideoProgress(progressResponse.data.progress);
      } else if (progressResponse?.data?.progress) {
        console.log('UserDetailsModal: Setting video progress from data.progress:', progressResponse.data.progress);
        setVideoProgress(progressResponse.data.progress);
      } else if (progressResponse?.progress) {
        console.log('UserDetailsModal: Setting video progress from progress:', progressResponse.progress);
        setVideoProgress(progressResponse.progress);
      } else {
        console.log('UserDetailsModal: No progress data found in response');
        console.log('UserDetailsModal: Full progress response:', progressResponse);
        setVideoProgress({});
      }

      // Set modules
      if (modulesResponse?.data?.modules) {
        console.log('UserDetailsModal: Setting modules from data.modules:', modulesResponse.data.modules);
        setModules(modulesResponse.data.modules);
      } else if (modulesResponse?.modules) {
        console.log('UserDetailsModal: Setting modules from modules:', modulesResponse.modules);
        setModules(modulesResponse.modules);
      } else {
        console.log('UserDetailsModal: No modules data found in response');
        setModules([]);
      }

      // Set quiz results
      if (quizResultsResponse?.data?.results) {
        console.log('UserDetailsModal: Setting quiz results from data.results:', quizResultsResponse.data.results);
        setQuizResults(quizResultsResponse.data.results);
      } else if (quizResultsResponse?.results) {
        console.log('UserDetailsModal: Setting quiz results from results:', quizResultsResponse.results);
        setQuizResults(quizResultsResponse.results);
      } else {
        console.log('UserDetailsModal: No quiz results data found in response');
        setQuizResults([]);
      }

      // Set quiz attempt stats
      if (quizStatsResponse?.data) {
        console.log('UserDetailsModal: Setting quiz attempt stats:', quizStatsResponse.data);
        setQuizAttemptStats(quizStatsResponse.data);
      } else {
        setQuizAttemptStats(null);
      }

      // Set quiz attempts
      if (quizAttemptsResponse?.data) {
        console.log('UserDetailsModal: Setting quiz attempts:', quizAttemptsResponse.data);
        setQuizAttempts(quizAttemptsResponse.data);
      } else {
        setQuizAttempts([]);
      }

      // Set warnings
      if (warningsResponse?.data?.warnings) {
        console.log('UserDetailsModal: Setting warnings:', warningsResponse.data.warnings);
        setWarnings(warningsResponse.data.warnings);
      } else {
        setWarnings([]);
      }

      // Set lifecycle events
      if (lifecycleResponse?.data?.events) {
        console.log('UserDetailsModal: Setting lifecycle events:', lifecycleResponse.data.events);
        setLifecycleEvents(lifecycleResponse.data.events);
      } else {
        setLifecycleEvents([]);
      }

    } catch (error) {
      console.error('UserDetailsModal: Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage for a video
  const getProgressPercentage = (currentTime: number, duration: number): number => {
    if (duration === 0) return 0;
    return Math.round((currentTime / duration) * 100);
  };

  // Check if video is completed
  const isVideoCompleted = (currentTime: number, duration: number): boolean => {
    return getProgressPercentage(currentTime, duration) >= 95;
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get module title by video ID
  const getModuleTitle = (videoId: string): string => {
    const module = modules.find(m => m.ytVideoId === videoId);
    return module?.title || `Video ${videoId}`;
  };

  // Format quiz completion date
  const formatQuizDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format quiz time taken
  const formatQuizTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Calculate quiz statistics
  const getQuizStats = () => {
    if (quizResults.length === 0) return null;
    
    const totalQuizzes = quizResults.length;
    const passedQuizzes = quizResults.filter(result => result.passed).length;
    const averageScore = Math.round(quizResults.reduce((sum, result) => sum + result.percentage, 0) / totalQuizzes);
    const totalTimeSpent = quizResults.reduce((sum, result) => sum + result.timeTaken, 0);
    
    return {
      totalQuizzes,
      passedQuizzes,
      failedQuizzes: totalQuizzes - passedQuizzes,
      averageScore,
      totalTimeSpent,
      passRate: Math.round((passedQuizzes / totalQuizzes) * 100)
    };
  };

  if (!isOpen && !isFullScreen) return null;

  // Safety check for required user properties
  if (!user || !user._id || !user.name || !user.email) {
    console.error('UserDetailsModal: Invalid user object', user);
    return null;
  }

  return (
<div className="w-full min-h-screen bg-gray-50">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            User Details
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Video Progress
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'quiz'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Quiz Stats
          </button>
          <button
            onClick={() => setActiveTab('attempts')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'attempts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Quiz Attempts
          </button>
          <button
            onClick={() => setActiveTab('warnings')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'warnings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Warnings ({warnings.length})
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'lifecycle'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Lifecycle Events
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* User Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2 text-blue-600" />
                        Basic Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {user.name}</div>
                        <div><span className="font-medium">Email:</span> {user.email}</div>
                        <div><span className="font-medium">Phone:</span> {user.phone || 'Not provided'}</div>
                        <div><span className="font-medium">Employee ID:</span> {user.employeeId || 'Not assigned'}</div>
                        <div><span className="font-medium">Department:</span> {user.department || 'Not assigned'}</div>
                        <div><span className="font-medium">Manager:</span> {user.manager || 'Not assigned'}</div>
                        <div><span className="font-medium">Status:</span> 
                          <Badge className={`ml-2 ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' :
                            user.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                            user.status === 'Audited' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </Badge>
                        </div>
                        <div><span className="font-medium">KPI Score:</span> {user.kpiScore || 0}%</div>
                        <div><span className="font-medium">Last Login:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</div>
                        <div><span className="font-medium">Account Status:</span> 
                          <Badge className={`ml-2 ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-green-600" />
                        Personal Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Address:</span> {user.address || 'Not provided'}</div>
                        <div><span className="font-medium">Location:</span> {user.location || 'Not provided'}</div>
                        <div><span className="font-medium">City:</span> {user.city || 'Not provided'}</div>
                        <div><span className="font-medium">State:</span> {user.state || 'Not provided'}</div>
                        <div><span className="font-medium">PAN Number:</span> {user.panNo || 'Not provided'}</div>
                        <div><span className="font-medium">Aadhaar Number:</span> {user.aadhaarNo || 'Not provided'}</div>
                        <div><span className="font-medium">Created:</span> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</div>
                        <div><span className="font-medium">Last Updated:</span> {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Unknown'}</div>
                      </div>
                    </Card>
                  </div>

                  {/* Inactive Status Information */}
                  {user.status === 'Inactive' && (
                    <Card className="p-4 border-red-200 bg-red-50">
                      <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                        Inactive Status Details
                      </h4>
                      <div className="space-y-2 text-sm text-red-700">
                        <div><span className="font-medium">Reason:</span> {user.inactiveReason || 'Not specified'}</div>
                        <div><span className="font-medium">Remark:</span> {user.inactiveRemark || 'No remarks provided'}</div>
                        <div><span className="font-medium">Inactive Date:</span> {user.inactiveDate ? new Date(user.inactiveDate).toLocaleString() : 'Unknown'}</div>
                        <div><span className="font-medium">Inactive By:</span> {user.inactiveBy || 'Unknown'}</div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Video Progress Tab */}
              {activeTab === 'progress' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Video Learning Progress</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {Object.keys(videoProgress).length} videos started
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchUserData}
                        disabled={loading}
                        className="text-xs"
                      >
                        {loading ? 'Loading...' : 'Refresh'}
                      </Button>
                    </div>
                  </div>

                  {Object.keys(videoProgress).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(videoProgress).map(([videoId, progress]) => {
                        const progressPercentage = getProgressPercentage(progress.currentTime, progress.duration);
                        const completed = isVideoCompleted(progress.currentTime, progress.duration);
                        const moduleTitle = getModuleTitle(videoId);
                        
                        return (
                          <Card key={videoId} className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{moduleTitle}</h4>
                                <p className="text-sm text-gray-600">Video ID: {videoId}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {completed ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    <Play className="w-3 h-3 mr-1" />
                                    In Progress
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">{progressPercentage}%</span>
                              </div>
                              
                              <Progress value={progressPercentage} className="h-2" />
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>
                                  {formatTime(progress.currentTime)} / {formatTime(progress.duration)} watched
                                </span>
                                <span>
                                  {completed ? '✓ All done!' : `${100 - progressPercentage}% remaining`}
                                </span>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No Video Progress</p>
                      <p className="text-sm mb-2">This user hasn't started any training videos yet.</p>
                      <p className="text-xs text-gray-400">
                        Progress will appear here once the user starts watching training modules.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Stats Tab */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Quiz Performance</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {quizResults.length} quiz{quizResults.length !== 1 ? 'es' : ''} completed
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchUserData}
                        disabled={loading}
                        className="text-xs"
                      >
                        {loading ? 'Loading...' : 'Refresh'}
                      </Button>
                    </div>
                  </div>

                  {/* Quiz Statistics Summary */}
                  {quizResults.length > 0 && (() => {
                    const stats = getQuizStats();
                    return stats ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4 text-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <FileQuestion className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-2xl font-bold text-blue-600">{stats.totalQuizzes}</div>
                          <div className="text-sm text-gray-600">Total Quizzes</div>
                        </Card>
                        
                        <Card className="p-4 text-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="text-2xl font-bold text-green-600">{stats.passedQuizzes}</div>
                          <div className="text-sm text-gray-600">Passed</div>
                        </Card>
                        
                        <Card className="p-4 text-center">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="text-2xl font-bold text-orange-600">{stats.averageScore}%</div>
                          <div className="text-sm text-gray-600">Average Score</div>
                        </Card>
                        
                        <Card className="p-4 text-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Target className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="text-2xl font-bold text-purple-600">{stats.passRate}%</div>
                          <div className="text-sm text-gray-600">Pass Rate</div>
                        </Card>
                      </div>
                    ) : null;
                  })()}

                  {/* Quiz Results List */}
                  {quizResults.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Quiz Attempts</h4>
                      {quizResults.map((result, index) => (
                        <Card key={result._id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">
                                {result.moduleId?.title || `Module ${result.moduleId?._id || 'Unknown'}`}
                              </h5>
                              <p className="text-sm text-gray-600">
                                Attempt #{result.attemptNumber} • Completed {formatQuizDate(result.completedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {result.passed ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Passed
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  <X className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Score:</span>
                              <div className="font-medium">{result.score}/{result.total}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Percentage:</span>
                              <div className="font-medium">{result.percentage}%</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Time Taken:</span>
                              <div className="font-medium">{formatQuizTime(result.timeTaken)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <div className="font-medium">
                                {result.passed ? (
                                  <span className="text-green-600">✓ Passed</span>
                                ) : (
                                  <span className="text-red-600">✗ Failed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileQuestion className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No Quiz Attempts</p>
                      <p className="text-sm mb-2">This user hasn't completed any quizzes yet.</p>
                      <p className="text-xs text-gray-400">
                        Quiz results will appear here once the user completes training modules and takes quizzes.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Attempts Tab */}
              {activeTab === 'attempts' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Quiz Attempts & Violations</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUserData}
                      disabled={loading}
                      className="text-xs"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>

                  {/* Quiz Attempt Statistics */}
                  {quizAttemptStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="p-4 text-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <FileQuestion className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{quizAttemptStats.totalAttempts}</div>
                        <div className="text-sm text-gray-600">Total Attempts</div>
                      </Card>
                      
                      <Card className="p-4 text-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">{quizAttemptStats.totalQuizzes}</div>
                        <div className="text-sm text-gray-600">Quizzes Taken</div>
                      </Card>
                      
                      <Card className="p-4 text-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold text-orange-600">{Math.round(quizAttemptStats.averageScore)}%</div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </Card>
                      
                      <Card className="p-4 text-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{Math.round(quizAttemptStats.passRate)}%</div>
                        <div className="text-sm text-gray-600">Pass Rate</div>
                      </Card>
                    </div>
                  )}

                  {/* Violations Alert */}
                  {quizAttemptStats && quizAttemptStats.violations > 0 && (
                    <Card className="p-4 border-red-200 bg-red-50">
                      <div className="flex items-center text-red-600">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span className="font-medium">
                          {quizAttemptStats.violations} Quiz Violation(s) Detected
                        </span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        This user has violated quiz integrity rules. Review the detailed attempts below.
                      </p>
                    </Card>
                  )}

                  {/* Detailed Quiz Attempts */}
                  {quizAttempts.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Detailed Attempt History</h4>
                      {quizAttempts.map((attempt) => (
                        <Card key={attempt._id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">
                                {attempt.moduleId?.title || `Module ${attempt.moduleId?._id || 'Unknown'}`}
                              </h5>
                              <p className="text-sm text-gray-600">
                                Attempt #{attempt.attemptNumber} • Started {new Date(attempt.startTime).toLocaleString()}
                                {attempt.endTime && ` • Completed ${new Date(attempt.endTime).toLocaleString()}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {attempt.passed ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Passed
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  <X className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className={`${
                                  attempt.status === 'violation' 
                                    ? 'border-red-300 text-red-700 bg-red-50' 
                                    : attempt.status === 'completed'
                                    ? 'border-green-300 text-green-700 bg-green-50'
                                    : 'border-gray-300 text-gray-700 bg-gray-50'
                                }`}
                              >
                                {attempt.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Score:</span>
                              <div className="font-medium">{attempt.score}%</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Time Spent:</span>
                              <div className="font-medium">{Math.round(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <div className="font-medium">
                                {attempt.passed ? (
                                  <span className="text-green-600">✓ Passed</span>
                                ) : (
                                  <span className="text-red-600">✗ Failed</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Violations:</span>
                              <div className="font-medium">
                                {attempt.violations.length > 0 ? (
                                  <span className="text-red-600">{attempt.violations.length}</span>
                                ) : (
                                  <span className="text-green-600">0</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Violations Details */}
                          {attempt.violations.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <h6 className="font-medium text-red-800 mb-2">Violations Detected:</h6>
                              {attempt.violations.map((violation, idx) => (
                                <div key={idx} className="text-sm text-red-700 mb-1">
                                  <span className="font-medium">{violation.type}:</span> {violation.description}
                                  <span className="text-xs text-red-600 ml-2">
                                    ({new Date(violation.timestamp).toLocaleString()})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileQuestion className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No Quiz Attempts</p>
                      <p className="text-sm mb-2">This user hasn't attempted any quizzes yet.</p>
                      <p className="text-xs text-gray-400">
                        Quiz attempt details will appear here once the user starts taking quizzes.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Warnings Tab */}
              {activeTab === 'warnings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Warnings & Disciplinary Records</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUserData}
                      disabled={loading}
                      className="text-xs"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>

                  {warnings.length > 0 ? (
                    <div className="space-y-4">
                      {warnings.map((warning) => (
                        <Card key={warning._id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">{warning.title}</h5>
                              <p className="text-sm text-gray-600 mb-2">{warning.reason}</p>
                              {warning.description && (
                                <p className="text-sm text-gray-700 mb-2">{warning.description}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Created: {new Date(warning.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={`${
                                  warning.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                  warning.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                  warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {warning.severity}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={`${
                                  warning.status === 'completed' ? 'border-green-300 text-green-700 bg-green-50' :
                                  warning.status === 'pending' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                                  'border-gray-300 text-gray-700 bg-gray-50'
                                }`}
                              >
                                {warning.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <div className="font-medium">{warning.type}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Due Date:</span>
                              <div className="font-medium">
                                {warning.dueDate ? new Date(warning.dueDate).toLocaleDateString() : 'Not set'}
                              </div>
                            </div>
                            {warning.actionRequired && (
                              <div className="md:col-span-2">
                                <span className="text-gray-600">Action Required:</span>
                                <div className="font-medium">{warning.actionRequired}</div>
                              </div>
                            )}
                            {warning.completedDate && (
                              <div>
                                <span className="text-gray-600">Completed:</span>
                                <div className="font-medium">{new Date(warning.completedDate).toLocaleDateString()}</div>
                              </div>
                            )}
                          </div>

                          {warning.documentName && (
                            <div className="mt-3 p-2 bg-gray-50 rounded border">
                              <span className="text-sm text-gray-600">Document: </span>
                              <span className="text-sm font-medium">{warning.documentName}</span>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No Warnings</p>
                      <p className="text-sm mb-2">This user has no warning records.</p>
                      <p className="text-xs text-gray-400">
                        Warning records will appear here if any disciplinary actions are taken.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Lifecycle Events Tab */}
              {activeTab === 'lifecycle' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Lifecycle Events</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUserData}
                      disabled={loading}
                      className="text-xs"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>

                  {lifecycleEvents.length > 0 ? (
                    <div className="space-y-4">
                      {lifecycleEvents.map((event) => (
                        <Card key={event._id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">{event.title}</h5>
                              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={`${
                                  event.category === 'positive' ? 'bg-green-100 text-green-800' :
                                  event.category === 'negative' ? 'bg-red-100 text-red-800' :
                                  event.category === 'milestone' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {event.category}
                              </Badge>
                              <Badge variant="outline">
                                {event.type}
                              </Badge>
                            </div>
                          </div>

                          {event.attachments && event.attachments.length > 0 && (
                            <div className="mt-3 p-2 bg-gray-50 rounded border">
                              <span className="text-sm text-gray-600">Attachments:</span>
                              <div className="mt-1 space-y-1">
                                {event.attachments.map((attachment, idx) => (
                                  <div key={idx} className="text-sm">
                                    <span className="font-medium">{attachment.name}</span>
                                    <span className="text-gray-500 ml-2">({attachment.type})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No Lifecycle Events</p>
                      <p className="text-sm mb-2">This user has no lifecycle events recorded.</p>
                      <p className="text-xs text-gray-400">
                        Lifecycle events track important milestones and activities in the user's journey.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};
