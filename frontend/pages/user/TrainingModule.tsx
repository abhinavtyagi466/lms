import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle,
  ArrowLeft,
  FileQuestion,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { YouTubePlayer } from '../../components/YouTubePlayer';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';

export const TrainingModule: React.FC = () => {
  const { user, selectedModuleId, setCurrentPage } = useAuth();

  const [module, setModule] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showQuizButton, setShowQuizButton] = useState(false);
  const [initialVideoTime, setInitialVideoTime] = useState(0);
  const [playerKey, setPlayerKey] = useState(0); // Key to force player remount on restart

  useEffect(() => {
    console.log('TrainingModule: useEffect triggered with selectedModuleId:', selectedModuleId);
    if (selectedModuleId) {
      loadRealModuleData();
    } else {
      console.log('TrainingModule: No selectedModuleId, showing error');
      setLoading(false);
      setModule(null);
    }
  }, [selectedModuleId]);

  // Load REAL module data from API - no more dummy data
  const loadRealModuleData = async () => {
    try {
      setLoading(true);
      console.log('TrainingModule: Loading module ID:', selectedModuleId);

      // Load module, quiz, and user progress data
      const assignmentId = localStorage.getItem('currentAssignmentId') || undefined;
      const userId = (user as any)?._id || (user as any)?.id;

      const [moduleResponse, quizResponse, progressResponse] = await Promise.allSettled([
        apiService.modules.getModule(selectedModuleId!),
        apiService.quizzes.getQuiz(selectedModuleId!).catch(() => null),
        userId ? apiService.userProgress.getUserProgress(userId, selectedModuleId!, assignmentId).catch(() => null) : Promise.resolve(null)
      ]);

      console.log('Module response:', moduleResponse);
      console.log('Quiz response:', quizResponse);
      console.log('Progress response:', progressResponse);

      // Handle module response
      let moduleData = null;
      if (moduleResponse.status === 'fulfilled' && moduleResponse.value) {
        const response = moduleResponse.value as any;
        if (response.data) {
          moduleData = response.data;
        } else if (response.module) {
          moduleData = response.module;
        } else if (response.success && response.module) {
          moduleData = response.module;
        } else if (typeof response === 'object' && !response.data) {
          moduleData = response;
        }
      }

      // Handle quiz response
      let quizData = null;
      if (quizResponse.status === 'fulfilled' && quizResponse.value) {
        const response = quizResponse.value as any;
        if (response.data) {
          quizData = response.data;
        } else if (response.quiz) {
          quizData = response.quiz;
        } else if (response.success && response.quiz) {
          quizData = response.quiz;
        }
      }

      // Handle progress response
      let initialTime = 0;
      if (progressResponse.status === 'fulfilled' && progressResponse.value) {
        const response = progressResponse.value as any;
        if (response && response.userProgress) {
          // Use lastVideoPosition if available
          if (response.userProgress.lastVideoPosition) {
            initialTime = response.userProgress.lastVideoPosition;
          }

          // If video is completed (>= 99%), start from 0
          if (response.userProgress.videoProgress >= 99) {
            initialTime = 0;
          }
        }
      }
      setInitialVideoTime(initialTime);

      console.log('Extracted module data:', moduleData);
      console.log('Extracted quiz data:', quizData);
      console.log('Calculated initial time:', initialTime);

      if (moduleData) {
        // Check if we have either a video ID or a full YouTube URL
        const hasVideoContent = moduleData.ytVideoId && (
          moduleData.ytVideoId.includes('youtube.com') ||
          moduleData.ytVideoId.includes('youtu.be') ||
          /^[a-zA-Z0-9_-]{11}$/.test(moduleData.ytVideoId)
        );

        if (hasVideoContent) {
          setModule(moduleData);
          setQuiz(quizData);
          console.log('Module loaded successfully:', moduleData);
          console.log('Quiz loaded successfully:', quizData);
        } else {
          console.error('No valid video content found:', moduleData.ytVideoId);
          toast.error('Module has no valid video content. Please check the video URL.');
          setModule(null);
        }
      } else {
        console.error('No module data received');
        console.error('Full response:', moduleResponse);
        toast.error('Failed to load module data. Please check if the backend is running.');
        setModule(null);
      }

    } catch (error) {
      console.error('Error loading module:', error);
      toast.error('Failed to load module. Please check your connection.');
      setModule(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle progress updates from YouTube player
  const handleProgressUpdate = (videoId: string, currentTime: number, duration: number) => {
    const debugAssignmentId = localStorage.getItem('currentAssignmentId');
    const debugIsPersonalised = localStorage.getItem('isPersonalisedModule');
    console.log(`[Progress Debug] Video: ${videoId}, Time: ${currentTime}, AssignmentId: ${debugAssignmentId}, IsPersonalised: ${debugIsPersonalised}`);

    console.log(`Progress update received for ${videoId}: ${currentTime}s / ${duration}s (${Math.round((currentTime / duration) * 100)}%)`);

    const progressPercent = Math.round((currentTime / duration) * 100);
    setVideoProgress(progressPercent);

    // Show quiz button when video is 95% complete
    if (progressPercent >= 95 && quiz && !showQuizButton) {
      setShowQuizButton(true);
      toast.success('Quiz is now available!');
    }

    if (progressPercent >= 100) {
      setShowQuizButton(true);
    }

    // Update backend progress
    const userId = (user as any)._id || (user as any).id;
    const isPersonalisedModule = localStorage.getItem('isPersonalisedModule') === 'true';
    const assignmentId = localStorage.getItem('currentAssignmentId') || undefined;

    if (userId) {
      // Update module-specific progress in UserProgress model (works for both types)
      if (selectedModuleId) {
        apiService.userProgress.updateVideoProgress(
          userId,
          selectedModuleId,
          progressPercent,
          isPersonalisedModule ? assignmentId : undefined, // Pass assignmentId only for personalised
          currentTime
        ).catch(error => {
          console.error('Failed to update user module progress:', error);
        });
      }

      // Update Legacy Progress ONLY for regular modules (not personalised)
      // This keeps progress separate between personalised and regular modules
      if (!isPersonalisedModule) {
        apiService.progress.updateProgress({
          userId,
          videoId,
          currentTime,
          duration,
          assignmentId: undefined,
          isPersonalised: false
        }).catch(error => {
          console.error('Failed to update progress (legacy):', error);
        });
      }
    }
  };

  // Handle video completion
  const handleVideoComplete = () => {
    setShowQuizButton(true);

    // Update backend progress
    const userId = (user as any)._id || (user as any).id;
    if (userId && selectedModuleId) {
      try {
        const assignmentId = localStorage.getItem('currentAssignmentId') || undefined;
        apiService.userProgress.watchVideo(selectedModuleId, 100, assignmentId);
        console.log('Progress updated in backend');
      } catch (error) {
        console.log('Backend update failed, but progress is tracked locally');
      }
    }
  };

  // Update video progress with API integration
  const updateProgress = async (progress: number) => {
    try {
      setVideoProgress(progress);

      // Show quiz button when video is 95% complete
      if (progress >= 95 && quiz && !showQuizButton) {
        setShowQuizButton(true);
      }

      if (progress >= 100) {
        setShowQuizButton(true);

        // Update backend progress
        if (user?.id && selectedModuleId) {
          try {
            const assignmentId = localStorage.getItem('currentAssignmentId') || undefined;
            await apiService.userProgress.watchVideo(selectedModuleId, 100, assignmentId);
            console.log('Progress updated in backend');
          } catch (error) {
            console.log('Backend update failed, but progress is tracked locally');
          }
        }
      }

      console.log('Video progress updated:', progress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Start quiz - now integrated with the new quiz system
  const startQuiz = () => {
    console.log('Start Quiz clicked!');
    console.log('Quiz data:', quiz);
    console.log('Video progress:', videoProgress);
    console.log('Show quiz button:', showQuizButton);

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      console.log('No quiz available');
      toast.error('No quiz available for this module');
      return;
    }

    if (videoProgress < 95) {
      console.log('Video not complete enough');
      toast.error('Please complete watching the video before taking the quiz');
      return;
    }

    // Store quiz data for the quiz modal
    if (selectedModuleId) {
      localStorage.setItem('currentModuleId', selectedModuleId);
      localStorage.setItem('currentModuleTitle', module?.title || '');
      localStorage.setItem('currentQuizData', JSON.stringify(quiz));
      console.log('Quiz data stored in localStorage');
    }

    // Navigate to quiz page
    console.log('Navigating to quiz page');
    setCurrentPage('quiz');
  };

  // Handle restart - reset progress and start video from beginning
  const handleRestart = async () => {
    const userId = (user as any)?._id || (user as any)?.id;
    if (!userId || !selectedModuleId) return;

    try {
      const assignmentId = localStorage.getItem('currentAssignmentId') || undefined;

      // Reset progress on backend (set to 0)
      await apiService.userProgress.updateVideoProgress(userId, selectedModuleId, 0, assignmentId, 0);

      // Reset local state
      setVideoProgress(0);
      setShowQuizButton(false);
      setInitialVideoTime(0);

      // Force player to remount by changing key
      setPlayerKey(prev => prev + 1);

      toast.success('Progress reset! Starting from the beginning.');
      console.log('Progress reset successfully');
    } catch (error) {
      console.error('Failed to reset progress:', error);
      toast.error('Failed to reset progress. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Module Not Found</h1>
            <p className="text-gray-600 mb-6">
              This module has no video content or could not be loaded.
              <br />
              <strong>Module ID:</strong> {selectedModuleId || 'None'}
              <br />
              <strong>User ID:</strong> {user?.id || 'None'}
            </p>
            <div className="space-y-3">
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage('modules')}
                className="ml-3"
              >
                Back to Modules
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{module.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">{module.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={module.status === 'published' ? 'default' : 'secondary'} className={module.status === 'published' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}>
              {module.status}
            </Badge>
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
              {Math.round(videoProgress)}% Complete
            </Badge>
            {module.difficulty && (
              <Badge variant="outline" className="text-xs capitalize border-gray-300 text-gray-700">
                {module.difficulty}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Video Section */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* YouTube Video Player */}
          <Card className="overflow-hidden">
            <div className="p-4">
              <YouTubePlayer
                key={playerKey} // Force remount on restart
                videoId={module.ytVideoId}
                userId={(user as any)._id || (user as any).id}
                title={module.title}
                description={module.description}
                restricted={true} // Enable unskippable mode
                onProgress={(progressPercent) => {
                  setVideoProgress(progressPercent);
                }}
                onComplete={() => handleVideoComplete()}
                onTimeUpdate={(currentTime, duration) => {
                  handleProgressUpdate(module.ytVideoId, currentTime, duration);
                }}
                initialTime={initialVideoTime}
                assignmentId={localStorage.getItem('currentAssignmentId') || undefined}
                isPersonalised={localStorage.getItem('isPersonalisedModule') === 'true'}
              />

              {/* Restart Button */}
              {videoProgress > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleRestart}
                    variant="outline"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restart Module
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Module Info */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Module Information</h2>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-gray-700 dark:text-gray-300">{module.status}</Badge>
                {module.difficulty && (
                  <Badge variant="outline" className="capitalize text-gray-700 dark:text-gray-300">
                    {module.difficulty}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Title</p>
                  <p className="text-gray-600">{module.title}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-gray-600">
                    {module.estimatedDuration ? `${module.estimatedDuration} minutes` : '~15 minutes'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Description</p>
              <p className="text-gray-600">{module.description}</p>
            </div>

            {module.tags && module.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {module.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-gray-800 bg-gray-100 dark:text-gray-200 dark:bg-gray-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Quiz Button - Only show after video completion */}
              {(() => {
                console.log('Quiz button render check:', {
                  showQuizButton,
                  hasQuiz: !!quiz,
                  hasQuestions: quiz?.questions?.length > 0,
                  videoProgress,
                  quizQuestions: quiz?.questions?.length
                });

                return showQuizButton && quiz && quiz.questions && quiz.questions.length > 0 ? (
                  <Button
                    onClick={startQuiz}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <FileQuestion className="h-4 w-4 mr-2" />
                    Start Quiz ({quiz.questions.length} questions)
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    disabled
                    variant="outline"
                  >
                    <FileQuestion className="h-4 w-4 mr-2" />
                    Complete video to unlock quiz
                  </Button>
                );
              })()}

              <Button
                variant="outline"
                onClick={() => {
                  setVideoProgress(100);
                  updateProgress(100);
                  toast.success('Module completed! You can now take the quiz.');
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>

              {/* Temporary debug button */}
              {quiz && quiz.questions && quiz.questions.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setVideoProgress(100);
                    setShowQuizButton(true);
                    toast.success('Quiz force enabled for testing!');
                  }}
                  className="bg-yellow-100 text-yellow-800 border-yellow-300"
                >
                  🧪 Force Enable Quiz
                </Button>
              )}
            </div>

            {/* Quiz Status */}
            {quiz && quiz.questions && quiz.questions.length > 0 ? (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <FileQuestion className="w-4 h-4" />
                  <span className="text-sm font-medium">Quiz Available</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  This module has {quiz.questions.length} quiz questions. Complete the video to start the quiz.
                </p>
                {quiz.estimatedTime && (
                  <p className="text-xs text-green-600 mt-1">
                    Estimated time: {quiz.estimatedTime} minutes
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">No Quiz Available</span>
                </div>
                <p className="text-sm text-yellow-600 mt-1">
                  This module doesn't have quiz questions yet. Contact admin to add questions.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};