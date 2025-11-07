import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  BookOpen,
  Clock,
  Search,
  CheckCircle,
  Upload,
  FileText,
  Edit
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface Question {
  type: 'mcq' | 'boolean';
  prompt: string;
  options?: string[];
  correctIndex?: number;
  correctBool?: boolean;
  marks: number;
}

interface Quiz {
  _id: string;
  moduleId: {
    _id: string;
    title: string;
  };
  questions: Question[];
  passPercent: number;
  createdAt: string;
}

interface Module {
  _id: string;
  title: string;
  description: string;
}

export const QuizManagement: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [createQuizData, setCreateQuizData] = useState({
    moduleId: '',
    passPercent: 70,
    estimatedTime: 30, // Default 30 minutes
    questions: [] as Question[]
  });
  const [csvData, setCsvData] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    type: 'mcq',
    prompt: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    marks: 1
  });

  useEffect(() => {
    fetchQuizzes();
    fetchModules();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      console.log('Fetching quizzes...');
      const response = await apiService.quizzes.getAllQuizzes();
      console.log('Quizzes response:', response);

      let quizzesData = [];
      if (response && response.data && response.data.quizzes) {
        quizzesData = response.data.quizzes;
      } else if (response && response.quizzes) {
        quizzesData = response.quizzes;
      } else {
        console.error('Unexpected response format:', response);
        setQuizzes([]);
        return;
      }

      // Filter out quizzes with invalid module data
      const validQuizzes = quizzesData.filter(quiz => 
        quiz.moduleId && quiz.moduleId.title && typeof quiz.moduleId.title === 'string'
      );

      if (validQuizzes.length !== quizzesData.length) {
        console.warn(`${quizzesData.length - validQuizzes.length} quizzes have invalid module data`);
      }

      setQuizzes(validQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await apiService.modules.getAllModules();
      if (response && response.data && response.data.modules) {
        setModules(response.data.modules);
      } else if (response && response.modules) {
        setModules(response.modules);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleCreateQuiz = async () => {
    try {
      if (!createQuizData.moduleId || createQuizData.questions.length === 0) {
        toast.error('Module and at least one question are required');
        return;
      }

      console.log('Creating quiz with data:', createQuizData);

      const response = await apiService.quizzes.createQuiz(createQuizData);

      console.log('Quiz creation response:', response);

      if (response && (response.success || response.data?.success)) {
        toast.success('Quiz created successfully');
        setShowCreateModal(false);
        setCreateQuizData({
          moduleId: '',
          passPercent: 70,
          estimatedTime: 30,
          questions: []
        });
        fetchQuizzes();
      } else {
        console.error('Quiz creation failed:', response);
        toast.error('Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
    }
  };

  const handleDeleteQuiz = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.quizzes.deleteQuiz(moduleId);
      if (response && (response.success || response.data?.success)) {
        toast.success('Quiz deleted successfully');
        fetchQuizzes();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const handleUploadCSV = async () => {
    try {
      if (!selectedModuleId || !csvData.trim()) {
        toast.error('Please select a module and enter CSV data');
        return;
      }

      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const questions: Question[] = [];

      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(part => part.trim());
        if (parts.length < 3) continue;

        const [type, prompt, ...options] = parts;
        
        if (type === 'mcq' && options.length >= 3) {
          const correctIndex = parseInt(options[options.length - 1]) || 0;
          const questionOptions = options.slice(0, -1);
          
          questions.push({
            type: 'mcq',
            prompt,
            options: questionOptions,
            correctIndex,
            marks: 1
          });
        } else if (type === 'boolean') {
          const correctBool = options[0]?.toLowerCase() === 'true';
          questions.push({
            type: 'boolean',
            prompt,
            correctBool,
            marks: 1
          });
        }
      }

      if (questions.length === 0) {
        toast.error('No valid questions found in CSV data');
        return;
      }

      const response = await apiService.quizzes.uploadCSV(selectedModuleId, questions);

      if (response && (response.success || response.data?.success)) {
        toast.success(`Quiz updated with ${questions.length} questions`);
        setShowCSVModal(false);
        setCsvData('');
        setSelectedModuleId('');
        fetchQuizzes();
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Failed to upload CSV');
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.prompt.trim()) {
      toast.error('Question prompt is required');
      return;
    }

    if (currentQuestion.type === 'mcq') {
      if (!currentQuestion.options || currentQuestion.options.filter(opt => opt.trim()).length < 2) {
        toast.error('MCQ must have at least 2 options');
        return;
      }
      if (currentQuestion.correctIndex === undefined || currentQuestion.correctIndex < 0) {
        toast.error('Please select correct answer');
        return;
      }
    } else if (currentQuestion.type === 'boolean') {
      if (currentQuestion.correctBool === undefined) {
        toast.error('Please select correct answer');
        return;
      }
    }

    setCreateQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }]
    }));

    setCurrentQuestion({
      type: 'mcq',
      prompt: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      marks: 1
    });
  };

  const removeQuestion = (index: number) => {
    setCreateQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.moduleId?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSVTemplate = () => {
    const template = `type,prompt,option1,option2,option3,option4,correctIndex
mcq,What is 2+2?,4,3,5,6,0
boolean,Is the sky blue?,true
mcq,What is the capital of France?,Paris,London,Berlin,Madrid,0`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV template downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quiz Management</h1>
          <p className="text-gray-600">Manage quizzes for training modules</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={downloadCSVTemplate}
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowCSVModal(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Quiz
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search quizzes by module..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold">{quizzes.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-green-600">
                {quizzes.reduce((total, quiz) => total + quiz.questions.length, 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Pass %</p>
              <p className="text-2xl font-bold text-yellow-600">
                {quizzes.length > 0 
                  ? Math.round(quizzes.reduce((total, quiz) => total + quiz.passPercent, 0) / quizzes.length)
                  : 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
              <p className="text-gray-600">
                {quizzes.length === 0 
                  ? "You haven't created any quizzes yet. Create your first quiz to get started!"
                  : "No quizzes match your search criteria. Try adjusting your search term."
                }
              </p>
            </div>
            {quizzes.length === 0 && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz._id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">
                    {quiz.moduleId?.title || 'Unknown Module'}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {quiz.questions.length} questions
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="w-4 h-4 mr-1" />
                    {quiz.questions.length} questions
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {quiz.passPercent}% pass required
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // TODO: View quiz details
                      toast.info('View quiz details - coming soon');
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteQuiz(quiz.moduleId?._id || quiz._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Quiz</h2>
            
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="moduleId">Module *</Label>
                  <Select
                    value={createQuizData.moduleId}
                    onValueChange={(value) => setCreateQuizData(prev => ({ ...prev, moduleId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(module => (
                        <SelectItem key={module._id} value={module._id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passPercent">Pass Percentage (%)</Label>
                    <Input
                      id="passPercent"
                      type="number"
                      min="1"
                      max="100"
                      value={createQuizData.passPercent}
                      onChange={(e) => setCreateQuizData(prev => ({ ...prev, passPercent: parseInt(e.target.value) || 70 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estimatedTime">Time Limit (minutes) *</Label>
                    <Input
                      id="estimatedTime"
                      type="number"
                      min="1"
                      max="180"
                      value={createQuizData.estimatedTime}
                      onChange={(e) => setCreateQuizData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                      placeholder="30"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time limit for users to complete this quiz
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Add Questions</h3>
                
                <div className="space-y-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="questionType">Question Type</Label>
                    <Select
                      value={currentQuestion.type}
                      onValueChange={(value: 'mcq' | 'boolean') => setCurrentQuestion(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="boolean">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="questionPrompt">Question *</Label>
                    <Input
                      id="questionPrompt"
                      value={currentQuestion.prompt}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Enter your question"
                    />
                  </div>
                  
                  {currentQuestion.type === 'mcq' && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={currentQuestion.correctIndex === index}
                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correctIndex: index }))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {currentQuestion.type === 'boolean' && (
                    <div>
                      <Label>Correct Answer</Label>
                      <Select
                        value={currentQuestion.correctBool?.toString() || ''}
                        onValueChange={(value) => setCurrentQuestion(prev => ({ ...prev, correctBool: value === 'true' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <Button onClick={addQuestion} className="w-full">
                    Add Question
                  </Button>
                </div>
              </div>

              {createQuizData.questions.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Added Questions ({createQuizData.questions.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {createQuizData.questions.map((question, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm truncate flex-1">
                          {index + 1}. {question.prompt}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeQuestion(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreateQuiz}
                className="flex-1"
                disabled={createQuizData.questions.length === 0}
              >
                Create Quiz
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Upload Questions via CSV</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="csvModuleId">Module</Label>
                <Select
                  value={selectedModuleId}
                  onValueChange={setSelectedModuleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map(module => (
                      <SelectItem key={module._id} value={module._id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="csvData">CSV Data</Label>
                <textarea
                  id="csvData"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder={`type,prompt,option1,option2,option3,option4,correctIndex
mcq,What is 2+2?,4,3,5,6,0
boolean,Is the sky blue?,true
mcq,What is the capital of France?,Paris,London,Berlin,Madrid,0`}
                  className="w-full h-32 p-2 border rounded-md"
                />
              </div>
              
              <div className="text-xs text-gray-600">
                <p><strong>CSV Format:</strong></p>
                <p>For MCQ: type,prompt,option1,option2,option3,option4,correctIndex</p>
                <p>For Boolean: type,prompt,correctAnswer</p>
                <p>First row should be headers.</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUploadCSV}
                className="flex-1"
              >
                Upload CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCSVModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
