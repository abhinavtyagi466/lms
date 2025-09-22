// Test utilities and helpers for frontend integration tests

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { vi, Mock } from 'vitest';

// Mock API service
export const mockApiService = {
  kpi: {
    submitKPI: vi.fn(),
    getUserKPI: vi.fn(),
    getUserKPIHistory: vi.fn(),
    updateKPI: vi.fn(),
    getKPITriggers: vi.fn(),
    reprocessKPITriggers: vi.fn(),
    getKPIAutomationStatus: vi.fn(),
    getPendingAutomation: vi.fn(),
    getKPIStats: vi.fn(),
    getLowPerformers: vi.fn(),
    deleteKPI: vi.fn()
  },
  trainingAssignments: {
    autoAssign: vi.fn(),
    getPending: vi.fn(),
    getOverdue: vi.fn(),
    completeTraining: vi.fn(),
    getUserAssignments: vi.fn(),
    manualAssign: vi.fn(),
    cancelAssignment: vi.fn(),
    getStats: vi.fn()
  },
  auditScheduling: {
    scheduleKPIAudits: vi.fn(),
    getScheduled: vi.fn(),
    getOverdue: vi.fn(),
    completeAudit: vi.fn(),
    getUserAuditHistory: vi.fn(),
    manualSchedule: vi.fn(),
    cancelAudit: vi.fn(),
    getStats: vi.fn(),
    getUpcoming: vi.fn()
  },
  emailLogs: {
    getAll: vi.fn(),
    getById: vi.fn(),
    resend: vi.fn(),
    retry: vi.fn(),
    resendFailed: vi.fn(),
    retryFailed: vi.fn(),
    cancelScheduled: vi.fn(),
    schedule: vi.fn(),
    export: vi.fn()
  },
  emailTemplates: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    preview: vi.fn(),
    test: vi.fn()
  },
  recipientGroups: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    validate: vi.fn()
  },
  emailStats: {
    get: vi.fn(),
    getDeliveryStats: vi.fn(),
    getTemplatePerformance: vi.fn()
  }
};

// Mock user data
export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  role: 'field_executive',
  department: 'Sales',
  phone: '+1234567890',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

