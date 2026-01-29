/**
 * Validate PIN format
 */
export const validatePin = (pin: string, minLength: number = 4, maxLength: number = 6): {
    valid: boolean;
    error?: string
} => {
    if (!pin) {
        return { valid: false, error: 'PIN is required' };
    }

    if (!/^\d+$/.test(pin)) {
        return { valid: false, error: 'PIN must contain only numbers' };
    }

    if (pin.length < minLength) {
        return { valid: false, error: `PIN must be at least ${minLength} digits` };
    }

    if (pin.length > maxLength) {
        return { valid: false, error: `PIN must not exceed ${maxLength} digits` };
    }

    // Check for sequential patterns
    const sequential = '01234567890';
    const reverseSequential = '09876543210';
    if (sequential.includes(pin) || reverseSequential.includes(pin)) {
        return { valid: false, error: 'PIN should not be a sequential pattern' };
    }

    // Check for repeated digits
    if (/^(\d)\1+$/.test(pin)) {
        return { valid: false, error: 'PIN should not be all the same digit' };
    }

    return { valid: true };
};

/**
 * Validate transaction amount
 */
export const validateAmount = (amount: string | number): {
    valid: boolean;
    value: number;
    error?: string
} => {
    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numValue)) {
        return { valid: false, value: 0, error: 'Invalid amount' };
    }

    if (numValue <= 0) {
        return { valid: false, value: 0, error: 'Amount must be greater than 0' };
    }

    if (numValue > 999999999) {
        return { valid: false, value: 0, error: 'Amount is too large' };
    }

    return { valid: true, value: numValue };
};

/**
 * Validate person name
 */
export const validatePersonName = (name: string): {
    valid: boolean;
    error?: string
} => {
    if (!name || !name.trim()) {
        return { valid: false, error: 'Name is required' };
    }

    if (name.length < 2) {
        return { valid: false, error: 'Name must be at least 2 characters' };
    }

    if (name.length > 100) {
        return { valid: false, error: 'Name is too long' };
    }

    return { valid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    return phoneRegex.test(phone);
};
