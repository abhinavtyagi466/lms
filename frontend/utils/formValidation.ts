// Form validation utility for user creation
export interface ValidationResult {
    isValid: boolean;
    error: string;
}

export const validateName = (name: string): ValidationResult => {
    if (!name.trim()) {
        return { isValid: false, error: 'Name is required' };
    }
    if (name.trim().length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    if (name.trim().length > 100) {
        return { isValid: false, error: 'Name must not exceed 100 characters' };
    }
    if (!/^[a-zA-Z\s.]+$/.test(name)) {
        return { isValid: false, error: 'Name can only contain letters, spaces, and dots' };
    }
    return { isValid: true, error: '' };
};

export const validateEmail = (email: string): ValidationResult => {
    if (!email.trim()) {
        return { isValid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true, error: '' };
};

export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }
    if (password.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters' };
    }
    return { isValid: true, error: '' };
};

export const validatePhone = (phone: string): ValidationResult => {
    if (!phone) {
        return { isValid: true, error: '' }; // Phone is optional
    }
    if (!/^\d+$/.test(phone)) {
        return { isValid: false, error: 'Phone number can only contain digits' };
    }
    if (phone.length !== 10) {
        return { isValid: false, error: 'Phone number must be exactly 10 digits' };
    }
    return { isValid: true, error: '' };
};

export const validateAadhaar = (aadhaar: string): ValidationResult => {
    if (!aadhaar) {
        return { isValid: true, error: '' }; // Aadhaar is optional
    }
    if (!/^\d+$/.test(aadhaar)) {
        return { isValid: false, error: 'Aadhaar can only contain digits' };
    }
    if (aadhaar.length !== 12) {
        return { isValid: false, error: 'Aadhaar must be exactly 12 digits' };
    }
    return { isValid: true, error: '' };
};

export const validatePAN = (pan: string): ValidationResult => {
    if (!pan) {
        return { isValid: true, error: '' }; // PAN is optional
    }
    const panUpper = pan.toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panUpper)) {
        return { isValid: false, error: 'PAN must be in format: ABCDE1234F' };
    }
    return { isValid: true, error: '' };
};

export const validateTextOnly = (text: string, fieldName: string): ValidationResult => {
    if (!text) {
        return { isValid: true, error: '' }; // Most text fields are optional
    }
    if (!/^[a-zA-Z\s.]+$/.test(text)) {
        return { isValid: false, error: `${fieldName} can only contain letters, spaces, and dots` };
    }
    return { isValid: true, error: '' };
};

export const sanitizeNumericInput = (value: string): string => {
    return value.replace(/\D/g, '');
};

export const sanitizePANInput = (value: string): string => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
};

export const sanitizeTextInput = (value: string): string => {
    return value.replace(/[^a-zA-Z\s.]/g, '');
};
