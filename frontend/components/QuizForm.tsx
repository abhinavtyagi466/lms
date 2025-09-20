import React, { useState } from 'react';
import { 
  Plus, 
  Upload, 
  FileText, 
  Trash2, 
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { apiService } from '../services/apiService';

interface QuizFormProps {
  moduleId: string;
  moduleTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Question {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: number;
  explanation?: string;
}

export const QuizForm: React.FC<QuizFormProps> = ({
  moduleId,
  moduleTitle,
  onSuccess,
  onCancel
}) => {
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 0,
      explanation: ''
    }
  ]);
  const [passPercent, setPassPercent] = useState(70);
  const [estimatedTime, setEstimatedTime] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvData, setCsvData] = useState<string>('');
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 0,
        explanation: ''
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const validateQuestions = (): boolean => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1}: Question text is required`);
        return false;
      }
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        toast.error(`Question ${i + 1}: All 4 options are required`);
        return false;
      }
      if (q.correctOption < 0 || q.correctOption > 3) {
        toast.error(`Question ${i + 1}: Correct option must be 0, 1, 2, or 3`);
        return false;
      }
    }
    return true;
  };

  const handleManualSubmit = async () => {
    if (!validateQuestions()) return;

    setIsSubmitting(true);
    try {
      // Transform questions to match backend format
      const transformedQuestions = questions.map(q => ({
        question: q.question.trim(),
        options: [q.optionA.trim(), q.optionB.trim(), q.optionC.trim(), q.optionD.trim()],
        correctOption: q.correctOption,
        explanation: q.explanation?.trim() || '',
        marks: 1
      }));

      await apiService.quizzes.createQuiz({
        moduleId,
        questions: transformedQuestions,
        passPercent,
        estimatedTime
      });

      toast.success('Quiz created successfully! 🎉');
      onSuccess();
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvData.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const csvQuestions = lines.map((line, index) => {
        const [question, optionA, optionB, optionC, optionD, correctOption, explanation] = line.split(',').map(s => s.trim());
        
        if (!question || !optionA || !optionB || !optionC || !optionD) {
          throw new Error(`Line ${index + 1}: All fields are required`);
        }

        const correct = parseInt(correctOption);
        if (isNaN(correct) || correct < 0 || correct > 3) {
          throw new Error(`Line ${index + 1}: Correct option must be 0, 1, 2, or 3`);
        }

        return {
          question,
          optionA,
          optionB,
          optionC,
          optionD,
          correctOption: correct,
          explanation: explanation || ''
        };
      });

      // Transform to backend format
      const transformedQuestions = csvQuestions.map(q => ({
        question: q.question,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        correctOption: q.correctOption,
        explanation: q.explanation,
        marks: 1
      }));

      await apiService.quizzes.uploadCsv(moduleId, transformedQuestions);

      toast.success(`Quiz created with ${csvQuestions.length} questions! 🎉`);
      onSuccess();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload CSV. Please check the format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCsvTemplate = () => {
    const template = `Question,Option A,Option B,Option C,Option D,Correct Option,Explanation`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Create Quiz for Module</h2>
            <p className="text-gray-600">{moduleTitle}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCsvUpload(!showCsvUpload)}
            >
              <Upload className="w-4 h-4 mr-2" />
              {showCsvUpload ? 'Manual Entry' : 'CSV Upload'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Quiz Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="passPercent">Pass Percentage (%)</Label>
            <Input
              id="passPercent"
              type="number"
              min="0"
              max="100"
              value={passPercent}
              onChange={(e) => setPassPercent(parseInt(e.target.value) || 70)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
            <Input
              id="estimatedTime"
              type="number"
              min="1"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 10)}
              className="mt-1"
            />
          </div>
        </div>

        {showCsvUpload ? (
          /* CSV Upload Section */
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Upload questions using CSV format. Each line should have: Question, Option A, Option B, Option C, Option D, Correct Option (0-3), Explanation (optional)
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadCsvTemplate}>
                Download Template
              </Button>
            </div>

            <div>
              <Label htmlFor="csvData">CSV Data</Label>
              <Textarea
                id="csvData"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Enter CSV data here..."
                rows={10}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleCsvUpload}
              disabled={isSubmitting || !csvData.trim()}
              className="w-full"
            >
              {isSubmitting ? 'Uploading...' : 'Upload CSV & Create Quiz'}
            </Button>
          </div>
        ) : (
          /* Manual Entry Section */
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Question {index + 1}</h3>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`question-${index}`}>Question</Label>
                    <Textarea
                      id={`question-${index}`}
                      value={question.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      placeholder="Enter your question here..."
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`optionA-${index}`}>Option A</Label>
                      <Input
                        id={`optionA-${index}`}
                        value={question.optionA}
                        onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
                        placeholder="Option A"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`optionB-${index}`}>Option B</Label>
                      <Input
                        id={`optionB-${index}`}
                        value={question.optionB}
                        onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
                        placeholder="Option B"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`optionC-${index}`}>Option C</Label>
                      <Input
                        id={`optionC-${index}`}
                        value={question.optionC}
                        onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
                        placeholder="Option C"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`optionD-${index}`}>Option D</Label>
                      <Input
                        id={`optionD-${index}`}
                        value={question.optionD}
                        onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
                        placeholder="Option D"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`correctOption-${index}`}>Correct Option</Label>
                      <select
                        id={`correctOption-${index}`}
                        value={question.correctOption}
                        onChange={(e) => updateQuestion(index, 'correctOption', parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value={0}>A (Option A)</option>
                        <option value={1}>B (Option B)</option>
                        <option value={2}>C (Option C)</option>
                        <option value={3}>D (Option D)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`explanation-${index}`}>Explanation (Optional)</Label>
                      <Input
                        id={`explanation-${index}`}
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                        placeholder="Why is this the correct answer?"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={addQuestion}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Question
            </Button>

            <Button
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
            </Button>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium">Quiz Summary</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Questions:</span>
              <span className="ml-2 font-medium">{questions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Pass %:</span>
              <span className="ml-2 font-medium">{passPercent}%</span>
            </div>
            <div>
              <span className="text-gray-600">Time:</span>
              <span className="ml-2 font-medium">{estimatedTime} min</span>
            </div>
            <div>
              <span className="text-gray-600">Module:</span>
              <span className="ml-2 font-medium">{moduleTitle}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
