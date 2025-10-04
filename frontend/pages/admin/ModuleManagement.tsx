import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  BookOpen,
  Clock,
  Search,
  CheckCircle,
  FileQuestion,
  Upload,
  FileText
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AdminModuleForm } from '../../components/AdminModuleForm';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface Module {
  _id: string;
  title: string;
  description: string;
  ytVideoId: string;
  tags: string[];
  status: 'draft' | 'published';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Quiz {
  _id: string;
  moduleId: string | { _id: string; id?: string };
  questions: Array<{
    question: string;
    options: string[];
    correctOption: number;
    explanation?: string;
    marks: number;
  }>;
  passPercent: number;
  isActive: boolean;
  totalQuestions: number;
  estimatedTime: number;
  createdAt: string;
}

export const ModuleManagement: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showPersonalisedModal, setShowPersonalisedModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [createQuizData, setCreateQuizData] = useState({
    moduleId: '',
    passPercent: 70,
    estimatedTime: 10,
    questions: [] as Array<{
      question: string;
      options: string[];
      correctOption: number;
      explanation?: string;
      marks: number;
    }>
  });
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctOption: 0,
    explanation: '',
    marks: 1
  });

  // Personalised module state
  const [personalisedModuleData, setPersonalisedModuleData] = useState({
    userId: '',
    moduleId: '',
    reason: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });
  const [users, setUsers] = useState<Array<{_id: string, name: string, email: string, employeeId: string}>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreatingPersonalised, setIsCreatingPersonalised] = useState(false);


  useEffect(() => {
    fetchModules();
    fetchQuizzes();
    fetchUsers();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await apiService.modules.getAllModules();

      if (response && (response as any).data && (response as any).data.modules) {
        setModules((response as any).data.modules);
      } else if (response && (response as any).modules) {
        setModules((response as any).modules);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      console.log('=== FETCHING QUIZZES ===');
      const response = await apiService.quizzes.getAllQuizzes();
      console.log('Quiz API Response:', response);
      
      if (response && (response as any).data && (response as any).data.quizzes) {
        console.log('Setting quizzes from data.quizzes:', (response as any).data.quizzes);
        setQuizzes((response as any).data.quizzes);
      } else if (response && (response as any).quizzes) {
        console.log('Setting quizzes from response.quizzes:', (response as any).quizzes);
        setQuizzes((response as any).quizzes);
      } else if (Array.isArray(response)) {
        console.log('Setting quizzes from direct array response:', response);
        setQuizzes(response);
      } else {
        console.log('No quizzes found in response, setting empty array');
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await apiService.users.listSimple();
      const usersData = response.data?.users || response.data || [];
      console.log('Fetched users:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Helper function to get thumbnail URL
  const getThumbnailUrl = (videoId: string) => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Helper function to get quiz for a module
  const getModuleQuiz = (moduleId: string) => {
    console.log('=== GET MODULE QUIZ ===');
    console.log('Looking for quiz with moduleId:', moduleId);
    console.log('Available quizzes:', quizzes);
    console.log('Quiz count:', quizzes.length);
    
    // Handle both string and object moduleId formats
    const foundQuiz = quizzes.find(quiz => {
      if (typeof quiz.moduleId === 'string') {
        return quiz.moduleId === moduleId;
      } else if (quiz.moduleId && typeof quiz.moduleId === 'object') {
        return quiz.moduleId._id === moduleId || quiz.moduleId.id === moduleId;
      }
      return false;
    });
    
    console.log('Found quiz:', foundQuiz);
    if (foundQuiz) {
      console.log('Quiz details:', {
        id: foundQuiz._id,
        moduleId: foundQuiz.moduleId,
        questionsCount: foundQuiz.questions?.length || 0,
        isActive: foundQuiz.isActive
      });
    }
    return foundQuiz;
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.modules.deleteModule(moduleId);
      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success('Module deleted successfully');
        fetchModules();
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };

  const handleCreateQuiz = async () => {
    try {
      setIsCreatingQuiz(true);
      
      if (!createQuizData.moduleId || createQuizData.questions.length === 0) {
        toast.error('Module and at least one question are required');
        return;
      }

      const existingQuiz = getModuleQuiz(createQuizData.moduleId);
      
      let response;

      if (existingQuiz) {
        // Update existing quiz
        const updateData = {
          questions: createQuizData.questions,
          passPercent: createQuizData.passPercent
        };
        response = await apiService.quizzes.updateQuiz(createQuizData.moduleId, updateData);
      } else {
        // Create new quiz
        const createData = {
          moduleId: createQuizData.moduleId,
          questions: createQuizData.questions,
          passPercent: createQuizData.passPercent,
          estimatedTime: createQuizData.estimatedTime
        };
        console.log('Creating quiz with data:', createData);
        response = await apiService.quizzes.createQuiz(createData);
        console.log('Quiz creation response:', response);
      }

      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success(existingQuiz ? 'Quiz updated successfully' : 'Quiz created successfully');
        setShowQuizModal(false);
        setCreateQuizData({
          moduleId: '',
          passPercent: 70,
          estimatedTime: 10,
          questions: []
        });
        // Small delay to ensure backend processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Refresh both modules and quizzes to ensure UI updates
        console.log('Refreshing quizzes after creation...');
        await fetchQuizzes();
        console.log('Refreshing modules after creation...');
        await fetchModules();
        // Force a second refresh to ensure data is loaded
        setTimeout(async () => {
          console.log('Second refresh to ensure quiz is loaded...');
          await fetchQuizzes();
        }, 1000);
      } else {
        toast.error(existingQuiz ? 'Failed to update quiz' : 'Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating/updating quiz:', error);
      toast.error('Failed to create/update quiz');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.quizzes.deleteQuiz(moduleId);
      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success('Quiz deleted successfully');
        // Refresh both modules and quizzes to ensure UI updates
        await fetchQuizzes();
        await fetchModules();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const handleToggleQuizStatus = async (moduleId: string, isActive: boolean) => {
    try {
      const response = await apiService.quizzes.updateQuiz(moduleId, { isActive });
      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success(`Quiz ${isActive ? 'activated' : 'deactivated'} successfully`);
        // Refresh both modules and quizzes to ensure UI updates
        await fetchQuizzes();
        await fetchModules();
      }
    } catch (error) {
      console.error('Error updating quiz status:', error);
      toast.error('Failed to update quiz status');
    }
  };

  const handleUploadCSV = async () => {
    try {
      setIsUploadingCSV(true);
      
      if (!selectedModuleId) {
        toast.error('Please select a module first');
        return;
      }
      
      if (!csvData.trim()) {
        toast.error('Please enter CSV data');
        return;
      }

      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const questions: Array<{
        question: string;
        options: string[];
        correctOption: number;
        explanation?: string;
        marks: number;
      }> = [];

      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(part => part.trim());
        if (parts.length < 3) continue;

        const [question, optionA, optionB, optionC, optionD, correctOption, explanation] = parts;
        
        if (question && optionA && optionB && optionC && optionD) {
          const correctIndex = parseInt(correctOption) || 0;
          if (correctIndex >= 0 && correctIndex <= 3) {
            questions.push({
              question,
              options: [optionA, optionB, optionC, optionD],
              correctOption: correctIndex,
              explanation: explanation || '',
              marks: 1
            });
          }
        }
      }

      if (questions.length === 0) {
        toast.error('No valid questions found in CSV data');
        return;
      }

      console.log('Uploading CSV with questions:', questions);
      console.log('Selected module ID:', selectedModuleId);
      const response = await apiService.quizzes.uploadCsv(selectedModuleId, questions);
      console.log('CSV Upload response:', response);

      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success(`Quiz updated with ${questions.length} questions`);
        setShowCSVModal(false);
        setCsvData('');
        setSelectedModuleId('');
        // Refresh both modules and quizzes to ensure UI updates
        await fetchQuizzes();
        await fetchModules();
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Failed to upload CSV');
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleCreatePersonalisedModule = async () => {
    try {
      setIsCreatingPersonalised(true);
      
      if (!personalisedModuleData.userId || !personalisedModuleData.moduleId) {
        toast.error('Please select both user and module');
        return;
      }

      if (!personalisedModuleData.reason.trim()) {
        toast.error('Please provide a reason for personalisation');
        return;
      }

      // Create personalised module assignment
      const response = await apiService.modules.createPersonalisedModule({
        userId: personalisedModuleData.userId,
        moduleId: personalisedModuleData.moduleId,
        reason: personalisedModuleData.reason,
        priority: personalisedModuleData.priority
      });

      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success('Personalised module assigned successfully!');
        setShowPersonalisedModal(false);
        setPersonalisedModuleData({
          userId: '',
          moduleId: '',
          reason: '',
          priority: 'medium'
        });
        // Refresh modules to show updated data
        await fetchModules();
      }
    } catch (error) {
      console.error('Error creating personalised module:', error);
      toast.error('Failed to assign personalised module');
    } finally {
      setIsCreatingPersonalised(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Question is required');
      return;
    }

    // Filter out empty options and ensure at least 2 valid options
    const validOptions = currentQuestion.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error('At least 2 options are required');
      return;
    }

    // Create question with only valid options
    const questionToAdd = {
      ...currentQuestion,
      options: validOptions,
      // Ensure correctOption is within valid range
      correctOption: Math.min(currentQuestion.correctOption, validOptions.length - 1)
    };

    setCreateQuizData(prev => {
      const newData = {
        ...prev,
        questions: [...prev.questions, questionToAdd]
      };
      return newData;
    });

    // Reset form
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctOption: 0,
      explanation: '',
      marks: 1
    });

    toast.success('Question added successfully!');
  };

  const removeQuestion = (index: number) => {
    setCreateQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const downloadCSVTemplate = () => {
    const template = `question,optionA,optionB,optionC,optionD,correctOption,explanation
What is 2+2?,4,3,5,6,0,Basic arithmetic
What is the capital of France?,Paris,London,Berlin,Madrid,0,Geography question
What color is the sky?,Blue,Red,Green,Yellow,0,Basic observation`;
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

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === 'all' || module.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

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
          <h1 className="text-2xl font-semibold">Module Management</h1>
          <p className="text-gray-600">Manage training modules and videos</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={async () => {
              console.log('Manual refresh triggered...');
              await fetchQuizzes();
              await fetchModules();
            }}
            className="text-sm"
          >
            Refresh Data
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Module
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowPersonalisedModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Personalised Module
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Modules</p>
              <p className="text-2xl font-bold">{modules.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {modules.filter(m => m.status === 'published').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-yellow-600">
                {modules.filter(m => m.status === 'draft').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quizzes</p>
              <p className="text-2xl font-bold text-purple-600">
                {quizzes.length}
              </p>
            </div>
            <FileQuestion className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const moduleQuiz = getModuleQuiz(module._id);
          console.log(`Module ${module._id} (${module.title}) - Quiz found:`, moduleQuiz);
          console.log('Module ID type:', typeof module._id, 'Value:', module._id);
          
          return (
            <Card key={module._id} className="overflow-hidden">
              <div className="aspect-video bg-gray-200 relative">
                {getThumbnailUrl(module.ytVideoId) ? (
                  <img
                    src={getThumbnailUrl(module.ytVideoId)!}
                    alt={module.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Eye className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={module.status === 'published' ? 'default' : 'secondary'}>
                    {module.status}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {module.description}
                </p>
                
                {module.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {module.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {module.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{module.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Quiz Management Section */}
                <div className="mb-3 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Quiz Management</span>
                      </div>
                      {!moduleQuiz && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCreateQuizData(prev => ({ ...prev, moduleId: module._id }));
                            setShowQuizModal(true);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {moduleQuiz ? (
                    <div className="p-3 space-y-3">
                      {/* Quiz Status and Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={moduleQuiz.isActive ? 'default' : 'secondary'}>
                            {moduleQuiz.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {moduleQuiz.questions.length} questions
                          </span>
                          <span className="text-sm text-gray-500">
                            Pass: {moduleQuiz.passPercent}%
                          </span>
                          <span className="text-sm text-gray-500">
                            Time: {moduleQuiz.estimatedTime}min
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCreateQuizData(prev => ({ 
                                ...prev, 
                                moduleId: module._id,
                                passPercent: moduleQuiz.passPercent,
                                questions: moduleQuiz.questions
                              }));
                              setShowQuizModal(true);
                            }}
                            className="text-xs h-6 px-2"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleQuizStatus(module._id, !moduleQuiz.isActive)}
                            className={`text-xs h-6 px-2 ${
                              moduleQuiz.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'
                            }`}
                          >
                            {moduleQuiz.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteQuiz(module._id)}
                            className="text-red-600 hover:text-red-700 text-xs h-6 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Enhanced Quiz Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedModuleId(module._id);
                            setShowCSVModal(true);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          CSV Upload
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCreateQuizData(prev => ({ 
                              ...prev, 
                              moduleId: module._id,
                              passPercent: moduleQuiz.passPercent,
                              questions: moduleQuiz.questions
                            }));
                            setShowQuizModal(true);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Edit Quiz
                        </Button>
                      </div>
                      
                      {/* CSV Template Download */}
                      <div className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={downloadCSVTemplate}
                          className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Download CSV Template
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <p className="text-sm text-gray-500 text-center">No quiz available for this module</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCreateQuizData(prev => ({ ...prev, moduleId: module._id }));
                            setShowQuizModal(true);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Create Quiz
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedModuleId(module._id);
                            setShowCSVModal(true);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          CSV Upload
                        </Button>
                      </div>
                      
                      {/* CSV Template Download */}
                      <div className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={downloadCSVTemplate}
                          className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Download CSV Template
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created by {module.createdBy?.name || 'Unknown'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${module.ytVideoId}`, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteModule(module._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New YouTube Module</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <AdminModuleForm 
              onModuleCreated={() => {
                setShowCreateModal(false);
                fetchModules();
              }}
            />
          </div>
        </div>
      )}

      {/* Create/Edit Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {createQuizData.moduleId && getModuleQuiz(createQuizData.moduleId) ? 'Edit Quiz' : 'Create New Quiz'} for Module: {modules.find(m => m._id === createQuizData.moduleId)?.title || 'Unknown'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
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
                  <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    min="1"
                    max="120"
                    value={createQuizData.estimatedTime}
                    onChange={(e) => setCreateQuizData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Add Questions</h3>
                
                <div className="space-y-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="questionPrompt">Question *</Label>
                    <Input
                      id="questionPrompt"
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Enter your question"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctOption === index}
                          onChange={() => setCurrentQuestion(prev => ({ ...prev, correctOption: index }))}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <Label htmlFor="explanation">Explanation (Optional)</Label>
                    <Input
                      id="explanation"
                      value={currentQuestion.explanation}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                      placeholder="Explanation for the correct answer"
                    />
                  </div>
                  
                  <Button 
                    onClick={addQuestion} 
                    className="w-full"
                    disabled={!currentQuestion.question.trim() || currentQuestion.options.filter(opt => opt.trim()).length < 2}
                  >
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
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {index + 1}. {question.question}
                          </div>
                          <div className="text-xs text-gray-500">
                            Options: {question.options.join(', ')} | Correct: {question.options[question.correctOption]}
                          </div>
                        </div>
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
              
              {/* Quiz Summary */}
              <div className="border-t pt-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Quiz Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <span className="font-medium">Module:</span> {modules.find(m => m._id === createQuizData.moduleId)?.title || 'Not selected'}
                    </div>
                    <div>
                      <span className="font-medium">Questions:</span> {createQuizData.questions.length}
                    </div>
                    <div>
                      <span className="font-medium">Pass Percentage:</span> {createQuizData.passPercent}%
                    </div>
                    <div>
                      <span className="font-medium">Estimated Time:</span> {createQuizData.estimatedTime} minutes
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {createQuizData.questions.length > 0 ? 'Ready to create' : 'Add questions first'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreateQuiz}
                className="flex-1"
                disabled={createQuizData.questions.length === 0 || !createQuizData.moduleId || isCreatingQuiz}
              >
                {isCreatingQuiz ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {createQuizData.moduleId && getModuleQuiz(createQuizData.moduleId) ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  createQuizData.moduleId && getModuleQuiz(createQuizData.moduleId) ? 'Update Quiz' : 'Create Quiz'
                )}
              </Button>
              

              <Button
                variant="outline"
                onClick={() => {
                  setShowQuizModal(false);
                  setCreateQuizData({
                    moduleId: '',
                    passPercent: 70,
                    estimatedTime: 10,
                    questions: []
                  });
                }}
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
            <h2 className="text-xl font-semibold mb-4">
              Upload Questions via CSV for Module: {modules.find(m => m._id === selectedModuleId)?.title || 'Unknown'}
            </h2>
            
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
                  placeholder={`question,optionA,optionB,optionC,optionD,correctOption,explanation`} 
                  className="w-full h-32 p-2 border rounded-md"
                />
              </div>
              
              <div className="text-xs text-gray-600">
                <p><strong>CSV Format:</strong></p>
                <p>question,optionA,optionB,optionC,optionD,correctOption,explanation</p>
                <p>First row should be headers. correctOption: 0=A, 1=B, 2=C, 3=D</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUploadCSV}
                className="flex-1"
                disabled={isUploadingCSV || !selectedModuleId || !csvData.trim()}
              >
                {isUploadingCSV ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload CSV'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCSVModal(false);
                  setCsvData('');
                  setSelectedModuleId('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Personalised Module Modal */}
      {showPersonalisedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Assign Personalised Module
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="personalisedUser">Select User</Label>
                <Select
                  value={personalisedModuleData.userId}
                  onValueChange={(value) => setPersonalisedModuleData(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <SelectItem value="" disabled>
                        Loading users...
                      </SelectItem>
                    ) : users.length === 0 ? (
                      <SelectItem value="" disabled>
                        No users found
                      </SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name || 'Unknown'} ({user.employeeId || 'No ID'}) - {user.email || 'No email'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="personalisedModule">Select Module</Label>
                <Select
                  value={personalisedModuleData.moduleId}
                  onValueChange={(value) => setPersonalisedModuleData(prev => ({ ...prev, moduleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.filter(m => m.status === 'published').map((module) => (
                      <SelectItem key={module._id} value={module._id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="personalisedPriority">Priority</Label>
                <Select
                  value={personalisedModuleData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                    setPersonalisedModuleData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="personalisedReason">Reason for Personalisation</Label>
                <Input
                  id="personalisedReason"
                  placeholder="e.g., Performance improvement, Special training requirement..."
                  value={personalisedModuleData.reason}
                  onChange={(e) => setPersonalisedModuleData(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreatePersonalisedModule}
                disabled={isCreatingPersonalised}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                {isCreatingPersonalised ? 'Assigning...' : 'Assign Personalised Module'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPersonalisedModal(false);
                  setPersonalisedModuleData({
                    userId: '',
                    moduleId: '',
                    reason: '',
                    priority: 'medium'
                  });
                }}
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
