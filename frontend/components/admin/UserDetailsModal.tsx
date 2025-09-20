import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { X, User, Mail, Phone, Clock, CheckCircle, Play, FileQuestion, Award, Target, TrendingUp } from 'lucide-react';
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
  };
  isOpen: boolean;
  onClose: () => void;
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

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const [videoProgress, setVideoProgress] = useState<VideoProgress>({});
  const [modules, setModules] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'quiz'>('details');

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
      
      // Fetch user's video progress, modules, and quiz results in parallel
      const [progressResponse, modulesResponse, quizResultsResponse] = await Promise.all([
        apiService.progress.getUserProgress(user._id),
        apiService.modules.getAllModules(),
        apiService.quizzes.getQuizResults(user._id).catch(() => ({ data: { results: [] } }))
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

  if (!isOpen) return null;

  // Safety check for required user properties
  if (!user || !user._id || !user.name || !user.email) {
    console.error('UserDetailsModal: Invalid user object', user);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Full Name</p>
                          <p className="font-medium">{user.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{user.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {user.employeeId && (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 text-gray-500">🆔</div>
                          <div>
                            <p className="text-sm text-gray-600">Employee ID</p>
                            <p className="font-medium">{user.employeeId}</p>
                          </div>
                        </div>
                      )}
                      
                      {user.department && (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 text-gray-500">🏢</div>
                          <div>
                            <p className="text-sm text-gray-600">Department</p>
                            <p className="font-medium">{user.department}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 text-gray-500">📊</div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge 
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                            className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {user.status === 'active' ? 'Active' : user.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
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
