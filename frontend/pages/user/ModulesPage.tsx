import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ProgressBar } from '../../components/ProgressBar';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { ModuleWithProgress, ProgressData } from '../../types';
import { FileQuestion, Lock, CheckCircle } from 'lucide-react';

export const ModulesPage: React.FC = () => {
  const { user, setCurrentPage, setSelectedModuleId } = useAuth();

  // Function to get YouTube thumbnail URL
  const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium') => {
    if (!videoId) return null;
    
    // If it's already a full URL, extract the video ID
    let actualVideoId = videoId;
    if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
      ];
      
      for (const pattern of patterns) {
        const match = videoId.match(pattern);
        if (match) {
          actualVideoId = match[1];
          break;
        }
      }
    }
    
    return `https://img.youtube.com/vi/${actualVideoId}/${quality}default.jpg`;
  };
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [, setUserProgress] = useState<ProgressData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch modules and user progress on component mount
  useEffect(() => {
    if (user) {
      fetchModulesAndProgress();
    }
  }, [user]);

  const fetchModulesAndProgress = async () => {
    try {
      setLoading(true);
      
      const userId = (user as any)._id || (user as any).id;
      
      // Fetch modules with progress and quiz availability
      const modulesResponse = await apiService.modules.getUserModules(userId);

      if (modulesResponse && (modulesResponse as any).success && (modulesResponse as any).modules) {
        setModules((modulesResponse as any).modules);
        
        // Convert to progress format for backward compatibility
        const progressData: ProgressData = {};
        (modulesResponse as any).modules.forEach((module: ModuleWithProgress) => {
          if (module.progress > 0) {
            progressData[module.ytVideoId] = {
              currentTime: module.progress * 100, // Convert to percentage for display
              duration: 100
            };
          }
        });
        setUserProgress(progressData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load training modules');
      toast.error('Failed to load training modules');
    } finally {
      setLoading(false);
    }
  };

  // Handle progress updates from YouTube player - DISABLED
  // const handleProgressUpdate = (videoId: string, currentTime: number, duration: number) => {
  //   // Progress tracking disabled to avoid caching issues
  // };

  // Handle video completion - DISABLED
  // const handleVideoComplete = (videoId: string) => {
  //   toast.success('Video completed! Great job!');
  // };

  // Handle quiz button click
  const handleTakeQuiz = (moduleId: string) => {
    // Set the selected module ID for the quiz page
    setSelectedModuleId(moduleId);
    // Navigate to quiz page using the app's routing system
    setCurrentPage('quizzes');
  };

  // Filter only published modules
  const publishedModules = modules.filter(module => module.status === 'published');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium mb-2">Error Loading Modules</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={fetchModulesAndProgress}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center text-gray-600">
            <p className="text-lg font-medium mb-2">Please Log In</p>
            <p className="text-sm">You need to be logged in to view training modules.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Modules</h1>
        <p className="text-gray-600">
          Complete your training by watching these YouTube videos. Your progress is automatically saved.
        </p>
      </div>

      {/* Stats Summary */}
      {modules.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Your Progress Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{publishedModules.length}</div>
              <div className="text-sm text-blue-700">Total Modules</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {modules.filter(m => m.progress >= 0.95).length}
              </div>
              <div className="text-sm text-green-700">Completed</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {modules.filter(m => m.progress > 0 && m.progress < 0.95).length}
              </div>
              <div className="text-sm text-purple-700">In Progress</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {modules.filter(m => m.progress === 0).length}
              </div>
              <div className="text-sm text-orange-700">Not Started</div>
            </div>
          </div>
        </Card>
      )}

      {/* Modules Grid */}
      {publishedModules.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {publishedModules.map((module) => {
            const progressPercent = Math.round(module.progress * 100);
            const isLocked = (module as any).isLocked || false;
            const isCompleted = (module as any).isCompleted || false;
            const unlockMessage = (module as any).unlockMessage || '';
            
            return (
              <Card key={module.moduleId} className={`overflow-hidden ${isLocked ? 'opacity-60 border-2 border-gray-300' : ''} ${isCompleted ? 'border-2 border-green-400' : ''}`}>
                {/* Module Header */}
                <div className="p-4 border-b relative">
                  {isLocked && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gray-500 text-white flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </Badge>
                    </div>
                  )}
                  
                  {isCompleted && !isLocked && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{module.title}</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Training
                    </Badge>
                  </div>
                  
                  {module.description && (
                    <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                  )}
                  
                  {module.tags && module.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {module.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {module.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{module.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Video Thumbnail */}
                {module.ytVideoId && (
                  <div className="relative">
                    {isLocked && (
                      <div className="absolute inset-0 z-10 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center text-white p-4">
                        <Lock className="w-12 h-12 mb-3" />
                        <p className="text-lg font-semibold mb-1">Module Locked</p>
                        <p className="text-sm text-center">{unlockMessage}</p>
                      </div>
                    )}
                    
                    <div 
                      className={`w-full h-48 bg-gray-200 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} group relative overflow-hidden border-b`}
                      onClick={() => {
                        if (!isLocked) {
                          setSelectedModuleId(module.moduleId);
                          setCurrentPage('training-module');
                        } else {
                          toast.error(unlockMessage || 'Complete the previous module first');
                        }
                      }}
                    >
                      <img
                        src={getYouTubeThumbnail(module.ytVideoId, 'medium') || ''}
                        alt={`${module.title} video thumbnail`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to a default thumbnail if YouTube thumbnail fails
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIzMCIgZmlsbD0iIzZCNzI4MCIvPgo8cGF0aCBkPSJNMTQ1IDc1TDE3NSA5MEwxNDUgMTA1Vjc1WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
                        }}
                      />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        Video
                      </div>
                      
                      {/* Click to start text */}
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Click to start training
                      </div>
                    </div>
                  </div>
                )}

                {/* Start Training Button */}
                <div className="p-4 border-b">
                  <div className="text-center">
                    <Button
                      onClick={() => {
                        if (!isLocked) {
                          setSelectedModuleId(module.moduleId);
                          setCurrentPage('training-module');
                        } else {
                          toast.error(unlockMessage || 'Complete the previous module first');
                        }
                      }}
                      disabled={isLocked}
                      className={`w-full py-3 ${isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-4 h-4 mr-2 inline" />
                          Module Locked
                        </>
                      ) : isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 inline" />
                          Review Module
                        </>
                      ) : (
                        <>
                          📺 Start Training Module
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      {isLocked 
                        ? unlockMessage 
                        : isCompleted 
                        ? 'You have completed this module. Click to review.'
                        : 'Click to open the training module with embedded video player'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{progressPercent}%</span>
                  </div>
                  <ProgressBar
                    currentTime={module.progress * 100}
                    duration={100}
                  />
                </div>

                {/* Quiz Section */}
                {module.quizInfo && (
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileQuestion className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Quiz Available ({module.quizInfo.questionCount} questions, ~{module.quizInfo.estimatedTime} min)
                        </span>
                      </div>
                      
                      {module.quizAvailable ? (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleTakeQuiz(module.moduleId)}
                        >
                          Take Quiz
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-gray-400" />
                          <Button
                            size="sm"
                            className="bg-gray-300 text-gray-500 cursor-not-allowed"
                            disabled
                          >
                            Quiz Locked
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {!module.quizAvailable && (
                      <p className="text-xs text-gray-500 mt-1">
                        Watch 95% of the video to unlock the quiz ({95 - progressPercent}% remaining)
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No Training Modules Available</p>
            <p className="text-sm">
              There are currently no published training modules. Please check back later.
            </p>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <div className="font-medium mb-1">🎬 Video Thumbnails</div>
            <p>Click on any video thumbnail or "Start Training Module" to open the embedded video player with real-time progress tracking.</p>
          </div>
          <div>
            <div className="font-medium mb-1">📊 Track Progress</div>
            <p>Your progress is automatically saved in real-time. Complete 95% of a video to unlock the quiz.</p>
          </div>
          <div>
            <div className="font-medium mb-1">🧠 Take Quizzes</div>
            <p>Once you complete 95% of a video, you can take the associated quiz to test your knowledge.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
