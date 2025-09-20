import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { BarChart3, Eye, CheckCircle, Clock, Play, FileQuestion, Target, Award } from 'lucide-react';
import { apiService } from '../services/apiService';
import { toast } from 'sonner';

interface UserStatsProps {
  userId: string;
}

interface ProgressData {
  [videoId: string]: {
    currentTime: number;
    duration: number;
  };
}

interface UserProgressResponse {
  success: boolean;
  userId: string;
  progress: ProgressData;
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
  attemptNumber: number;
  completedAt: string;
}

export const UserStats: React.FC<UserStatsProps> = ({ userId }) => {
  const [progressData, setProgressData] = useState<ProgressData>({});
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'progress' | 'quizzes'>('progress');

  // Fetch user progress and quiz results from backend
  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const [progressResponse, quizResponse] = await Promise.allSettled([
        apiService.progress.getUserProgress(userId),
        apiService.quizzes.getQuizResults(userId)
      ]);
      
      if (progressResponse.status === 'fulfilled' && progressResponse.value?.success) {
        setProgressData(progressResponse.value.progress || {});
      }
      
      if (quizResponse.status === 'fulfilled' && quizResponse.value?.success) {
        setQuizResults(quizResponse.value.results || []);
      }
      
      setShowStats(true);
      toast.success('User stats loaded successfully!');
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load user stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate watched percentage for a video
  const calculateWatchedPercentage = (currentTime: number, duration: number): number => {
    if (duration === 0) return 0;
    return Math.round((currentTime / duration) * 100);
  };

  // Check if video is completed (watched 90% or more)
  const isVideoCompleted = (currentTime: number, duration: number): boolean => {
    return calculateWatchedPercentage(currentTime, duration) >= 90;
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get total statistics
  const getTotalStats = () => {
    const videoIds = Object.keys(progressData);
    const totalVideos = videoIds.length;
    const completedVideos = videoIds.filter(videoId => {
      const progress = progressData[videoId];
      return isVideoCompleted(progress.currentTime, progress.duration);
    }).length;
    
    const totalWatchTime = videoIds.reduce((total, videoId) => {
      const progress = progressData[videoId];
      return total + progress.currentTime;
    }, 0);
    
    const totalDuration = videoIds.reduce((total, videoId) => {
      const progress = progressData[videoId];
      return total + progress.duration;
    }, 0);
    
    const averageProgress = totalVideos > 0 
      ? Math.round(videoIds.reduce((total, videoId) => {
          const progress = progressData[videoId];
          return total + calculateWatchedPercentage(progress.currentTime, progress.duration);
        }, 0) / totalVideos)
      : 0;

    return {
      totalVideos,
      completedVideos,
      totalWatchTime,
      totalDuration,
      averageProgress
    };
  };

  // Get quiz statistics
  const getQuizStats = () => {
    const totalQuizzes = quizResults.length;
    const passedQuizzes = quizResults.filter(result => result.passed).length;
    const averageScore = totalQuizzes > 0 
      ? Math.round(quizResults.reduce((total, result) => total + result.percentage, 0) / totalQuizzes)
      : 0;
    const totalAttempts = quizResults.reduce((total, result) => total + result.attemptNumber, 0);

    return {
      totalQuizzes,
      passedQuizzes,
      averageScore,
      totalAttempts
    };
  };

  const stats = getTotalStats();
  const quizStats = getQuizStats();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">User Statistics</h2>
        </div>
        
        <Button
          onClick={fetchUserStats}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Show Stats
            </div>
          )}
        </Button>
      </div>

      {/* Tab Navigation */}
      {showStats && (
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'progress' ? 'default' : 'outline'}
            onClick={() => setActiveTab('progress')}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Video Progress
          </Button>
          <Button
            variant={activeTab === 'quizzes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('quizzes')}
            className="flex items-center gap-2"
          >
            <FileQuestion className="w-4 h-4" />
            Quiz Results
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {activeTab === 'progress' ? (
            <>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalVideos}</div>
                <div className="text-sm text-blue-700">Total Videos</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.completedVideos}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</div>
                <div className="text-sm text-purple-700">Avg Progress</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(stats.totalWatchTime)}
                </div>
                <div className="text-sm text-orange-700">Total Watch Time</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{quizStats.totalQuizzes}</div>
                <div className="text-sm text-blue-700">Quizzes Taken</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{quizStats.passedQuizzes}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{quizStats.averageScore}%</div>
                <div className="text-sm text-purple-700">Avg Score</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {quizStats.totalAttempts}
                </div>
                <div className="text-sm text-orange-700">Total Attempts</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Content based on active tab */}
      {showStats && (
        <>
          {activeTab === 'progress' ? (
            /* Video Progress Table */
            Object.keys(progressData).length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Video Progress Details</h3>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Video ID</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Watched</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(progressData).map(([videoId, progress]) => {
                      const watchedPercentage = calculateWatchedPercentage(progress.currentTime, progress.duration);
                      const completed = isVideoCompleted(progress.currentTime, progress.duration);
                      
                      return (
                        <TableRow key={videoId}>
                          <TableCell className="font-mono text-sm">{videoId}</TableCell>
                          
                          <TableCell className="w-48">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>{watchedPercentage}%</span>
                                <span>{formatTime(progress.currentTime)} / {formatTime(progress.duration)}</span>
                              </div>
                              <Progress value={watchedPercentage} className="h-2" />
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{formatTime(progress.currentTime)}</div>
                              <div className="text-gray-500">of {formatTime(progress.duration)}</div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {formatTime(progress.duration)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge 
                              variant={completed ? 'default' : 'secondary'}
                              className={completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                            >
                              <div className="flex items-center gap-1">
                                {completed ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    In Progress
                                  </>
                                )}
                              </div>
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Watch
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Progress Data</p>
                <p className="text-sm">Start watching YouTube videos to see your progress here.</p>
              </div>
            )
          ) : (
            /* Quiz Results Table */
            quizResults.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Quiz Results Details</h3>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Time Taken</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizResults.map((result) => (
                      <TableRow key={result._id}>
                        <TableCell>
                          <div className="font-medium">{result.moduleId.title}</div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{result.score}/{result.total}</div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={result.percentage} className="w-16 h-2" />
                            <span className="text-sm font-medium">{result.percentage}%</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {formatTime(result.timeTaken)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            #{result.attemptNumber}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <Badge 
                            variant={result.passed ? 'default' : 'secondary'}
                            className={result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            <div className="flex items-center gap-1">
                              {result.passed ? (
                                <>
                                  <Award className="w-3 h-3" />
                                  Passed
                                </>
                              ) : (
                                <>
                                  <Target className="w-3 h-3" />
                                  Failed
                                </>
                              )}
                            </div>
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(result.completedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileQuestion className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Quiz Results</p>
                <p className="text-sm">Complete quizzes to see your results here.</p>
              </div>
            )
          )}
        </>
      )}

      {/* Instructions */}
      {!showStats && (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Ready to View Stats?</p>
          <p className="text-sm">Click the "Show Stats" button to load user statistics.</p>
        </div>
      )}
    </Card>
  );
};
