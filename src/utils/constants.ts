// Default categories for expenses
export const DEFAULT_CATEGORIES = [
    { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#F97316' },
    { id: 'transport', name: 'Transportation', icon: '🚗', color: '#8B5CF6' },
    { id: 'utilities', name: 'Utilities', icon: '💡', color: '#06B6D4' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#EC4899' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#10B981' },
    { id: 'health', name: 'Health', icon: '🏥', color: '#EF4444' },
    { id: 'education', name: 'Education', icon: '📚', color: '#3B82F6' },
    { id: 'travel', name: 'Travel', icon: '✈️', color: '#14B8A6' },
    { id: 'rent', name: 'Rent', icon: '🏠', color: '#6366F1' },
    { id: 'other', name: 'Other', icon: '📦', color: '#64748B' },
];

// Currency options
export const CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
];

// Security settings
export const SECURITY = {
    MIN_PIN_LENGTH: 4,
    MAX_PIN_LENGTH: 6,
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 30000, // 30 seconds
    AUTO_LOCK_OPTIONS: [1, 5, 15, 30, 60], // minutes
};

// App info
export const APP_INFO = {
    name: 'Expense Manager',
    version: '1.0.0',
};

// Storage keys
export const STORAGE_KEYS = {
    PIN_HASH: 'pin_hash',
    PIN_SALT: 'pin_salt',
    BIOMETRIC_ENABLED: 'biometric_enabled',
    FIRST_LAUNCH: 'first_launch',
    SETTINGS: 'settings',
    SECURITY_QUESTIONS: 'security_questions',
    LAST_ACTIVE: 'last_active',
};
