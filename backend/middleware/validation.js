const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Please check your input data',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Authentication validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('userType')
    .isIn(['user', 'admin'])
    .withMessage('User type must be either "user" or "admin"'),
  handleValidationErrors
];

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^[\+]?[0-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 6 characters with uppercase, lowercase, and number'),
  handleValidationErrors
];

// User validation rules
const validateCreateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional()
    .matches(/^[\+]?[0-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('manager')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manager name cannot exceed 100 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  body('aadhaarNo')
    .optional()
    .matches(/^[0-9]{12}$/)
    .withMessage('Aadhaar number must be exactly 12 digits'),
  body('panNo')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('PAN number must be in format: ABCDE1234F'),
  handleValidationErrors
];

const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^[\+]?[0-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('status')
    .optional()
    .isIn(['Active', 'Warning', 'Audited', 'Inactive'])
    .withMessage('Status must be Active, Warning, Audited, or Inactive'),
  handleValidationErrors
];

// Module validation rules
const validateCreateModule = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid video URL'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('difficulty')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Difficulty must be Beginner, Intermediate, or Advanced'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
  handleValidationErrors
];

const validateSubmitQuiz = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array'),
  body('answers.*')
    .isInt({ min: 0 })
    .withMessage('Each answer must be a valid option index'),
  handleValidationErrors
];

// KPI validation rules
const validateKPIScore = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('tat')
    .isFloat({ min: 0, max: 100 })
    .withMessage('TAT must be between 0 and 100'),
  body('quality')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Quality must be between 0 and 100'),
  body('appUsage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('App Usage must be between 0 and 100'),
  body('negativity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Negativity must be between 0 and 100'),
  body('majorNegativity')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Major Negativity must be between 0 and 10'),
  body('neighborCheck')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Neighbor Check must be between 0 and 100'),
  body('generalNegativity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('General Negativity must be between 0 and 100'),
  body('insufficiency')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Insufficiency must be between 0 and 10'),
  body('period')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Period is required and cannot exceed 20 characters')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Period must be in YYYY-MM format'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters'),
  handleValidationErrors
];

// Award validation rules
const validateCreateAward = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('type')
    .isIn([
      'Employee of the Month',
      'Top Performer',
      'Quality Excellence',
      'Innovation Award',
      'Leadership Award',
      'Team Player',
      'Customer Service Excellence',
      'Sales Achievement',
      'Training Excellence',
      'Other'
    ])
    .withMessage('Please provide a valid award type'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('awardDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date'),
  handleValidationErrors
];

// Audit record validation rules
const validateCreateAuditRecord = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('type')
    .isIn(['warning', 'penalty', 'audit', 'performance_review', 'disciplinary', 'other'])
    .withMessage('Please provide a valid record type'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be low, medium, high, or critical'),
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid due date'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid ID'),
  handleValidationErrors
];

const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  handleValidationErrors
];

// Training assignment validation rules
const validateTrainingAssignment = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('trainingType')
    .isIn(['basic', 'negativity_handling', 'dos_donts', 'app_usage'])
    .withMessage('Training type must be one of: basic, negativity_handling, dos_donts, app_usage'),
  body('dueDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid due date'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors
];

const validateCompleteTraining = [
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors
];

// Audit scheduling validation rules
const validateScheduleKPIAudits = [
  body('kpiScoreId')
    .isMongoId()
    .withMessage('Please provide a valid KPI score ID'),
  handleValidationErrors
];

const validateManualSchedule = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('auditType')
    .isIn(['audit_call', 'cross_check', 'dummy_audit'])
    .withMessage('Audit type must be one of: audit_call, cross_check, dummy_audit'),
  body('scheduledDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid scheduled date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  body('auditScope')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Audit scope cannot exceed 500 characters'),
  body('auditMethod')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Audit method cannot exceed 500 characters'),
  handleValidationErrors
];

const validateCompleteAudit = [
  body('findings')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Findings must be between 10 and 2000 characters'),
  body('recommendations')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Recommendations cannot exceed 1000 characters'),
  body('riskLevel')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Risk level must be one of: low, medium, high, critical'),
  body('complianceStatus')
    .optional()
    .isIn(['compliant', 'non_compliant', 'partially_compliant', 'not_assessed'])
    .withMessage('Compliance status must be one of: compliant, non_compliant, partially_compliant, not_assessed'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateCreateUser,
  validateUpdateUser,
  validateCreateModule,
  validateSubmitQuiz,
  validateKPIScore,
  validateCreateAward,
  validateCreateAuditRecord,
  validateTrainingAssignment,
  validateCompleteTraining,
  validateScheduleKPIAudits,
  validateManualSchedule,
  validateCompleteAudit,
  validateObjectId,
  validateUserId,
  validatePagination
};