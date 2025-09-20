import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { LoadingSpinner } from './common/LoadingSpinner';
import { apiService } from '../services/apiService';
import { toast } from 'sonner';

interface Question {
  id: string;
  question: string;
  options: string[];
  questionType: string;
  weightage: number;
}

interface QuizSettings {
  isFullScreen: boolean;
  allowExit: boolean;
  timeLimit: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  requireVideoCompletion: boolean;
}

interface QuizInterfaceProps {
  moduleId: string;
  attemptId: string;
  questions: Question[];
  quizSettings: QuizSettings;
  onComplete: (result: any) => void;
  onExit: () => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({
  moduleId,
  attemptId,
  questions,
  quizSettings,
  onComplete,
  onExit
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(quizSettings.timeLimit * 60); // Convert to seconds
  const [isFullScreen, setIsFullScreen] = useState(quizSettings.isFullScreen);
  const [violations, setViolations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<Date>(new Date());
  const questionStartTimeRef = useRef<Date>(new Date());

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      if (quizSettings.isFullScreen && !isCurrentlyFullscreen && !quizSettings.allowExit) {
        recordViolation('fullscreen_exit', 'User exited fullscreen mode', 'high');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('tab_switch', 'User switched to another tab/window', 'medium');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'v', 'a', 'f', 'p', 's', 'u'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          recordViolation('copy_paste', `User attempted ${e.key.toUpperCase()} shortcut`, 'medium');
        }
      }
      
      // Prevent F11, F5, etc.
      if (['F11', 'F5', 'F12'].includes(e.key)) {
        e.preventDefault();
        recordViolation('keyboard_shortcut', `User pressed ${e.key}`, 'low');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('context_menu', 'User attempted to open context menu', 'low');
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!quizSettings.allowExit) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
        recordViolation('page_exit', 'User attempted to leave the page', 'critical');
        return e.returnValue;
      }
    };

    // Set up event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Enter fullscreen if required
    if (quizSettings.isFullScreen) {
      enterFullscreen();
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, [quizSettings]);

  // Timer effect
  useEffect(() => {
    if (quizSettings.timeLimit > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizSettings.timeLimit]);

  // Update question start time when question changes
  useEffect(() => {
    questionStartTimeRef.current = new Date();
  }, [currentQuestion]);

  const enterFullscreen = async () => {
    try {
      if (fullscreenRef.current) {
        await fullscreenRef.current.requestFullscreen();
        setIsFullScreen(true);
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      recordViolation('fullscreen_failed', 'Failed to enter fullscreen mode', 'low');
    }
  };

  const recordViolation = async (type: string, description: string, severity: string) => {
    const violation = {
      type,
      description,
      severity,
      timestamp: new Date()
    };

    setViolations(prev => [...prev, violation]);
    setWarningCount(prev => prev + 1);

    try {
      await apiService.modules.recordViolation(moduleId, {
        attemptId,
        violationType: type,
        description,
        severity
      });

      if (severity === 'critical' || severity === 'high') {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    } catch (error) {
      console.error('Failed to record violation:', error);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (answers.filter(a => a !== undefined).length !== questions.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const endTime = new Date();
      const result = await apiService.modules.completeQuiz(moduleId, {
        attemptId,
        answers,
        endTime: endTime.toISOString()
      });

      onComplete(result);
    } catch (error) {
      toast.error('Failed to submit quiz');
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = answers.filter(a => a !== undefined).length;

  if (isSubmitting) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <h2 className="text-xl font-semibold mb-2">Submitting Quiz...</h2>
          <p className="text-gray-600">Please wait while we process your answers.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={fullscreenRef}
      className="fixed inset-0 bg-white z-50 overflow-hidden"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Quiz in Progress</h1>
          <div className="flex items-center gap-2 text-sm">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>•</span>
            <span>{answeredCount} answered</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {quizSettings.timeLimit > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className={`font-mono ${timeLeft < 300 ? 'text-red-400' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
          
          {warningCount > 0 && (
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{warningCount} warnings</span>
            </div>
          )}
          
          {quizSettings.allowExit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExit}
              className="text-white border-white hover:bg-white hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-100 p-2">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-medium text-red-800">Quiz Violation Detected</h3>
              <p className="text-red-700 text-sm">
                Your action has been recorded. Multiple violations may result in quiz termination.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            {/* Question */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Question {currentQuestion + 1}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Weightage: {currentQuestionData.weightage}</span>
                  <span>•</span>
                  <span className="capitalize">{currentQuestionData.questionType.replace('_', ' ')}</span>
                </div>
              </div>
              
              <p className="text-lg text-gray-800 leading-relaxed">
                {currentQuestionData.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestionData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    answers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion] === index && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-gray-800">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {answers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      index === currentQuestion
                        ? 'bg-blue-500 text-white'
                        : answer !== undefined
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={answeredCount !== questions.length}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={answers[currentQuestion] === undefined}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-4 border-t">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <div>
            <span>Total Questions: {questions.length}</span>
            <span className="mx-2">•</span>
            <span>Answered: {answeredCount}</span>
            <span className="mx-2">•</span>
            <span>Remaining: {questions.length - answeredCount}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>Violations: {violations.length}</span>
            {quizSettings.isFullScreen && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Full Screen
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
