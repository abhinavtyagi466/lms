import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://feportal.foxivision.net/api'
  : '/api'; // Use proxy in development

// For static files (uploads) - separate from API
export const UPLOADS_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://feportal.foxivision.net'
  : 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: process.env.NODE_ENV === 'production', // Only use credentials in production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If data is FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);

    // Handle network errors (backend not running)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Backend server is not running. Please start the backend server.');
      // Don't redirect to login for network errors, just show error
      return Promise.reject(new Error('Backend server is not running. Please start the backend server on port 3001.'));
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear token and prevent further requests
      localStorage.removeItem('authToken');

      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('login') && !window.location.hash.includes('login')) {
        // Dispatch a custom event to notify components about auth failure
        window.dispatchEvent(new CustomEvent('auth-failed'));
        // Small delay to allow components to handle the event
        setTimeout(() => {
          window.location.href = '/#user-login';
        }, 100);
      }

      // Return a specific error that components can handle
      return Promise.reject(new Error('Authentication failed. Please login again.'));
    }

    if (error.response?.status === 404) {
      // Not found - log warning but don't throw error
      console.warn('API endpoint not found, using fallback data');
      return { data: null, error: 'Not found' };
    }

    if (error.response?.status === 503) {
      // Service unavailable
      console.log('Service unavailable');
      throw new Error('Service unavailable. Please try again later.');
    }

    // Handle 400 validation errors with details
    if (error.response?.status === 400 && error.response?.data?.details) {
      console.error('Validation errors:', error.response.data.details);
      const errorObj: any = new Error(error.response.data.message || 'Validation failed');
      errorObj.response = error.response.data;
      return Promise.reject(errorObj);
    }

    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// API Service Layer
