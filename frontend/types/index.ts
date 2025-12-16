// Shared TypeScript interfaces that match backend schemas

export interface Module {
  _id: string;             // MongoDB ObjectId
  title: string;
  description: string;
  ytVideoId: string;       // YouTube Video ID for iframe embedding
  tags: string[];
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleWithProgress {
  moduleId: string;
  title: string;
  description: string;
  ytVideoId: string;
  tags: string[];
  status: 'draft' | 'published';
  progress: number;         // Progress as decimal (0.0 to 1.0)
  quizAvailable: boolean;   // Whether quiz is available (progress >= 95%)
  quizInfo?: {              // Quiz information if available
    hasQuiz: boolean;
    questionCount: number;
    estimatedTime: number;
  } | null;
  // Personalised module fields
  isPersonalised?: boolean;
  personalisedReason?: string | null;
  personalisedPriority?: string | null;
  personalisedBy?: string | null;
  personalisedAt?: string | null;
  assignmentId?: string | null;
}

export interface Progress {
  _id: string;
  userId: string;
  videoId: string;
  currentTime: number;
  duration: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressData {
  [videoId: string]: {
    currentTime: number;
    duration: number;
  };
}

export interface UserProgressResponse {
  success: boolean;
  userId: string;
  progress: ProgressData;
}

export interface Question {
  id: string;
  moduleId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;     // Optional to match backend
  marks: number;
  difficulty: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  videoProgress: number;
  videoWatched: boolean;
  videoWatchedAt?: Date;    // Optional to match backend
  quizAttempts: any[];      // Array of quiz attempts
  bestScore: number;
  bestPercentage: number;
  passed: boolean;
  certificateIssued: boolean;
  certificateIssuedAt?: Date; // Optional to match backend
  completedAt?: Date;       // Optional to match backend
  lastAccessedAt: Date;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Module-specific response types
export interface ModuleStats {
  total: number;
  active: number;
  inactive: number;
  categories: Array<{ _id: string; count: number }>;
  difficulties: Array<{ _id: string; count: number }>;
}

export interface YouTubeVideoInfo {
  videoId: string;
  thumbnailUrl: string;
  embedUrl: string;
  message?: string;
}

// Quiz-specific types
export interface QuizQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  marks: number;
}

export interface Quiz {
  _id: string;
  moduleId: string | {
    _id: string;
    title: string;
    status: string;
    embedUrl: string;
    thumbnailUrl: string;
    id: string;
  };
  questions: QuizQuestion[];
  passPercent: number;
  isActive: boolean;
  totalQuestions: number;
  estimatedTime: number;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  answers: number[];
  score: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
  completedAt: Date;
}

export interface QuizResult {
  _id: string;
  userId: string;
  moduleId: {
    _id: string;
    title: string;
  };
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: Array<{
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  timeTaken: number;
  startedAt: string;
  completedAt: string;
  attemptNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizSubmissionData {
  userId: string;
  moduleId: string;
  answers: Array<{
    selectedOption: number;
    timeSpent: number;
  }>;
  timeTaken: number;
}
