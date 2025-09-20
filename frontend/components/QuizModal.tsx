import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  FileQuestion,
  Target
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  moduleTitle: string;
  quizData: any;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  moduleTitle,
  quizData
}) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeSpent, setTimeSpent] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // Timer effect
  useEffect(() => {
    if (!isOpen || !startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, startTime]);

  // Initialize quiz when modal opens
  useEffect(() => {
    if (isOpen && quizData) {
      setCurrentQuestionIndex(0);
      setAnswers(new Array(quizData.questions.length).fill(-1));
      setTimeSpent(new Array(quizData.questions.length).fill(0));
      setStartTime(new Date());
      setElapsedTime(0);
      setShowResults(false);
      setQuizResult(null);
    }
  }, [isOpen, quizData]);

  const currentQuestion = quizData?.questions?.[currentQuestionIndex];
  const totalQuestions = quizData?.questions?.length || 0;
  const answeredQuestions = answers.filter(a => a !== -1).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);

    // Update time spent for current question
    const newTimeSpent = [...timeSpent];
    if (startTime) {
      const questionStartTime = startTime.getTime() + (currentQuestionIndex * 1000); // Approximate
      newTimeSpent[currentQuestionIndex] = Math.floor((Date.now() - questionStartTime) / 1000);
    }
    setTimeSpent(newTimeSpent);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const submitQuiz = async () => {
    if (answeredQuestions < totalQuestions) {
      const unanswered = totalQuestions - answeredQuestions;
      const confirmSubmit = window.confirm(
        `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    try {
      // Prepare answers data
      const answersData = answers.map((selectedOption, index) => ({
        selectedOption,
        timeSpent: timeSpent[index] || 0
      }));

      const response = await apiService.quizzes.submitQuiz(
        (user as any)?.id || (user as any)?._id,
        moduleId,
        answersData,
        elapsedTime
      );

      setQuizResult(response.result);
      setShowResults(true);
      toast.success('Quiz submitted successfully! 🎉');

    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileQuestion className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-semibold">Module Quiz</h2>
              <p className="text-sm text-blue-100">{moduleTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-100">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formatTime(elapsedTime)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-blue-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {answeredQuestions} of {totalQuestions} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {!showResults ? (
          /* Quiz Questions */
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Question Navigation */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalQuestions }, (_, index) => (
                  <Button
                    key={index}
                    variant={index === currentQuestionIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToQuestion(index)}
                    className={`w-8 h-8 p-0 ${
                      answers[index] !== -1 ? 'bg-green-100 text-green-700 border-green-300' : ''
                    }`}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <Card className="p-6">
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </Badge>
                  <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant={answers[currentQuestionIndex] === index ? "default" : "outline"}
                      className={`w-full justify-start h-auto p-4 ${
                        answers[currentQuestionIndex] === index 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestionIndex] === index 
                            ? 'border-white' 
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestionIndex] === index && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-left">{option}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  onClick={goToNextQuestion}
                  disabled={answers[currentQuestionIndex] === -1}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={submitQuiz}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Quiz Results */
          <div className="p-6 text-center">
            <Card className="p-8">
              {quizResult?.passed ? (
                <div className="text-green-600 mb-4">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">Congratulations!</h3>
                  <p className="text-lg">You passed the quiz!</p>
                </div>
              ) : (
                <div className="text-red-600 mb-4">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">Quiz Completed</h3>
                  <p className="text-lg">Better luck next time!</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {quizResult?.score}/{quizResult?.total}
                  </div>
                  <p className="text-sm text-gray-600">Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {quizResult?.percentage}%
                  </div>
                  <p className="text-sm text-gray-600">Percentage</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Time taken: {formatTime(quizResult?.timeTaken || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  Pass threshold: {quizData?.passPercent || 70}%
                </p>
              </div>

              <Button onClick={onClose} className="w-full">
                Close Quiz
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