export const mockAdminUser = {
  _id: '507f1f77bcf86cd799439012',
  username: 'admin',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  department: 'Management',
  phone: '+1234567891',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

// Mock KPI data
export const mockKPIScore = {
  _id: '507f1f77bcf86cd799439021',
  userId: '507f1f77bcf86cd799439011',
  period: '2024-03',
  overallScore: 75,
  rating: 'good',
  tat: 85,
  majorNegativity: 1,
  quality: 90,
  neighborCheck: 80,
  generalNegativity: 15,
  appUsage: 95,
  insufficiency: 1,
  automationStatus: 'completed',
  processedAt: new Date('2024-03-15'),
  createdAt: new Date('2024-03-15'),
  updatedAt: new Date('2024-03-15')
};

// Mock training assignment data
export const mockTrainingAssignments = [
  {
    _id: '507f1f77bcf86cd799439031',
    userId: '507f1f77bcf86cd799439011',
    trainingType: 'basic',
    assignedBy: 'kpi_trigger',
    dueDate: new Date('2024-04-01'),
    status: 'assigned',
    kpiTriggerId: '507f1f77bcf86cd799439021',
    completionDate: null,
    score: null,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15')
  },
  {
    _id: '507f1f77bcf86cd799439032',
    userId: '507f1f77bcf86cd799439011',
    trainingType: 'negativity_handling',
    assignedBy: 'kpi_trigger',
    dueDate: new Date('2024-04-05'),
    status: 'in_progress',
    kpiTriggerId: '507f1f77bcf86cd799439021',
    completionDate: null,
    score: null,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-20')
  }
];

// Mock audit schedule data
export const mockAuditSchedules = [
  {
    _id: '507f1f77bcf86cd799439041',
    userId: '507f1f77bcf86cd799439011',
    auditType: 'audit_call',
    scheduledDate: new Date('2024-04-10'),
    status: 'scheduled',
    kpiTriggerId: '507f1f77bcf86cd799439021',
    completedDate: null,
    findings: null,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15')
  }
];

// Mock email log data
export const mockEmailLogs = [
  {
    _id: '507f1f77bcf86cd799439051',
    recipientEmail: 'test@example.com',
    recipientRole: 'field_executive',
    templateType: 'kpi_notification',
    subject: 'KPI Score Notification - March 2024',
    sentAt: new Date('2024-03-15T10:00:00Z'),
    status: 'sent',
    kpiTriggerId: '507f1f77bcf86cd799439021',
    errorMessage: null,
    createdAt: new Date('2024-03-15T10:00:00Z'),
    updatedAt: new Date('2024-03-15T10:00:00Z')
  }
];

// Mock notification data
export const mockNotifications = [
  {
    _id: '507f1f77bcf86cd799439071',
    userId: '507f1f77bcf86cd799439011',
    type: 'kpi_notification',
    title: 'KPI Score Available',
    message: 'Your KPI score for March 2024 is now available. Score: 75 (Good)',
    isRead: false,
    createdAt: new Date('2024-03-15T10:00:00Z'),
    updatedAt: new Date('2024-03-15T10:00:00Z')
  }
];

// Test wrapper with providers
export const TestWrapper: React.FC<{ children: React.ReactNode; user?: any }> = ({ 
  children, 
  user = mockUser 
}) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Custom render function
export const renderWithProviders = (
  ui: React.ReactElement,
  options: { user?: any } = {}
) => {
  return render(ui, {
    wrapper: ({ children }) => <TestWrapper user={options.user}>{children}</TestWrapper>,
    ...options
  });
};

// Mock API responses
export const mockApiResponses = {
  success: (data: any) => ({ success: true, data }),
  error: (message: string) => ({ success: false, error: message }),
  loading: () => new Promise(() => {}) // Never resolves
};

// Test helpers for form interactions
export const fillFormField = (label: string, value: string) => {
  const field = screen.getByLabelText(label);
  fireEvent.change(field, { target: { value } });
};

export const clickButton = (text: string) => {
  const button = screen.getByRole('button', { name: text });
  fireEvent.click(button);
};

export const selectOption = (label: string, option: string) => {
  const select = screen.getByLabelText(label);
  fireEvent.click(select);
  const optionElement = screen.getByText(option);
  fireEvent.click(optionElement);
};

export const checkCheckbox = (label: string) => {
  const checkbox = screen.getByLabelText(label);
  fireEvent.click(checkbox);
};

// Test helpers for async operations
export const waitForApiCall = async (mockFn: Mock) => {
  await waitFor(() => {
    expect(mockFn).toHaveBeenCalled();
  });
};

export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

export const waitForErrorMessage = async (message: string) => {
  await waitFor(() => {
    expect(screen.getByText(message)).toBeInTheDocument();
  });
};

export const waitForSuccessMessage = async (message: string) => {
  await waitFor(() => {
    expect(screen.getByText(message)).toBeInTheDocument();
  });
};

// Test helpers for table interactions
export const getTableRow = (text: string) => {
  return screen.getByRole('row', { name: new RegExp(text, 'i') });
};

export const getTableCell = (row: HTMLElement, columnName: string) => {
  const header = screen.getByRole('columnheader', { name: columnName });
  const columnIndex = Array.from(header.parentElement?.children || []).indexOf(header);
  return row.children[columnIndex];
};

// Test helpers for modal interactions
export const openModal = (triggerText: string) => {
  const trigger = screen.getByText(triggerText);
  fireEvent.click(trigger);
};

export const closeModal = () => {
  const closeButton = screen.getByRole('button', { name: /close/i });
  fireEvent.click(closeButton);
};

// Test helpers for navigation
export const navigateToPage = (pageName: string) => {
  const link = screen.getByRole('link', { name: pageName });
  fireEvent.click(link);
};

// Test helpers for file uploads
export const uploadFile = (input: HTMLInputElement, file: File) => {
  Object.defineProperty(input, 'files', {
    value: [file],
    writable: false
  });
  fireEvent.change(input);
};

// Test helpers for date inputs
export const setDateInput = (label: string, date: string) => {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value: date } });
};

