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
  FileText,
  Edit,
  User
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
import { ModalPortal } from '../../components/common/ModalPortal';
import { ConfirmationDialog } from '../../components/ui/confirmation-dialog';

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

interface PersonalisedModule {
  _id: string;
  moduleId: string;
  moduleTitle: string;
  moduleDescription: string;
  ytVideoId: string;
  tags: string[];
  status: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
  };
  assignedBy: {
    _id: string;
    name: string;
  } | null;
  reason: string;
  priority: string;
  assignedAt: string;
  dueDate: string;
}

export const ModuleManagement: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [personalisedModules, setPersonalisedModules] = useState<PersonalisedModule[]>([]);
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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', ''],  // Start with 2 options, can add more
    correctOption: 0,
    explanation: '',
    marks: 1
  });

  // Personalised module state
  const [personalisedModuleData, setPersonalisedModuleData] = useState({
    userId: '',
    moduleId: '',
    reason: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    userSearch: '' // For search functionality
  });
  const [users, setUsers] = useState<Array<{ _id: string, name: string, email: string, employeeId: string }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreatingPersonalised, setIsCreatingPersonalised] = useState(false);

  // NEW: Edit Questions State (ADDED WITHOUT TOUCHING EXISTING)
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{
    questionId: string;
    question: string;
    options: string[];
    correctOption: number;
    explanation: string;
    marks: number;
  } | null>(null);

  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false);

  // Delete Confirmation State
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);

  // Quiz Delete Confirmation State
  const [deleteQuizModuleId, setDeleteQuizModuleId] = useState<string | null>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);


  useEffect(() => {
    const loadData = async () => {
      await fetchModules();
      await fetchQuizzes();
      await fetchUsers();
      // fetchPersonalisedModules is defined below, call separately
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Use getAllUsers with active filter to ensure only active users are fetched
      const response = await apiService.users.getAllUsers({ filter: 'active', limit: 1000 });
      console.log('Raw API response:', response);

      // Handle different response structures
      let usersData = [];
      if (response && (response as any).users) {
        usersData = (response as any).users;
      } else if (response && response.data && response.data.users) {
        usersData = response.data.users;
      } else if (Array.isArray(response)) {
        usersData = response;
      } else if (response && Array.isArray(response.data)) {
        usersData = response.data;
      }

      console.log('Processed users data:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchPersonalisedModules = async () => {
    try {
      const response = await apiService.modules.getAllPersonalisedModules();
      if (response && (response as any).success) {
        setPersonalisedModules((response as any).data || []);
      } else if (response && (response as any).data) {
        setPersonalisedModules((response as any).data);
      }
    } catch (error) {
      console.error('Error fetching personalised modules:', error);
      setPersonalisedModules([]);
    }
  };

  // Fetch personalised modules on mount
  useEffect(() => {
    fetchPersonalisedModules();
  }, []);

  // Helper function to get thumbnail URL
  const getThumbnailUrl = (videoId: string) => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Helper function to get quiz for a module
  const getModuleQuiz = (moduleId: string) => {
    // Handle both string and object moduleId formats
    const foundQuiz = quizzes.find(quiz => {
      if (typeof quiz.moduleId === 'string') {
        return quiz.moduleId === moduleId;
      } else if (quiz.moduleId && typeof quiz.moduleId === 'object') {
        return quiz.moduleId._id === moduleId || quiz.moduleId.id === moduleId;
      }
      return false;
    });

    return foundQuiz;
  };

  const handleDeleteModule = async (moduleId: string) => {
    // Find the module to check its status
    const module = modules.find(m => m._id === moduleId);

    // Prevent deletion of published modules
    if (module?.status === 'published') {
      toast.error('Cannot delete published modules. Please unpublish it first.');
      return;
    }

    setDeleteModuleId(moduleId);
  };

  const executeDeleteModule = async () => {
    if (!deleteModuleId) return;

    try {
      const response = await apiService.modules.deleteModule(deleteModuleId);
      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success('Module deleted successfully');
        fetchModules();
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    } finally {
      setDeleteModuleId(null);
    }
  };

  const handleToggleModuleStatus = async (moduleId: string, currentStatus: 'draft' | 'published') => {
    // Only allow draft -> published, not published -> draft
    if (currentStatus === 'published') {
      toast.error('Cannot unpublish a module. Users may already be using it.');
      return;
    }

    const newStatus = 'published';
    const confirmMessage = 'Are you sure you want to publish this module? It will be visible to all users.';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await apiService.modules.updateModuleStatus(moduleId, newStatus);
      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success('Module published successfully');
        fetchModules();
      }
    } catch (error) {
      console.error('Error updating module status:', error);
      toast.error('Failed to update module status');
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

  const handleDeleteQuiz = (moduleId: string) => {
    setDeleteQuizModuleId(moduleId);
  };

  const executeDeleteQuiz = async () => {
    if (!deleteQuizModuleId) return;

    try {
      setIsDeletingQuiz(true);
      const response = await apiService.quizzes.deleteQuiz(deleteQuizModuleId);
      if (response && ((response as any).success || (response as any).data?.success)) {
        toast.success('Quiz deleted successfully');
        // Refresh both modules and quizzes to ensure UI updates
        await fetchQuizzes();
        await fetchModules();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    } finally {
      setIsDeletingQuiz(false);
      setDeleteQuizModuleId(null);
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);

    try {
      const text = await file.text();
      setCsvData(text);
      toast.success('CSV file loaded successfully');
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read CSV file');
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
        toast.error('Please upload a CSV file');
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
        setCsvFile(null);
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

      if (!personalisedModuleData.userId || !personalisedModuleData.moduleId ||
        personalisedModuleData.userId === 'loading' || personalisedModuleData.userId === 'no-users') {
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
          priority: 'medium',
          userSearch: ''
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
      options: ['', ''],  // Reset to 2 empty options
      correctOption: 0,
      explanation: '',
      marks: 1
    });

    toast.success('Question added successfully!');
  };

  // Add new option for current question
  const addQuestionOption = () => {
    if (currentQuestion.options.length >= 10) {
      toast.error('Maximum 10 options allowed');
      return;
    }
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  // Remove option from current question
  const removeQuestionOption = (indexToRemove: number) => {
    if (currentQuestion.options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    const newOptions = currentQuestion.options.filter((_, i) => i !== indexToRemove);
    // Adjust correctOption if needed
    let newCorrectOption = currentQuestion.correctOption;
    if (indexToRemove === newCorrectOption) {
      newCorrectOption = 0; // Reset to first option if correct was removed
    } else if (indexToRemove < newCorrectOption) {
      newCorrectOption--; // Shift down if removed option was before correct
    }
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions,
      correctOption: newCorrectOption
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

  // NEW: Edit Question Functions (ADDED WITHOUT TOUCHING EXISTING)
  const handleEditQuestion = (question: any, questionIndex: number) => {
    setEditingQuestion({
      questionId: `temp_${questionIndex}`, // Temporary ID for editing
      question: question.question,
      options: [...question.options],
      correctOption: question.correctOption,
      explanation: question.explanation || '',
      marks: question.marks || 1
    });
    setShowEditQuestionModal(true);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      setIsUpdatingQuestion(true);

      // Validate question
      if (!editingQuestion.question.trim()) {
        toast.error('Question is required');
        return;
      }

      const validOptions = editingQuestion.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        toast.error('At least 2 options are required');
        return;
      }

      // Update the question in the quiz data
      const questionIndex = parseInt(editingQuestion.questionId.replace('temp_', ''));
      setCreateQuizData(prev => ({
        ...prev,
        questions: prev.questions.map((q, index) =>
          index === questionIndex
            ? {
              ...q,
              question: editingQuestion.question,
              options: validOptions,
              correctOption: Math.min(editingQuestion.correctOption, validOptions.length - 1),
              explanation: editingQuestion.explanation,
              marks: editingQuestion.marks
            }
            : q
        )
      }));

      toast.success('Question updated successfully!');
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    } finally {
      setIsUpdatingQuestion(false);
    }
  };

  const handleDeleteQuestion = (questionIndex: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setCreateQuizData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, index) => index !== questionIndex)
      }));
      toast.success('Question deleted successfully!');
    }
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
              onClick={async () => {
                console.log('Manual refresh triggered...');
                await fetchQuizzes();
                await fetchModules();
              }}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white"
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
              {/* Hidden for now - will enable for client on request
              <option value="personalised">👤 Personalised</option>
              */}
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
          {/* Hidden for now - will enable for client on request
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">Personalised</p>
                <p className="text-2xl font-bold text-purple-600">
                  {personalisedModules.length}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          */}
        </div>

        {/* Modules Grid - Show only when NOT personalised filter */}
        {filterStatus !== 'personalised' && (
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
                              <Badge variant={moduleQuiz.isActive ? 'default' : 'secondary'} className={moduleQuiz.isActive ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}>
                                {moduleQuiz.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
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
                                className={`text-xs h-6 px-2 ${moduleQuiz.isActive ? 'text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50'
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
                        <button
                          onClick={() => handleToggleModuleStatus(module._id, module.status)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-1 ${module.status === 'published'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                          title={`Click to ${module.status === 'draft' ? 'publish' : 'unpublish'}`}
                        >
                          {module.status === 'published' ? '✓ Published' : '📝 Draft'}
                        </button>
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
                          disabled={module.status === 'published'}
                          title={module.status === 'published' ? 'Published modules cannot be deleted. Unpublish first.' : 'Delete Module'}
                          className={module.status === 'published' ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}
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
        )}

        {/* Personalised Modules Section */}
        {filterStatus === 'personalised' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Personalised Module Assignments
              </h2>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                {personalisedModules.length} Assignment{personalisedModules.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {personalisedModules.length === 0 ? (
              <Card className="p-8 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No personalised modules assigned yet</p>
                <p className="text-sm text-gray-400 mt-1">Use the "Personalised Module" button to assign modules to specific users</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalisedModules.map((pm) => (
                  <Card key={pm._id} className="overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-900/20 dark:to-gray-800">
                    <div className="aspect-video bg-gray-200 relative">
                      {pm.ytVideoId && (
                        <img
                          src={`https://img.youtube.com/vi/${pm.ytVideoId}/maxresdefault.jpg`}
                          alt={pm.moduleTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${pm.ytVideoId}/hqdefault.jpg`;
                          }}
                        />
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-purple-600 text-white">
                          <User className="w-3 h-3 mr-1" />
                          Personalised
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className={`${pm.priority === 'urgent' ? 'bg-red-500' :
                          pm.priority === 'high' ? 'bg-orange-500' :
                            pm.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                          } text-white`}>
                          {pm.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {pm.moduleTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {pm.moduleDescription || 'No description'}
                        </p>
                      </div>

                      {/* Assigned To Section */}
                      <div className="bg-purple-100/50 dark:bg-purple-900/30 rounded-lg p-2">
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Assigned To:</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{pm.assignedTo.name}</p>
                            <p className="text-xs text-gray-500">{pm.assignedTo.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      {pm.reason && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Reason:</span> {pm.reason}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Assigned: {new Date(pm.assignedAt).toLocaleDateString()}</span>
                        <Badge variant="outline" className={`${pm.status === 'completed' ? 'bg-green-100 text-green-700 border-green-300' :
                          pm.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                            'bg-yellow-100 text-yellow-700 border-yellow-300'
                          }`}>
                          {pm.status?.replace('_', ' ') || 'assigned'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Module Modal */}
        {
          showCreateModal && (
            <ModalPortal>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
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
            </ModalPortal>
          )
        }

        {/* Create/Edit Quiz Modal */}
        {
          showQuizModal && (
            <ModalPortal>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
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
                          disabled={true}
                        >
                          <SelectTrigger className="bg-gray-100 text-gray-500 cursor-not-allowed opacity-75">
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
                          <div className="flex items-center justify-between">
                            <Label>Options (min 2, max 10)</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={addQuestionOption}
                              disabled={currentQuestion.options.length >= 10}
                              className="text-xs h-6 px-2"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          {currentQuestion.options.map((option, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <span className="w-6 text-sm text-gray-500">{index + 1}.</span>
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...currentQuestion.options];
                                  newOptions[index] = e.target.value;
                                  setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                                }}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1"
                              />
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={currentQuestion.correctOption === index}
                                onChange={() => setCurrentQuestion(prev => ({ ...prev, correctOption: index }))}
                                title="Mark as correct answer"
                                className="w-4 h-4"
                              />
                              {currentQuestion.options.length > 2 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeQuestionOption(index)}
                                  className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <p className="text-xs text-gray-500">Select the radio button to mark correct answer</p>
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
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                              <div className="flex gap-1">
                                {/* NEW: Edit Button (ADDED WITHOUT TOUCHING EXISTING) */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditQuestion(question, index)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteQuestion(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
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
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
            </ModalPortal>
          )
        }

        {/* CSV Upload Modal */}
        {
          showCSVModal && (
            <ModalPortal>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700">
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
                        <SelectContent className="z-[200]">
                          {modules.map(module => (
                            <SelectItem key={module._id} value={module._id}>
                              {module.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="csvFile">Upload CSV File</Label>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="csvFile"
                          accept=".csv,text/csv"
                          onChange={handleFileChange}
                          className="block w-full text-sm text-gray-900
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-gray-800 file:text-white
                      hover:file:bg-gray-900
                      file:cursor-pointer
                      border border-gray-300 rounded-md p-2"
                        />
                      </div>
                      {csvFile && (
                        <p className="mt-2 text-sm text-gray-600">
                          Selected file: <span className="font-medium">{csvFile.name}</span>
                        </p>
                      )}
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
                      className="flex-1 bg-black hover:bg-gray-800 text-white"
                      disabled={isUploadingCSV || !selectedModuleId || !csvData.trim()}
                    >
                      {isUploadingCSV ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload CSV
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCSVModal(false);
                        setCsvData('');
                        setCsvFile(null);
                        setSelectedModuleId('');
                        // Reset file input
                        const fileInput = document.getElementById('csvFile') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </ModalPortal>
          )
        }

        {/* Personalised Module Modal */}
        {
          showPersonalisedModal && (
            <ModalPortal>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-purple-600" />
                    Assign Personalised Module
                  </h2>

                  <div className="space-y-4">


                    <div>
                      <Label htmlFor="personalisedUser">Search User</Label>
                      <div className="relative">
                        <Input
                          id="personalisedUser"
                          type="text"
                          placeholder="Type to search by name, employee ID, or email..."
                          value={personalisedModuleData.userSearch || ''}
                          onChange={(e) => {
                            const searchValue = e.target.value;
                            setPersonalisedModuleData(prev => ({
                              ...prev,
                              userSearch: searchValue,
                              userId: '' // Clear selection when searching
                            }));
                          }}
                          className="pr-10"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>

                      {/* Filtered Users List */}
                      {personalisedModuleData.userSearch && personalisedModuleData.userSearch.length > 0 && (
                        <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg bg-white dark:bg-gray-900">
                          {isLoadingUsers ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                              Loading users...
                            </div>
                          ) : (() => {
                            const searchTerm = personalisedModuleData.userSearch.toLowerCase();
                            const filteredUsers = users.filter(user =>
                              user.name?.toLowerCase().includes(searchTerm) ||
                              user.employeeId?.toLowerCase().includes(searchTerm) ||
                              user.email?.toLowerCase().includes(searchTerm)
                            );

                            return filteredUsers.length === 0 ? (
                              <div className="p-3 text-sm text-gray-500 text-center">
                                No users found matching "{personalisedModuleData.userSearch}"
                              </div>
                            ) : (
                              filteredUsers.map((user) => (
                                <div
                                  key={user._id}
                                  onClick={() => {
                                    setPersonalisedModuleData(prev => ({
                                      ...prev,
                                      userId: user._id,
                                      userSearch: '' // Clear search to hide dropdown
                                    }));
                                  }}
                                  className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-b-0 transition-colors ${personalisedModuleData.userId === user._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                >
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.name || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {user.employeeId || 'No ID'} - {user.email || 'No email'}
                                  </div>
                                </div>
                              ))
                            );
                          })()}
                        </div>
                      )}

                      {/* Selected User Display */}
                      {personalisedModuleData.userId && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Selected: {users.find(u => u._id === personalisedModuleData.userId)?.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-blue-700 dark:text-blue-300">
                                {users.find(u => u._id === personalisedModuleData.userId)?.employeeId || 'No ID'} - {users.find(u => u._id === personalisedModuleData.userId)?.email || 'No email'}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPersonalisedModuleData(prev => ({
                                  ...prev,
                                  userId: '',
                                  userSearch: ''
                                }));
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      )}
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
                        <SelectContent className="z-[200]">
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
                        <SelectContent className="z-[200]">
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
                          priority: 'medium',
                          userSearch: ''
                        });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </ModalPortal>
          )
        }

        {/* NEW: Edit Question Modal (ADDED WITHOUT TOUCHING EXISTING) */}
        {
          showEditQuestionModal && editingQuestion && (
            <ModalPortal>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Edit Question
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editQuestion">Question</Label>
                      <Input
                        id="editQuestion"
                        placeholder="Enter your question..."
                        value={editingQuestion.question}
                        onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, question: e.target.value } : null)}
                      />
                    </div>

                    <div>
                      <Label>Options</Label>
                      <div className="space-y-2">
                        {editingQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...editingQuestion.options];
                                newOptions[index] = e.target.value;
                                setEditingQuestion(prev => prev ? { ...prev, options: newOptions } : null);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newOptions = editingQuestion.options.filter((_, i) => i !== index);
                                setEditingQuestion(prev => prev ? { ...prev, options: newOptions } : null);
                              }}
                              disabled={editingQuestion.options.length <= 2}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingQuestion(prev => prev ? {
                              ...prev,
                              options: [...prev.options, '']
                            } : null);
                          }}
                          disabled={editingQuestion.options.length >= 6}
                        >
                          Add Option
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="editCorrectOption">Correct Option</Label>
                      <Select
                        value={editingQuestion.correctOption.toString()}
                        onValueChange={(value) => setEditingQuestion(prev => prev ? {
                          ...prev,
                          correctOption: parseInt(value)
                        } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct option..." />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                          {editingQuestion.options.map((option, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              Option {index + 1}: {option || 'Empty'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="editExplanation">Explanation (Optional)</Label>
                      <Input
                        id="editExplanation"
                        placeholder="Explain why this is the correct answer..."
                        value={editingQuestion.explanation}
                        onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, explanation: e.target.value } : null)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="editMarks">Marks</Label>
                      <Input
                        id="editMarks"
                        type="number"
                        min="1"
                        max="10"
                        value={editingQuestion.marks}
                        onChange={(e) => setEditingQuestion(prev => prev ? {
                          ...prev,
                          marks: parseInt(e.target.value) || 1
                        } : null)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleUpdateQuestion}
                      disabled={isUpdatingQuestion}
                      className="bg-blue-600 hover:bg-blue-700 flex-1"
                    >
                      {isUpdatingQuestion ? 'Updating...' : 'Update Question'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEditQuestionModal(false);
                        setEditingQuestion(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </ModalPortal>
          )
        }

        <ConfirmationDialog
          isOpen={!!deleteModuleId}
          onClose={() => setDeleteModuleId(null)}
          onConfirm={executeDeleteModule}
          title="Delete Module"
          description="Are you sure you want to delete this module? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />

        <ConfirmationDialog
          isOpen={!!deleteQuizModuleId}
          onClose={() => setDeleteQuizModuleId(null)}
          onConfirm={executeDeleteQuiz}
          title="Delete Quiz"
          description="Are you sure you want to delete this quiz? This action cannot be undone and all questions will be removed."
          confirmText="Delete Quiz"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeletingQuiz}
        />
      </div>
    </div>
  );
};
