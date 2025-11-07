import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  Play,
  Target,
  Award,
  FileQuestion,
  Maximize,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

export const QuizPage: React.FC = () => {
  const { setCurrentPage, selectedModuleId, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warnings, setWarnings] = useState(0);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        console.log('Fetching real quizzes for module:', selectedModuleId);
        
        // First, check if we have quiz data in localStorage (from TrainingModule)
        const storedQuizData = localStorage.getItem('currentQuizData');
        const storedModuleId = localStorage.getItem('currentModuleId');
        const storedModuleTitle = localStorage.getItem('currentModuleTitle');
        
        if (storedQuizData && storedModuleId) {
          console.log('Found quiz data in localStorage:', storedQuizData);
          try {
            const quizData = JSON.parse(storedQuizData);
            const moduleName = storedModuleTitle || 'Unknown Module';
            
            // Validate questions structure
            const hasValidQuestions = quizData.questions && 
              Array.isArray(quizData.questions) && 
              quizData.questions.length > 0 &&
              quizData.questions.every((q: any) => 
                q && (q.prompt || q.question) && q.options && Array.isArray(q.options) && (q.correctIndex !== undefined || q.correctOption !== undefined)
              );
            
            if (hasValidQuestions) {
              const processedQuiz = {
                ...quizData,
                moduleName: moduleName,
                moduleStatus: 'published',
                hasQuestions: true
              };
              
              console.log('Using stored quiz data:', processedQuiz);
              setQuizzes([processedQuiz]);
              setSelectedQuiz(processedQuiz);
              
              // Clear localStorage after using it
              localStorage.removeItem('currentQuizData');
              localStorage.removeItem('currentModuleId');
              localStorage.removeItem('currentModuleTitle');
              
              setLoading(false);
              return;
            } else {
              console.log('Stored quiz data is invalid, falling back to API');
            }
          } catch (error) {
            console.error('Error parsing stored quiz data:', error);
          }
        }
        
        // Fallback to API if no localStorage data or if it's invalid
        // Get all quizzes from backend
        const quizzesResponse = await apiService.quizzes.getAllQuizzes();
        console.log('Raw quizzes response:', quizzesResponse);
        
        const quizzesData = (quizzesResponse as any).data?.quizzes || (quizzesResponse as any).quizzes || [];
        console.log('All quizzes data:', quizzesData);
        
        // Filter quizzes by selectedModuleId if available
        let filteredQuizzes = quizzesData;
        if (selectedModuleId) {
          filteredQuizzes = quizzesData.filter((quiz: any) => {
            const quizModuleId = typeof quiz.moduleId === 'string' ? quiz.moduleId : quiz.moduleId?._id;
            console.log('Comparing quiz module ID:', quizModuleId, 'with selected:', selectedModuleId);
            return quizModuleId === selectedModuleId;
          });
          console.log('Filtered quizzes for module:', filteredQuizzes);
        } else {
          console.log('No selectedModuleId, showing all quizzes');
        }
        
        // Process quiz data and validate questions
        const validQuizzes = filteredQuizzes.map((quiz: any) => {
          // Get module info
          const moduleName = quiz.moduleId?.title || 'Unknown Module';
          const moduleStatus = quiz.moduleId?.status || 'unknown';
          
          // Validate questions structure
          const hasValidQuestions = quiz.questions && 
            Array.isArray(quiz.questions) && 
            quiz.questions.length > 0 &&
            quiz.questions.every((q: any) => 
              q && (q.prompt || q.question) && q.options && Array.isArray(q.options) && (q.correctIndex !== undefined || q.correctOption !== undefined)
            );
          
          console.log('Quiz validation:', {
            quizId: quiz._id,
            moduleName,
            hasQuestions: quiz.questions?.length || 0,
            hasValidQuestions,
            passPercent: quiz.passPercent
          });
          
          return {
            ...quiz,
            moduleName: moduleName,
            moduleStatus: moduleStatus,
            hasQuestions: hasValidQuestions
          };
        }).filter((quiz: any) => quiz.hasQuestions); // Only show quizzes with valid questions
        
        console.log('Valid quizzes found:', validQuizzes);
        
        if (validQuizzes.length === 0) {
          console.log('No valid quizzes found for this module');
          toast.info('No quizzes available for this module yet. Complete the video first!');
        }
        
        setQuizzes(validQuizzes);
        
        // Auto-select quiz if only one exists for the module
        if (validQuizzes.length === 1 && selectedModuleId) {
          console.log('Auto-selecting quiz:', validQuizzes[0]);
          setSelectedQuiz(validQuizzes[0]);
        }
        
      } catch (error: any) {
        console.error('Error fetching quizzes:', error);
        toast.error('Failed to load quizzes. Please try again.');
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [selectedModuleId]);

  // Track fullscreen state and violations
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && quizStarted && !quizCompleted) {
        // User exited fullscreen during quiz
        setWarnings(prev => {
          const newWarnings = prev + 1;
          if (newWarnings >= 4) {
            // Terminate quiz after 4 violations
            terminateQuiz('Multiple violations detected');
          }
          return newWarnings;
        });
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
        
        // Re-enter fullscreen after warning (unless terminated)
        if (warnings < 3) {
          setTimeout(() => {
            if (quizStarted && !quizCompleted) {
              enterFullscreen();
            }
          }, 1000);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && quizStarted && !quizCompleted) {
        setWarnings(prev => {
          const newWarnings = prev + 1;
          if (newWarnings >= 4) {
            // Terminate quiz after 4 violations
            terminateQuiz('Tab switching detected');
          }
          return newWarnings;
        });
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    };

    // Add event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [quizStarted, quizCompleted, warnings]);

  // Add CSS to hide navigation when in fullscreen
  useEffect(() => {
    if (quizStarted) {
      // Add CSS to hide all navigation elements
      const style = document.createElement('style');
      style.id = 'quiz-fullscreen-style';
      style.textContent = `
        /* Hide all navigation elements when quiz is in fullscreen */
        .quiz-fullscreen-active header,
        .quiz-fullscreen-active nav,
        .quiz-fullscreen-active .sidebar,
        .quiz-fullscreen-active .navigation,
        .quiz-fullscreen-active .nav-buttons,
        .quiz-fullscreen-active .app-header,
        .quiz-fullscreen-active .main-nav,
        .quiz-fullscreen-active .user-nav,
        .quiz-fullscreen-active .logout-btn,
        .quiz-fullscreen-active .dashboard-btn,
        .quiz-fullscreen-active .modules-btn,
        .quiz-fullscreen-active .quizzes-btn,
        .quiz-fullscreen-active .notifications-btn,
        .quiz-fullscreen-active .user-menu,
        .quiz-fullscreen-active .breadcrumb,
        .quiz-fullscreen-active .page-header,
        .quiz-fullscreen-active .back-button,
        .quiz-fullscreen-active .page-navigation,
        .quiz-fullscreen-active .left-sidebar,
        .quiz-fullscreen-active .right-sidebar,
        .quiz-fullscreen-active .top-bar,
        .quiz-fullscreen-active .bottom-bar,
        .quiz-fullscreen-active .app-navigation,
        .quiz-fullscreen-active .main-menu,
        .quiz-fullscreen-active .user-controls {
          display: none !important;
        }
        
        /* Ensure quiz takes full screen */
        .quiz-fullscreen-active {
          padding: 0 !important;
          margin: 0 !important;
          overflow: hidden !important;
        }
        
        .quiz-fullscreen-active .quiz-container {
          min-height: 100vh !important;
          width: 100vw !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 20px !important;
          background: white !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 9999 !important;
        }
        
        /* Hide any remaining navigation elements */
        .quiz-fullscreen-active *[class*="nav"],
        .quiz-fullscreen-active *[class*="sidebar"],
        .quiz-fullscreen-active *[class*="header"],
        .quiz-fullscreen-active *[class*="menu"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      
      // Add class to body
      document.body.classList.add('quiz-fullscreen-active');
      
      return () => {
        // Cleanup
        const existingStyle = document.getElementById('quiz-fullscreen-style');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.body.classList.remove('quiz-fullscreen-active');
      };
    }
  }, [quizStarted]);

  // Function to enter fullscreen mode
  const enterFullscreen = () => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen();
      }
    } catch (error) {
      console.log('Fullscreen not supported or failed:', error);
    }
  };

  // Function to exit fullscreen mode
  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.log('Exit fullscreen failed:', error);
    }
  };

  // Function to terminate quiz due to violations
  const terminateQuiz = (reason: string) => {
    toast.error(`Quiz terminated: ${reason}`);
    
    // Cleanup fullscreen CSS
    const existingStyle = document.getElementById('quiz-fullscreen-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    document.body.classList.remove('quiz-fullscreen-active');
    
    exitFullscreen();
    setQuizStarted(false);
    setSelectedQuiz(null);
    setQuizCompleted(false);
    setWarnings(0);
    setShowWarning(false);
    setCurrentPage('user-dashboard');
  };

  const startQuiz = (quiz: any) => {
    // Validate quiz data before starting
    if (!quiz || !quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      toast.error('Invalid quiz data. Please try again.');
      return;
    }

    // Get quiz time limit (in minutes), convert to seconds
    // estimatedTime is in minutes, default to 30 minutes if not set
    const quizTimeMinutes = quiz.estimatedTime || 30;
    const quizTimeSeconds = quizTimeMinutes * 60;

    setSelectedQuiz(quiz);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setScore(0);
    setTimeLeft(quizTimeSeconds); // Use dynamic quiz time from admin settings
    setShowWarning(false);
    setWarnings(0);
    
    console.log(`Quiz started with time limit: ${quizTimeMinutes} minutes (${quizTimeSeconds} seconds)`);
    
    // Automatically enter fullscreen mode immediately
    enterFullscreen();
    
    // Start timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      // Calculate time spent using dynamic quiz time
      // estimatedTime is in minutes, convert to seconds
      const quizTimeMinutes = selectedQuiz?.estimatedTime || 30;
      const quizTimeSeconds = quizTimeMinutes * 60;
      const timeSpent = quizTimeSeconds - timeLeft; // in seconds
      
      // Prepare answers in the format expected by backend
      const answersData = selectedQuiz.questions.map((question: any, index: number) => ({
        selectedOption: selectedAnswers[index] !== undefined ? selectedAnswers[index] : -1,
        timeSpent: Math.floor(timeSpent / selectedQuiz.questions.length) // distribute time across questions
      }));

      // Submit quiz to backend
      const userId = (user as any)?._id || (user as any)?.id;
      
      // Extract moduleId - handle both populated and non-populated cases
      let moduleId = selectedQuiz.moduleId;
      if (typeof moduleId === 'object' && moduleId !== null) {
        moduleId = moduleId._id || moduleId.id;
      }

      console.log('=== QUIZ SUBMISSION DEBUG ===');
      console.log('User:', user);
      console.log('User ID:', userId);
      console.log('Module ID (extracted):', moduleId);
      console.log('Module ID (original):', selectedQuiz.moduleId);
      console.log('Answers Data:', answersData);
      console.log('Time Spent:', timeSpent);
      console.log('Selected Quiz ID:', selectedQuiz._id);

      if (!userId) {
        console.error('❌ User ID is missing!');
        toast.error('User ID not found. Please login again.');
        return;
      }

      if (!moduleId) {
        console.error('❌ Module ID is missing!');
        console.error('Selected Quiz:', selectedQuiz);
        toast.error('Module ID not found. Please try again.');
        return;
      }

      console.log('✅ Submitting quiz to backend...');
      const response: any = await apiService.quizzes.submitQuiz(
        userId,
        moduleId,
        answersData,
        timeSpent
      );

      console.log('Quiz submission response:', response);
      console.log('Response data:', response?.data);

      // Update UI with backend response
      const result = response?.data?.result || response?.result;
      if (result) {
        setScore(result.percentage);
        setQuizCompleted(true);
        
        toast.success(
          `Quiz submitted successfully! Score: ${result.percentage}% ${
            result.passed ? '✅ PASSED' : '❌ FAILED'
          }`
        );
      } else {
        // Fallback to local calculation if backend response is unexpected
        const correctAnswers = selectedQuiz.questions.filter((_question: any, index: number) => {
          const selectedAnswer = selectedAnswers[index];
          const correctAnswer = _question.correctIndex !== undefined ? _question.correctIndex : _question.correctOption;
          return selectedAnswer === correctAnswer;
        }).length;

        const calculatedScore = Math.round((correctAnswers / selectedQuiz.questions.length) * 100);
        setScore(calculatedScore);
        setQuizCompleted(true);
        
        toast.success(`Quiz completed! Score: ${calculatedScore}%`);
      }
      
      // Auto redirect to dashboard after 3 seconds
      setTimeout(() => {
        // Cleanup fullscreen CSS
        const existingStyle = document.getElementById('quiz-fullscreen-style');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.body.classList.remove('quiz-fullscreen-active');
        
        exitFullscreen();
        setQuizStarted(false);
        setSelectedQuiz(null);
        setQuizCompleted(false);
        setCurrentPage('user-dashboard');
      }, 3000);

    } catch (error: any) {
      console.error('=== QUIZ SUBMISSION ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit quiz';
      toast.error(`Quiz submission failed: ${errorMessage}`);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (quizStarted && selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100;
    
    // Normalize question data to handle both backend and frontend formats
    const questionText = currentQuestion.prompt || currentQuestion.question;

         if (quizCompleted) {
       return (
         <div className="quiz-container p-6 max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <Award className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(score)}`} />
              <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
              <p className="text-gray-600 mb-4">{selectedQuiz.moduleName}</p>
            </div>

            <div className="mb-6">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}>
                {score}%
              </div>
              <div className="mb-4">
                {getScoreBadge(score)}
              </div>
              <Progress value={score} className="w-full mb-4" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium">Questions</div>
                <div className="text-gray-600">{selectedQuiz.questions.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium">Time Spent</div>
                <div className="text-gray-600">
                  {formatTime((selectedQuiz?.estimatedTime || 30) * 60 - timeLeft)}
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Redirecting to dashboard in 3 seconds...
              </p>
            </div>
            
                           <Button 
                 onClick={() => {
                   // Cleanup fullscreen CSS
                   const existingStyle = document.getElementById('quiz-fullscreen-style');
                   if (existingStyle) {
                     existingStyle.remove();
                   }
                   document.body.classList.remove('quiz-fullscreen-active');
                   
                   exitFullscreen();
                   setQuizStarted(false);
                   setSelectedQuiz(null);
                   setQuizCompleted(false);
                   setCurrentPage('user-dashboard');
                 }}
                 className="w-full"
               >
              Go to Dashboard Now
            </Button>
            
            <Button
              variant="outline"
              onClick={exitFullscreen}
              className="w-full"
            >
              <Maximize className="w-4 h-4 mr-2" />
              Exit Fullscreen
            </Button>
          </Card>
        </div>
      );
    }

         return (
       <div className="quiz-container p-6 max-w-4xl mx-auto">
        {/* Warning Display */}
        {showWarning && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Warning: {warnings} violation(s)</h3>
                <p className="text-sm text-red-600">
                  {warnings >= 3 ? 'Multiple violations detected. Quiz may be terminated.' : 'Please stay in fullscreen mode and do not switch tabs.'}
                </p>
                {warnings >= 3 && (
                  <p className="text-xs text-red-500 mt-1">
                    Next violation will result in quiz termination.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">{selectedQuiz.moduleName} Quiz</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="font-medium">{formatTime(timeLeft)}</span>
              </div>
                             <Badge variant="outline">
                 Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
               </Badge>
               {warnings > 0 && (
                 <Badge variant="destructive" className="flex items-center gap-1">
                   <AlertTriangle className="w-3 h-3" />
                   {warnings} Warning{warnings > 1 ? 's' : ''}
                 </Badge>
               )}
               <Button
                variant="outline"
                size="sm"
                onClick={exitFullscreen}
                className="ml-2"
              >
                <Maximize className="w-4 h-4" />
                Exit Fullscreen
              </Button>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-4">{questionText}</h2>
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAnswers[currentQuestionIndex] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`} />
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="text-gray-900 dark:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
              <Button 
                onClick={submitQuiz} 
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button 
                onClick={nextQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Show available quizzes
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Available Quizzes</h1>
          <p className="text-gray-600">Test your knowledge with these quizzes</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setCurrentPage('user-dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <BookOpen className="w-16 h-16 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Available</h3>
              <p className="text-gray-600">There are no quizzes available for this module yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedModuleId 
                  ? "Complete 95% of the video to unlock the quiz, or contact your administrator if you believe this is an error."
                  : "Please select a module first to see available quizzes."
                }
              </p>
              
              {selectedModuleId && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                  <h4 className="font-medium text-blue-800 mb-2">How to Unlock Quiz</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Watch at least 95% of the training video</li>
                    <li>• Quiz will automatically unlock</li>
                    <li>• Click "Start Quiz" button when available</li>
                    <li>• Complete quiz to earn certification</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg">{quiz.moduleName}</h3>
                    <p className="text-sm text-gray-600">Module Quiz</p>
                  </div>
                </div>
                <Badge 
                  variant={quiz.moduleStatus === 'published' ? 'default' : 'secondary'}
                  className="text-gray-900 dark:text-white"
                >
                  {quiz.moduleStatus}
                </Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileQuestion className="w-4 h-4" />
                  {quiz.questions?.length || 0} Questions
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  Time Limit: {quiz.estimatedTime || 30} minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Target className="w-4 h-4" />
                  Pass Rate: {quiz.passPercent || 70}%
                </div>
              </div>
              
              <Button 
                onClick={() => startQuiz(quiz)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white"
                disabled={quiz.moduleStatus !== 'published' || !quiz.hasQuestions}
              >
                <Play className="w-4 h-4 mr-2" />
                {quiz.moduleStatus === 'published' ? 'Start Quiz' : 'Not Published'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};