// Test helpers for search and filtering
export const searchInTable = (searchTerm: string) => {
  const searchInput = screen.getByPlaceholderText(/search/i);
  fireEvent.change(searchInput, { target: { value: searchTerm } });
};

export const filterByStatus = (status: string) => {
  const statusFilter = screen.getByLabelText(/status/i);
  fireEvent.click(statusFilter);
  const option = screen.getByText(status);
  fireEvent.click(option);
};

// Test helpers for pagination
export const goToNextPage = () => {
  const nextButton = screen.getByRole('button', { name: /next/i });
  fireEvent.click(nextButton);
};

export const goToPreviousPage = () => {
  const prevButton = screen.getByRole('button', { name: /previous/i });
  fireEvent.click(prevButton);
};

// Test helpers for tabs
export const switchToTab = (tabName: string) => {
  const tab = screen.getByRole('tab', { name: tabName });
  fireEvent.click(tab);
};

// Test helpers for dropdowns
export const openDropdown = (buttonText: string) => {
  const button = screen.getByRole('button', { name: buttonText });
  fireEvent.click(button);
};

export const selectDropdownOption = (optionText: string) => {
  const option = screen.getByText(optionText);
  fireEvent.click(option);
};

// Test helpers for keyboard interactions
export const pressKey = (key: string, element?: HTMLElement) => {
  const target = element || document.body;
  fireEvent.keyDown(target, { key });
};

export const pressEnter = (element?: HTMLElement) => {
  pressKey('Enter', element);
};

export const pressEscape = (element?: HTMLElement) => {
  pressKey('Escape', element);
};

// Test helpers for accessibility
export const expectToBeAccessible = async () => {
  // This would integrate with axe-core for accessibility testing
  // For now, we'll just check for basic accessibility attributes
  const buttons = screen.getAllByRole('button');
  buttons.forEach(button => {
    expect(button).toHaveAttribute('type');
  });
};

// Test helpers for performance
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  await act(async () => {
    renderFn();
  });
  const end = performance.now();
  return end - start;
};

// Test helpers for error boundaries
export const triggerError = () => {
  throw new Error('Test error');
};

// Test helpers for localStorage
export const setLocalStorageItem = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

export const getLocalStorageItem = (key: string) => {
  return localStorage.getItem(key);
};

export const clearLocalStorage = () => {
  localStorage.clear();
};

// Test helpers for sessionStorage
export const setSessionStorageItem = (key: string, value: string) => {
  sessionStorage.setItem(key, value);
};

export const getSessionStorageItem = (key: string) => {
  return sessionStorage.getItem(key);
};

export const clearSessionStorage = () => {
  sessionStorage.clear();
};

// Test helpers for mocking timers
export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  vi.setSystemTime(mockDate);
};

export const restoreDate = () => {
  vi.useRealTimers();
};

// Test helpers for mocking fetch
export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response)
  });
};

export const mockFetchError = (error: string) => {
  global.fetch = vi.fn().mockRejectedValue(new Error(error));
};

// Test helpers for mocking window methods
export const mockWindowLocation = (href: string) => {
  delete (window as any).location;
  window.location = { href } as any;
};

export const mockWindowAlert = () => {
  window.alert = vi.fn();
};

export const mockWindowConfirm = (returnValue: boolean) => {
  window.confirm = vi.fn().mockReturnValue(returnValue);
};

// Test helpers for mocking IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Test helpers for mocking ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
};

// Test helpers for cleanup
export const cleanupMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
};

// Test helpers for assertions
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeVisible();
};

export const expectElementToBeHidden = (element: HTMLElement) => {
  expect(element).not.toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className);
};

export const expectElementToHaveAttribute = (element: HTMLElement, attribute: string, value?: string) => {
  if (value) {
    expect(element).toHaveAttribute(attribute, value);
  } else {
    expect(element).toHaveAttribute(attribute);
  }
};