export const apiService = {
  // Authentication APIs
  auth: {
    login: async (email: string, password: string, userType: 'user' | 'admin') => {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        userType
      });
      return response;
    },

    register: async (userData: {
      name: string;
      email: string;
      phone?: string;
      password: string;
    }) => {
      const response = await apiClient.post('/auth/register', userData);
      return response;
    },

    logout: async () => {
      const response = await apiClient.post('/auth/logout');
      return response;
    },

    getMe: async () => {
      const response = await apiClient.get('/auth/me');
      return response;
    },

    refreshToken: async () => {
      const response = await apiClient.post('/auth/refresh');
      return response;
    }
  },

  // User APIs
  users: {
    getProfile: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/profile`);
      return response;
    },

    getAllUsers: async (filters?: {
      filter?: string;
      page?: number;
      limit?: number;
      search?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.filter) params.append('filter', filters.filter);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get(`/users?${params.toString()}`);
      return response;
    },

    listSimple: async () => {
      const response = await apiClient.get('/users');
      return response;
    },

    getUserStats: async () => {
      const response = await apiClient.get('/users/stats');
      return response;
    },

    getUserById: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/profile`);
      return response;
    },

    createUser: async (userData: FormData | {
      name: string;
      email: string;
      password: string;
      phone?: string;
      userType?: string;
      dateOfBirth?: string;
      fathersName?: string;
      dateOfJoining?: string;
      designation?: string;
      department?: string;
      reportingManager?: string;
      highestEducation?: string;
      currentAddress?: string;
      nativeAddress?: string;
      location?: string;
      city?: string;
      state?: string;
      region?: string;
      aadhaarNo?: string;
      panNo?: string;
    }) => {
      const response = await apiClient.post('/users', userData, {
        headers: userData instanceof FormData ? {} : { 'Content-Type': 'application/json' }
      });
      return response;
    },

    updateUser: async (userId: string, userData: any) => {
      // If userData is FormData, don't set Content-Type header (let axios handle it)
      const config = userData instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
      const response = await apiClient.put(`/users/${userId}`, userData, config);
      return response;
    },

    deleteUser: async (userId: string) => {
      const response = await apiClient.delete(`/users/${userId}`);
      return response;
    },

    activateUser: async (userId: string) => {
      const response = await apiClient.put(`/users/${userId}/activate`);
      return response;
    },

    deactivateUser: async (userId: string) => {
      const response = await apiClient.put(`/users/${userId}/deactivate`);
      return response;
    },

    sendWarning: async (userId: string, message: string, attachment?: File) => {
      const formData = new FormData();
      formData.append('message', message);
      if (attachment) {
        formData.append('attachment', attachment);
      }
      const response = await apiClient.post(`/users/${userId}/warning`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    },

    sendCertificate: async (userId: string, title: string, message: string, attachment?: File) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('message', message);
      if (attachment) {
        formData.append('attachment', attachment);
      }
      const response = await apiClient.post(`/users/${userId}/certificate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    },

    getUserWarnings: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/warnings`);
      return response;
    },

    getUserCertificates: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/certificates`);
      return response;
    },

    setUserInactive: async (userId: string, inactiveReason: string, inactiveRemark?: string) => {
      const response = await apiClient.put(`/users/${userId}/set-inactive`, {
        inactiveReason,
        inactiveRemark
      });
      return response;
    },

    // Exit Management APIs
    setUserInactiveWithExitDetails: async (userId: string, formData: FormData) => {
      // Don't set Content-Type header manually - axios will set it automatically with boundary
      const response = await apiClient.put(`/users/${userId}/set-inactive`, formData);
      return response;
    },

    getExitRecords: async (filters?: {
      mainCategory?: string;
      verifiedBy?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.mainCategory) params.append('mainCategory', filters.mainCategory);
      if (filters?.verifiedBy) params.append('verifiedBy', filters.verifiedBy);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/users/exit-records?${params.toString()}`);
      return response;
    },

    getExitDetails: async (userId: string) => {
      const response = await apiClient.get(`/users/${userId}/exit-details`);
      return response;
    },

    downloadExitDocument: async (userId: string) => {
      const token = localStorage.getItem('authToken');
      window.open(`${API_BASE_URL}/users/${userId}/exit-document?token=${token}`, '_blank');
    },

    verifyExitDetails: async (userId: string, verifiedBy: string, remarks?: string) => {
      const response = await apiClient.put(`/users/${userId}/exit-details/verify`, {
        verifiedBy,
        remarks
      });
      return response;
    },

    exportExitRecords: async (filters?: {
      mainCategory?: string;
      verifiedBy?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.mainCategory) params.append('mainCategory', filters.mainCategory);
      if (filters?.verifiedBy) params.append('verifiedBy', filters.verifiedBy);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      try {
        const response: any = await apiClient.get(`/users/exit-records/export?${params.toString()}`, {
          responseType: 'blob'
        });

        // Create a blob from the response
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `exit-records-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
      } catch (error) {
        console.error('Export failed:', error);
        throw error;
      }
    },

    reactivateUser: async (userId: string) => {
      const response = await apiClient.put(`/users/${userId}/reactivate`);
      return response;
    }
  },

  // Training Module APIs
  modules: {
    getAllModules: async () => {
      const response = await apiClient.get('/modules');
      return response;
    },

    getUserModules: async (userId: string) => {
      const response = await apiClient.get(`/modules/user/${userId}`);
      return response;
    },

    getPublicModules: async () => {
      const response = await apiClient.get('/modules/public');
      return response;
    },

    getModule: async (moduleId: string) => {
      const response = await apiClient.get(`/modules/${moduleId}`);
      return response;
    },

    createModule: async (moduleData: {
      title: string;
      description?: string;
      ytVideoId: string;
      tags?: string[];
      status?: string;
    }) => {
      const response = await apiClient.post('/modules', moduleData);
      return response;
    },

    deleteModule: async (moduleId: string) => {
      const response = await apiClient.delete(`/modules/${moduleId}`);
      return response;
    },

    createPersonalisedModule: async (data: {
      userId: string;
      moduleId: string;
      reason: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    }) => {
      const response = await apiClient.post('/modules/personalised', data);
      return response;
    },

    getPersonalisedModules: async (userId: string) => {
      const response = await apiClient.get(`/modules/personalised/${userId}`);
      return response;
    },

    deletePersonalisedModule: async (moduleId: string) => {
      const response = await apiClient.delete(`/modules/personalised/${moduleId}`);
      return response;
    }
  },

  // Quiz APIs
  quizzes: {
    getAllQuizzes: async () => {
      const response = await apiClient.get('/quizzes');
      return response;
    },

    getQuiz: async (moduleId: string) => {
      const response = await apiClient.get(`/quizzes/${moduleId}`);
      return response;
    },

    createQuiz: async (quizData: {
      moduleId: string;
      questions: any[];
      passPercent?: number;
      estimatedTime?: number;
    }) => {
      const response = await apiClient.post('/quizzes', quizData);
      return response;
    },

    updateQuiz: async (moduleId: string, quizData: {
      questions?: any[];
      passPercent?: number;
      estimatedTime?: number;
      isActive?: boolean;
    }) => {
      const response = await apiClient.put(`/quizzes/${moduleId}`, quizData);
      return response;
    },

    deleteQuiz: async (moduleId: string) => {
      const response = await apiClient.delete(`/quizzes/${moduleId}`);
      return response;
    },

    uploadCsv: async (moduleId: string, csvData: any[]) => {
      const response = await apiClient.post(`/quizzes/${moduleId}/upload-csv`, { csvData });
      return response;
    },

    startQuiz: async (userId: string, moduleId: string) => {
      const response = await apiClient.post('/quiz/start', {
        userId,
        moduleId
      });
      return response;
    },

    submitQuiz: async (userId: string, moduleId: string, answers: any[], timeTaken: number, attemptId?: string) => {
      const response = await apiClient.post('/quiz/submit', {
        userId,
        moduleId,
        answers,
        timeTaken,
        attemptId
      });
      return response;
    },

    getQuizResults: async (userId: string) => {
      const response = await apiClient.get(`/quiz/results/${userId}`);
      return response;
    }
  },

  // Question Management APIs
  questions: {
    getModuleQuestions: async (moduleId: string, params?: { page?: number; limit?: number }) => {
      const response = await apiClient.get(`/questions/module/${moduleId}`, { params });
      return response;
    },

    // Get questions for users (for quizzes)
    getUserQuestions: async (moduleId: string) => {
      const response = await apiClient.get(`/questions/user/${moduleId}`);
      return response;
    },

    createQuestion: async (questionData: any) => {
      const response = await apiClient.post('/questions', questionData);
      return response;
    },

    updateQuestion: async (questionId: string, questionData: any) => {
      const response = await apiClient.put(`/questions/${questionId}`, questionData);
      return response;
    },

    deleteQuestion: async (questionId: string) => {
      const response = await apiClient.delete(`/questions/${questionId}`);
      return response;
    },

    bulkCreateQuestions: async (data: { moduleId: string; questions: any[] }) => {
      const response = await apiClient.post('/questions/bulk', data);
      return response;
    },

    getQuestion: async (questionId: string) => {
      const response = await apiClient.get(`/questions/${questionId}`);
      return response;
    },

    addQuestion: async (moduleId: string, questionData: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }) => {
      const response = await apiClient.post(`/modules/${moduleId}/questions`, questionData);
      return response;
    },

    removeQuestion: async (moduleId: string, questionId: string) => {
      const response = await apiClient.delete(`/modules/${moduleId}/questions/${questionId}`);
      return response;
    },
  },

  // User Progress APIs
  userProgress: {
    getAllUserProgress: async (userId: string) => {
      const response = await apiClient.get(`/user-progress/${userId}`);
      return response;
    },

    getUserProgress: async (userId: string, moduleId: string) => {
      const response = await apiClient.get(`/user-progress/${userId}/${moduleId}`);
      return response;
    },

    updateVideoProgress: async (userId: string, moduleId: string, progress: number) => {
      const response = await apiClient.put(`/user-progress/${userId}/${moduleId}/video`, { progress });
      return response;
    },

    submitQuiz: async (userId: string, moduleId: string, answers: number[]) => {
      const response = await apiClient.post(`/user-progress/${userId}/${moduleId}/quiz`, { answers });
      return response;
    },

    getUserStats: async (userId: string) => {
      const response = await apiClient.get(`/user-progress/${userId}/stats`);
      return response;
    },

    watchVideo: async (moduleId: string, watchPercentage: number = 100) => {
      const response = await apiClient.post(`/modules/${moduleId}/watch-video`, {
        watchPercentage
      });
      return response;
    },

    getCategories: async () => {
      const response = await apiClient.get('/modules/categories');
      return response;
    }
  },

  // YouTube Video Progress APIs
  progress: {
    updateProgress: async (progressData: {
      userId: string;
      videoId: string;
      currentTime: number;
      duration: number;
    }) => {
      const response = await apiClient.post('/progress', progressData);
      return response;
    },

    getUserProgress: async (userId: string) => {
      const response = await apiClient.get(`/progress/${userId}`);
      return response;
    },

    getVideoProgress: async (userId: string, videoId: string) => {
      const response = await apiClient.get(`/progress/${userId}/${videoId}`);
      return response;
    }
  },


  // Reports APIs
  reports: {
    getUserReports: async (userId: string) => {
      const response = await apiClient.get(`/reports/user/${userId}`);
      return response;
    },

    getAdminReports: async () => {
      const response = await apiClient.get('/reports/admin');
      return response;
    },

    getAdminStats: async () => {
      const response = await apiClient.get('/reports/admin/stats');
      return response;
    },

    getAllUserProgress: async (page: number = 1, limit: number = 100) => {
      const response = await apiClient.get(`/reports/admin/user-progress?page=${page}&limit=${limit}`);
      return response;
    },

    getPerformanceAnalytics: async (filters?: {
      startDate?: string;
      endDate?: string;
      department?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.department) params.append('department', filters.department);

      const response = await apiClient.get(`/reports/analytics/performance?${params.toString()}`);
      return response;
    },

    exportUsers: async (filters?: {
      format?: string;
      department?: string;
      status?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.format) params.append('format', filters.format);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.status) params.append('status', filters.status);

      const response = await apiClient.get(`/reports/export/users?${params.toString()}`);
      return response;
    },

    // NEW: User Score Reports Methods (ADDED WITHOUT TOUCHING EXISTING)
    getAllUserScores: async () => {
      const response = await apiClient.get('/reports/user-scores');
      return response;
    },

    exportUserScores: async (filters: any) => {
      const response = await apiClient.post('/reports/export-user-scores', filters);
      return response;
    },

    exportUserScoresPDF: async (filters: any) => {
      const response = await apiClient.post('/reports/export-user-scores-pdf', filters);
      return response;
    }
  },

  // Notifications APIs
  // Notification APIs moved to enhanced version below (line 1577+)
  // Keeping only admin-specific methods here
  notificationsAdmin: {
    getUserNotifications: async (userId: string, options?: {
      unreadOnly?: boolean;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await apiClient.get(`/notifications/user/${userId}?${params.toString()}`);
      return response;
    },

    sendNotification: async (notificationData: {
      userIds: string[];
      title: string;
      message: string;
      type?: string;
      priority?: string;
    }) => {
      const response = await apiClient.post('/notifications/send', notificationData);
      return response;
    }
  },


  // Awards APIs
  awards: {
    getUserAwards: async (userId: string) => {
      const response = await apiClient.get(`/awards/user/${userId}`);
      return response;
    },

    getAllAwards: async (filters?: {
      userId?: string;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/awards?${params.toString()}`);
      return response;
    },

    createAward: async (awardData: {
      userId: string;
      type: string;
      title?: string;
      description?: string;
      awardDate?: string;
      value?: number;
      criteria?: string;
    }) => {
      const response = await apiClient.post('/awards', awardData);
      return response;
    },

    sendCertificate: async (formData: FormData) => {
      console.log('=== API SERVICE DEBUG ===');
      console.log('Function: apiService.awards.sendCertificate');
      console.log('Endpoint: /awards/sendCertificate');
      console.log('FormData:', formData);
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      console.log('==========================');

      // IMPORTANT: Don't set Content-Type header manually for FormData
      // Let the browser set it automatically with the correct boundary
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/awards/sendCertificate', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
          // Content-Type will be set automatically by axios/browser
        }
      });

      console.log('API response:', response);
      return response.data;
    },

    getAwardStats: async () => {
      const response = await apiClient.get('/awards/statistics');
      return response;
    }
  },

  // Audit & Warning APIs
  audits: {
    getUserAudits: async (userId: string) => {
      const response = await apiClient.get(`/audits/user/${userId}`);
      return response;
    },

    getAllRecords: async (filters?: {
      status?: string;
      type?: string;
      userId?: string;
      page?: number;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/audits?${params.toString()}`);
      return response;
    },

    createRecord: async (recordData: {
      userId: string;
      type: string;
      reason: string;
      description?: string;
      severity?: string;
      dueDate?: string;
      actionRequired?: string;
    }) => {
      const response = await apiClient.post('/audits', recordData);
      return response;
    },

    sendNotice: async (formData: FormData) => {
      // Let browser set Content-Type with correct boundary
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/audits/sendNotice', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },

    listNotices: async () => {
      const response = await apiClient.get('/audits/notices');
      return response;
    }
  },

  // Lifecycle APIs
  lifecycle: {
    getUserLifecycle: async (userId: string, filters?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/lifecycle/${userId}?${params.toString()}`);
      return response;
    },

    getLifecycleStats: async (userId: string) => {
      const response = await apiClient.get(`/lifecycle/${userId}/statistics`);
      return response;
    },

    getRecentActivity: async (limit: number = 10) => {
      // Get recent lifecycle events from all users for admin dashboard
      const response = await apiClient.get(`/lifecycle/recent?limit=${limit}`);
      return response;
    },

    getSystemActivity: async (filters?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/lifecycle/system?${params.toString()}`);
      return response;
    }
  },

  // KPI APIs
  kpi: {
    getUserKPIScores: async (userId: string) => {
      const response = await apiClient.get(`/kpi/user/${userId}`);
      return response;
    },

    submitKPI: async (kpiData: {
      userId: string;
      period: string;
      comments?: string;
      // Enhanced raw data structure
      rawData: {
        totalCases: number;
        tatCases: number;
        majorNegEvents: number;
        clientComplaints: number;
        fatalIssues: number;
        opsRejections: number;
        neighborChecksRequired: number;
        neighborChecksDone: number;
        generalNegEvents: number;
        appCases: number;
        insuffCases: number;
      };
      // Legacy support for backward compatibility
      tat?: number;
      quality?: number;
      appUsage?: number;
      negativity?: number;
      majorNegativity?: number;
      neighborCheck?: number;
      generalNegativity?: number;
      insufficiency?: number;
    }) => {
      const response = await apiClient.post('/kpi', kpiData);
      return response;
    },

    getUserKPI: async (userId: string) => {
      const response = await apiClient.get(`/kpi/${userId}`);
      return response;
    },

    getUserKPIHistory: async (userId: string, limit?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get(`/kpi/${userId}/history?${params.toString()}`);
      return response;
    },

    updateKPI: async (kpiId: string, kpiData: {
      tat?: number;
      quality?: number;
      appUsage?: number;
      negativity?: number;
      majorNegativity?: number;
      neighborCheck?: number;
      generalNegativity?: number;
      insufficiency?: number;
      comments?: string;
    }) => {
      const response = await apiClient.put(`/kpi/${kpiId}`, kpiData);
      return response;
    },

    getKPITriggers: async (kpiId: string) => {
      const response = await apiClient.get(`/kpi/${kpiId}/triggers`);
      return response;
    },

    reprocessKPITriggers: async (kpiId: string) => {
      const response = await apiClient.post(`/kpi/${kpiId}/reprocess`);
      return response;
    },

    getKPIAutomationStatus: async (kpiId: string) => {
      const response = await apiClient.get(`/kpi/${kpiId}/automation-status`);
      return response;
    },

    getPendingAutomation: async (filters?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/kpi/pending-automation?${params.toString()}`);
      return response;
    },

    getKPIStats: async () => {
      const response = await apiClient.get('/kpi/overview/stats');
      return response;
    },

    getLowPerformers: async (threshold?: number) => {
      const params = new URLSearchParams();
      if (threshold) params.append('threshold', threshold.toString());

      const response = await apiClient.get(`/kpi/alerts/low-performers?${params.toString()}`);
      return response;
    },

    deleteKPI: async (kpiId: string) => {
      const response = await apiClient.delete(`/kpi/${kpiId}`);
      return response;
    },

    // Real Activity KPI methods
    generateRealActivityKPI: async (period: string, userId?: string) => {
      const response = await apiClient.post('/kpi/generate-real-activity', {
        period,
        userId
      });
      return response;
    },

    autoGenerateUserKPI: async (userId: string, activityType: string, activityData?: any) => {
      const response = await apiClient.post(`/kpi/auto-generate-user/${userId}`, {
        activityType,
        activityData
      });
      return response;
    },

    getRealActivitySummary: async (userId: string, period?: string) => {
      const params = new URLSearchParams();
      if (period) params.append('period', period);

      const response = await apiClient.get(`/kpi/real-activity-summary/${userId}?${params.toString()}`);
      return response;
    },

    // Enhanced KPI methods
    calculateFromRawData: async (userId: string, period: string, kpiConfigId?: string) => {
      const response = await apiClient.post('/kpi/calculate-from-raw', {
        userId,
        period,
        kpiConfigId
      });
      return response;
    },

    importRawData: async (events: any[], period: string, dataSource: string = 'manual_entry') => {
      const response = await apiClient.post('/kpi/import-raw-data', {
        events,
        period,
        dataSource
      });
      return response;
    },

    overrideKPI: async (kpiId: string, overrideData: {
      overrideScore: number;
      overrideRating: string;
      overrideReason: string;
    }) => {
      const response = await apiClient.put(`/kpi/${kpiId}/override`, overrideData);
      return response;
    },

    getKPITrends: async (userId: string, periods: number = 6) => {
      const response = await apiClient.get(`/kpi/${userId}/trends?periods=${periods}`);
      return response;
    },

    getKPIConfigs: async () => {
      const response = await apiClient.get('/kpi/configs');
      return response;
    },

    createKPIConfig: async (configData: any) => {
      const response = await apiClient.post('/kpi/configs', configData);
      return response;
    },

    updateKPIConfig: async (configId: string, configData: any) => {
      const response = await apiClient.put(`/kpi/configs/${configId}`, configData);
      return response;
    }
  },

  // Quiz Attempt APIs
  quizAttempts: {
    getUserQuizAttempts: async (userId: string, filters?: {
      moduleId?: string;
      limit?: number;
      page?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.moduleId) params.append('moduleId', filters.moduleId);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const response = await apiClient.get(`/quiz-attempts/user/${userId}?${params.toString()}`);
      return response;
    },

    getQuizAttemptStats: async (userId: string) => {
      const response = await apiClient.get(`/quiz-attempts/stats/${userId}`);
      return response;
    },

    getQuizAttemptHistory: async (userId: string, moduleId?: string) => {
      const params = new URLSearchParams();
      if (moduleId) params.append('moduleId', moduleId);

      const response = await apiClient.get(`/quiz-attempts/history/${userId}?${params.toString()}`);
      return response;
    },

    getQuizViolations: async (userId: string) => {
      const response = await apiClient.get(`/quiz-attempts/violations/${userId}`);
      return response;
    },

    // NEW: Get module scores (ADDED WITHOUT TOUCHING EXISTING)
    getModuleScores: async (userId: string) => {
      const response = await apiClient.get(`/quiz-attempts/module-scores/${userId}`);
      return response;
    },

    // Admin methods
    getAllQuizAttempts: async (filters?: {
      userId?: string;
      moduleId?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.moduleId) params.append('moduleId', filters.moduleId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/quiz-attempts?${params.toString()}`);
      return response;
    },

    getQuizAttemptAnalytics: async (filters?: {
      startDate?: string;
      endDate?: string;
      moduleId?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.moduleId) params.append('moduleId', filters.moduleId);

      const response = await apiClient.get(`/quiz-attempts/analytics?${params.toString()}`);
      return response;
    }
  },

  // User Activity APIs
  userActivity: {
    getActivitySummary: async (userId: string, days?: number) => {
      const params = new URLSearchParams();
      if (days) params.append('days', days.toString());

      const response = await apiClient.get(`/user-activity/summary/${userId}?${params.toString()}`);
      return response;
    },

    getLoginAttempts: async (userId: string, days?: number) => {
      const params = new URLSearchParams();
      if (days) params.append('days', days.toString());

      const response = await apiClient.get(`/user-activity/login-attempts/${userId}?${params.toString()}`);
      return response;
    },

    getSessionData: async (userId: string, days?: number) => {
      const params = new URLSearchParams();
      if (days) params.append('days', days.toString());

      const response = await apiClient.get(`/user-activity/sessions/${userId}?${params.toString()}`);
      return response;
    },

    getSuspiciousActivities: async (userId: string, days?: number) => {
      const params = new URLSearchParams();
      if (days) params.append('days', days.toString());

      const response = await apiClient.get(`/user-activity/suspicious/${userId}?${params.toString()}`);
      return response;
    },

    getRecentActivities: async (userId: string, filters?: {
      limit?: number;
      page?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const response = await apiClient.get(`/user-activity/recent/${userId}?${params.toString()}`);
      return response;
    },

    trackActivity: async (activityData: {
      activityType: string;
      description: string;
      metadata?: any;
      duration?: number;
      success?: boolean;
      errorMessage?: string;
      relatedEntity?: {
        type: string;
        id: string;
      };
    }) => {
      const response = await apiClient.post('/user-activity/track', activityData);
      return response;
    },

    // Admin methods
    getAdminAnalytics: async (days?: number) => {
      const params = new URLSearchParams();
      if (days) params.append('days', days.toString());

      const response = await apiClient.get(`/user-activity/admin/analytics?${params.toString()}`);
      return response;
    }
  },

  // Training Assignment APIs
  trainingAssignments: {
    getUserAssignments: async (userId: string, filters?: {
      page?: number;
      limit?: number;
      status?: string;
      trainingType?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.trainingType) params.append('trainingType', filters.trainingType);

      const response = await apiClient.get(`/training-assignments/user/${userId}?${params.toString()}`);
      return response;
    },

    autoAssign: async (kpiScoreId: string) => {
      const response = await apiClient.post('/training-assignments/auto-assign', { kpiScoreId });
      return response;
    },

    getPending: async (filters?: {
      page?: number;
      limit?: number;
      trainingType?: string;
      status?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.trainingType) params.append('trainingType', filters.trainingType);
      if (filters?.status) params.append('status', filters.status);

      const response = await apiClient.get(`/training-assignments/pending?${params.toString()}`);
      return response;
    },

    getOverdue: async (filters?: {
      page?: number;
      limit?: number;
      trainingType?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.trainingType) params.append('trainingType', filters.trainingType);

      const response = await apiClient.get(`/training-assignments/overdue?${params.toString()}`);
      return response;
    },

    completeTraining: async (assignmentId: string, data: {
      score?: number;
      notes?: string;
    }) => {
      const response = await apiClient.put(`/training-assignments/${assignmentId}/complete`, data);
      return response;
    },

    manualAssign: async (data: {
      userId: string;
      trainingType: string;
      dueDate: string;
      priority?: string;
      notes?: string;
    }) => {
      const response = await apiClient.post('/training-assignments/manual', data);
      return response;
    },

    cancelAssignment: async (assignmentId: string) => {
      const response = await apiClient.delete(`/training-assignments/${assignmentId}`);
      return response;
    },

    getStats: async (filters?: {
      trainingType?: string;
      status?: string;
      priority?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.trainingType) params.append('trainingType', filters.trainingType);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/training-assignments/stats?${params.toString()}`);
      return response;
    }
  },

  // Audit Scheduling APIs
  auditScheduling: {
    scheduleKPIAudits: async (kpiScoreId: string) => {
      const response = await apiClient.post('/audit-scheduling/schedule-kpi-audits', { kpiScoreId });
      return response;
    },

    getScheduled: async (filters?: {
      page?: number;
      limit?: number;
      auditType?: string;
      priority?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.auditType) params.append('auditType', filters.auditType);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/audit-scheduling/scheduled?${params.toString()}`);
      return response;
    },

    getOverdue: async (filters?: {
      page?: number;
      limit?: number;
      auditType?: string;
      priority?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.auditType) params.append('auditType', filters.auditType);
      if (filters?.priority) params.append('priority', filters.priority);

      const response = await apiClient.get(`/audit-scheduling/overdue?${params.toString()}`);
      return response;
    },

    completeAudit: async (auditId: string, data: {
      findings: string;
      recommendations?: string;
      riskLevel?: string;
      complianceStatus?: string;
    }) => {
      const response = await apiClient.put(`/audit-scheduling/${auditId}/complete`, data);
      return response;
    },

    getUserAuditHistory: async (userId: string, filters?: {
      page?: number;
      limit?: number;
      status?: string;
      auditType?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.auditType) params.append('auditType', filters.auditType);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/audit-scheduling/user/${userId}?${params.toString()}`);
      return response;
    },

    manualSchedule: async (data: {
      userId: string;
      auditType: string;
      scheduledDate: string;
      priority?: string;
      auditScope?: string;
      auditMethod?: string;
    }) => {
      const response = await apiClient.post('/audit-scheduling/manual', data);
      return response;
    },

    cancelAudit: async (auditId: string) => {
      const response = await apiClient.delete(`/audit-scheduling/${auditId}`);
      return response;
    },

    getStats: async (filters?: {
      auditType?: string;
      status?: string;
      priority?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.auditType) params.append('auditType', filters.auditType);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/audit-scheduling/stats?${params.toString()}`);
      return response;
    },

    getUpcoming: async (days?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (days) params.append('days', days.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get(`/audit-scheduling/upcoming?${params.toString()}`);
      return response;
    },

    getByKPIRating: async () => {
      const response = await apiClient.get('/audit-scheduling/by-kpi-rating');
      return response;
    }
  },

  // Recipient Groups APIs
  recipientGroups: {
    getAll: async (filters?: {
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/recipient-groups?${params.toString()}`);
      return response;
    },

    getById: async (groupId: string) => {
      const response = await apiClient.get(`/recipient-groups/${groupId}`);
      return response;
    },

    create: async (groupData: {
      name: string;
      description?: string;
      recipients?: Array<{
        email: string;
        name?: string;
        role?: string;
        department?: string;
      }>;
      criteria?: {
        userTypes?: string[];
        departments?: string[];
        roles?: string[];
        kpiRanges?: { min: number; max: number };
        trainingStatus?: string;
      };
    }) => {
      const response = await apiClient.post('/recipient-groups', groupData);
      return response;
    },

    update: async (groupId: string, updateData: any) => {
      const response = await apiClient.put(`/recipient-groups/${groupId}`, updateData);
      return response;
    },

    delete: async (groupId: string) => {
      const response = await apiClient.delete(`/recipient-groups/${groupId}`);
      return response;
    },

    addRecipient: async (groupId: string, recipientData: {
      email: string;
      name?: string;
      role?: string;
      department?: string;
    }) => {
      const response = await apiClient.post(`/recipient-groups/${groupId}/recipients`, recipientData);
      return response;
    },

    removeRecipient: async (groupId: string, email: string) => {
      const response = await apiClient.delete(`/recipient-groups/${groupId}/recipients/${email}`);
      return response;
    },

    getRecipients: async (groupId: string) => {
      const response = await apiClient.get(`/recipient-groups/${groupId}/recipients`);
      return response;
    },

    autoPopulate: async (groupId: string) => {
      const response = await apiClient.post(`/recipient-groups/${groupId}/auto-populate`);
      return response;
    },

    getStats: async () => {
      const response = await apiClient.get('/recipient-groups/stats/overview');
      return response;
    }
  },

  // Email Management APIs
  emailLogs: {
    getAll: async (filters?: {
      page?: number;
      limit?: number;
      templateType?: string;
      status?: string;
      recipientRole?: string;
      dateRange?: string;
      search?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.templateType) params.append('templateType', filters.templateType);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.recipientRole) params.append('recipientRole', filters.recipientRole);
      if (filters?.dateRange) params.append('dateRange', filters.dateRange);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get(`/email-logs?${params.toString()}`);
      return response;
    },

    getById: async (emailId: string) => {
      const response = await apiClient.get(`/email-logs/${emailId}`);
      return response;
    },

    getByUser: async (userId: string) => {
      const response = await apiClient.get(`/email-logs/user/${userId}`);
      return response;
    },

    resend: async (emailId: string) => {
      const response = await apiClient.post(`/email-logs/${emailId}/resend`);
      return response;
    },

    getStats: async () => {
      const response = await apiClient.get('/email-logs/stats/overview');
      return response;
    },

    retry: async (emailId: string) => {
      const response = await apiClient.post(`/email-logs/${emailId}/retry`);
      return response;
    },

    resendFailed: async (emailIds: string[]) => {
      const response = await apiClient.post('/email-logs/resend-failed', { emailIds });
      return response;
    },

    retryFailed: async (emailIds: string[]) => {
      const response = await apiClient.post('/email-logs/retry-failed', { emailIds });
      return response;
    },

    cancelScheduled: async (emailIds: string[]) => {
      const response = await apiClient.post('/email-logs/cancel-scheduled', { emailIds });
      return response;
    },

    schedule: async (data: {
      templateId: string;
      recipientGroupId: string;
      scheduledFor: string;
      subject: string;
      content: string;
    }) => {
      const response = await apiClient.post('/email-logs/schedule', data);
      return response;
    },

    export: async (filters?: {
      format?: string;
      templateType?: string;
      status?: string;
      recipientRole?: string;
      dateRange?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.format) params.append('format', filters.format);
      if (filters?.templateType) params.append('templateType', filters.templateType);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.recipientRole) params.append('recipientRole', filters.recipientRole);
      if (filters?.dateRange) params.append('dateRange', filters.dateRange);

      const response = await apiClient.get(`/email-logs/export?${params.toString()}`);
      return response;
    }
  },

  emailStats: {
    get: async (filters?: {
      startDate?: string;
      endDate?: string;
      templateType?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.templateType) params.append('templateType', filters.templateType);

      const response = await apiClient.get(`/email-stats?${params.toString()}`);
      return response;
    },

    getDeliveryStats: async (filters?: {
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/email-stats/delivery?${params.toString()}`);
      return response;
    },

    getTemplatePerformance: async (filters?: {
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get(`/email-stats/template-performance?${params.toString()}`);
      return response;
    }
  },

  // KPI Trigger APIs
  kpiTriggers: {
    uploadExcel: async (file: File, period: string) => {
      const formData = new FormData();
      formData.append('excelFile', file);
      formData.append('period', period);

      // Let browser set Content-Type with correct boundary
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/kpi-triggers/upload-excel', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },

    previewExcel: async (file: File, period: string) => {
      const formData = new FormData();
      formData.append('excelFile', file);
      formData.append('period', period);

      // Let browser set Content-Type with correct boundary
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/kpi-triggers/preview', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },

    getPending: async () => {
      const response = await apiClient.get('/kpi-triggers/pending');
      return response;
    },

    getUnmatched: async (params?: { period?: string; search?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.period) qs.append('period', params.period);
      if (params?.search) qs.append('search', params.search);
      if (params?.limit) qs.append('limit', String(params.limit));
      const response = await apiClient.get(`/kpi-triggers/unmatched?${qs.toString()}`);
      return response;
    },

    getHistory: async (userId: string, limit?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get(`/kpi-triggers/history/${userId}?${params.toString()}`);
      return response;
    },

    processSingle: async (userId: string | null, period: string, kpiData: any, sendEmail: boolean = false) => {
      const response = await apiClient.post('/kpi-triggers/process-single', {
        userId,
        period,
        kpiData,
        sendEmail
      });
      return response;
    },

    processBulk: async (period: string, kpiDataList: any[], sendEmail: boolean = false) => {
      const response = await apiClient.post('/kpi-triggers/process-bulk', {
        period,
        kpiDataList,
        sendEmail
      });
      return response;
    },

    downloadTemplate: async () => {
      const response = await apiClient.get('/kpi-triggers/template', {
        responseType: 'blob'
      });
      return response;
    },

    getUnmatched: async (params?: { period?: string; search?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.period) qs.append('period', params.period);
      if (params?.search) qs.append('search', params.search);
      if (params?.limit) qs.append('limit', String(params.limit));
      const response = await apiClient.get(`/kpi-triggers/unmatched?${qs.toString()}`);
      return response;
    },

    sendEmail: async (payload: { userId?: string; fallbackEmail?: string; template: string; data?: any }) => {
      const response = await apiClient.post('/kpi-triggers/send-email', payload);
      return response;
    }
  },

  // Email Template APIs
  emailTemplates: {
    getAll: async () => {
      const response = await apiClient.get('/email-templates');
      return response;
    },

    getById: async (id: string) => {
      const response = await apiClient.get(`/email-templates/${id}`);
      return response;
    },

    create: async (templateData: any) => {
      const response = await apiClient.post('/email-templates', templateData);
      return response;
    },

    update: async (id: string, templateData: any) => {
      const response = await apiClient.put(`/email-templates/${id}`, templateData);
      return response;
    },

    delete: async (id: string) => {
      const response = await apiClient.delete(`/email-templates/${id}`);
      return response;
    },

    preview: async (id: string, sampleData?: any) => {
      const response = await apiClient.post(`/email-templates/${id}/preview`, {
        sampleData
      });
      return response;
    },
    sendTest: async (id: string, testEmail: string) => {
      const response = await apiClient.post(`/email-templates/${id}/send-test`, {
        testEmail
      });
      return response;
    },
    sendCustom: async (emailData: {
      to: string;
      subject: string;
      content: string;
      fromUserId: string;
      fromUserEmail: string;
    }) => {
      const response = await apiClient.post('/email-templates/send-custom', emailData);
      return response;
    },


    getStats: async () => {
      const response = await apiClient.get('/email-templates/stats/usage');
      return response;
    }
  },

  // Notification APIs (Enhanced)
  notifications: {
    getAll: async (unreadOnly: boolean = false) => {
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unreadOnly', 'true');

      const response = await apiClient.get(`/notifications?${params.toString()}`);
      return response;
    },

    getById: async (id: string) => {
      const response = await apiClient.get(`/notifications/${id}`);
      return response;
    },

    markAsRead: async (notificationIds: string[]) => {
      const response = await apiClient.post('/notifications/mark-read', {
        notificationIds
      });
      return response;
    },

    markAllAsRead: async () => {
      const response = await apiClient.post('/notifications/mark-all-read');
      return response;
    },

    getUnreadCount: async () => {
      const response = await apiClient.get('/notifications/unread-count');
      return response;
    },

    acknowledge: async (id: string) => {
      const response = await apiClient.post(`/notifications/${id}/acknowledge`);
      return response;
    },

    getByType: async (type: string, limit?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get(`/notifications/type/${type}?${params.toString()}`);
      return response;
    },

    sendNotification: async (notificationData: {
      userIds: string[];
      title: string;
      message: string;
      type?: string;
      priority?: string;
    }) => {
      const response = await apiClient.post('/notifications/send', notificationData);
      return response;
    }
  },

  kpiConfiguration: {
    getAll: async () => {
      const response = await apiClient.get('/kpi-configuration');
      return response;
    },

    updateMetrics: async (metrics: any[]) => {
      const response = await apiClient.put('/kpi-configuration/metrics', { metrics });
      return response;
    },

    updateTriggers: async (triggers: any[]) => {
      const response = await apiClient.put('/kpi-configuration/triggers', { triggers });
      return response;
    },

    resetToDefaults: async () => {
      const response = await apiClient.post('/kpi-configuration/reset');
      return response;
    },

    exportConfiguration: async () => {
      const response = await apiClient.get('/kpi-configuration/export', {
        responseType: 'blob'
      });
      return response;
    }
  }
};
