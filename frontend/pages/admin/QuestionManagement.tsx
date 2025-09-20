import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Clock
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
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  marks: number;
  questionType: string;
  difficulty: string;
  isActive: boolean;
  createdAt: string;
}

interface Module {
  id: string;
  title: string;
  category: string;
}

export const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionData, setQuestionData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    marks: 1,
    questionType: 'multiple_choice',
    difficulty: 'medium'
  });
  const [bulkQuestions, setBulkQuestions] = useState('');

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchQuestions();
    }
  }, [selectedModule]);

  const fetchModules = async () => {
    try {
      const response = await apiService.modules.getAllModules();
      if (response && response.modules) {
        setModules(response.modules);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedModule) return;

    try {
      setLoading(true);
      const response = await apiService.questions.getModuleQuestions(selectedModule);
      if (response && response.questions) {
        setQuestions(response.questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedModule) {
      toast.error('Please select a module first');
      return;
    }

    try {
      const response = await apiService.questions.createQuestion({
        moduleId: selectedModule,
        ...questionData
      });

      if (response.success) {
        toast.success('Question created successfully');
        setShowCreateModal(false);
        resetQuestionData();
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
    }
  };

  const handleEditQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      const response = await apiService.questions.updateQuestion(selectedQuestion.id, questionData);

      if (response.success) {
        toast.success('Question updated successfully');
        setShowEditModal(false);
        setSelectedQuestion(null);
        resetQuestionData();
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.questions.deleteQuestion(questionId);
      if (response.success) {
        toast.success('Question deleted successfully');
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedModule) {
      toast.error('Please select a module first');
      return;
    }

    try {
      // Parse CSV or JSON format
      let questionsArray;
      try {
        questionsArray = JSON.parse(bulkQuestions);
      } catch {
        // Try CSV format
        const lines = bulkQuestions.trim().split('\n');
        questionsArray = lines.map(line => {
          const [question, options, correctAnswer, explanation, marks, difficulty] = line.split(',');
          return {
            question: question?.trim(),
            options: options?.split('|').map(opt => opt.trim()) || [],
            correctAnswer: parseInt(correctAnswer) || 0,
            explanation: explanation?.trim() || '',
            marks: parseInt(marks) || 1,
            difficulty: difficulty?.trim() || 'medium'
          };
        });
      }

      const response = await apiService.questions.bulkCreateQuestions({
        moduleId: selectedModule,
        questions: questionsArray
      });

      if (response.success) {
        toast.success(`Created ${response.created} questions successfully`);
        setShowBulkUploadModal(false);
        setBulkQuestions('');
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error bulk uploading questions:', error);
      toast.error('Failed to upload questions');
    }
  };

  const openEditModal = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionData({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      marks: question.marks,
      questionType: question.questionType,
      difficulty: question.difficulty
    });
    setShowEditModal(true);
  };

  const resetQuestionData = () => {
    setQuestionData({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      marks: 1,
      questionType: 'multiple_choice',
      difficulty: 'medium'
    });
  };

  const addOption = () => {
    setQuestionData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (questionData.options.length <= 2) {
      toast.error('At least 2 options are required');
      return;
    }

    setQuestionData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      correctAnswer: prev.correctAnswer >= index ? Math.max(0, prev.correctAnswer - 1) : prev.correctAnswer
    }));
  };

  const updateOption = (index: number, value: string) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(q => 
    filterDifficulty === 'all' || q.difficulty === filterDifficulty
  );

  if (loading && !selectedModule) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Question Management</h1>
          <p className="text-gray-600">Create and manage quiz questions for modules</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowBulkUploadModal(true)}
            variant="outline"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Module Selection */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="module">Select Module</Label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a module to manage questions" />
              </SelectTrigger>
              <SelectContent>
                {modules.map(module => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title} ({module.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedModule && (
            <div className="text-sm text-gray-600">
              {questions.length} questions in this module
            </div>
          )}
        </div>
      </Card>

      {selectedModule && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Questions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{question.question}</h3>
                    
                    {/* Options */}
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            index === question.correctAnswer 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-300'
                          }`}>
                            {index === question.correctAnswer && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className={`${
                            index === question.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-700'
                          }`}>
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        {question.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.marks} marks
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.questionType}
                      </Badge>
                      <Badge variant={question.isActive ? "default" : "secondary"} className="text-xs">
                        {question.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(question)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredQuestions.length === 0 && (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterDifficulty !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first question to this module.'
                  }
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Question
                </Button>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Create Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Question</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={questionData.question}
                  onChange={(e) => setQuestionData({...questionData, question: e.target.value})}
                  placeholder="Enter your question here..."
                />
              </div>

              <div>
                <Label>Options</Label>
                <div className="space-y-2">
                  {questionData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={questionData.correctAnswer === index}
                        onChange={() => setQuestionData({...questionData, correctAnswer: index})}
                        className="w-4 h-4"
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {questionData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addOption}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    value={questionData.marks}
                    onChange={(e) => setQuestionData({...questionData, marks: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={questionData.difficulty} onValueChange={(value) => setQuestionData({...questionData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Input
                  id="explanation"
                  value={questionData.explanation}
                  onChange={(e) => setQuestionData({...questionData, explanation: e.target.value})}
                  placeholder="Explain why this is the correct answer..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuestion}>
                  Create Question
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Question</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-question">Question</Label>
                <Input
                  id="edit-question"
                  value={questionData.question}
                  onChange={(e) => setQuestionData({...questionData, question: e.target.value})}
                  placeholder="Enter your question here..."
                />
              </div>

              <div>
                <Label>Options</Label>
                <div className="space-y-2">
                  {questionData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={questionData.correctAnswer === index}
                        onChange={() => setQuestionData({...questionData, correctAnswer: index})}
                        className="w-4 h-4"
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {questionData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addOption}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-marks">Marks</Label>
                  <Input
                    id="edit-marks"
                    type="number"
                    value={questionData.marks}
                    onChange={(e) => setQuestionData({...questionData, marks: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-difficulty">Difficulty</Label>
                  <Select value={questionData.difficulty} onValueChange={(value) => setQuestionData({...questionData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-explanation">Explanation (Optional)</Label>
                <Input
                  id="edit-explanation"
                  value={questionData.explanation}
                  onChange={(e) => setQuestionData({...questionData, explanation: e.target.value})}
                  placeholder="Explain why this is the correct answer..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditQuestion}>
                  Update Question
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Bulk Upload Questions</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-questions">Questions (JSON or CSV format)</Label>
                <textarea
                  id="bulk-questions"
                  value={bulkQuestions}
                  onChange={(e) => setBulkQuestions(e.target.value)}
                  placeholder={`JSON Format:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": 1,
    "explanation": "Paris is the capital of France",
    "marks": 1,
    "difficulty": "easy"
  }
]

OR CSV Format:
What is the capital of France?,London|Paris|Berlin|Madrid,1,Paris is the capital of France,1,easy`}
                  className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBulkUploadModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Questions
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
