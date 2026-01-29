// Transaction Types
export type TransactionType = 'borrow' | 'lend' | 'expense';
export type TransactionStatus = 'pending' | 'settled' | 'partial';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    personName?: string;
    category: string;
    description?: string;
    date: string;
    dueDate?: string;
    status: TransactionStatus;
    remainingAmount: number;
    receiptImages?: string[];  // Array of image URIs
    createdAt: string;
    updatedAt: string;
}

export interface Payment {
    id: string;
    transactionId: string;
    amount: number;
    date: string;
    note?: string;
}

export interface Attachment {
    id: string;
    transactionId: string;
    filePath: string;
    fileType?: string;
    createdAt: string;
}

// Category Types
export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'all';
}

// Person/Contact Types
export interface Person {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
    totalOwed: number;  // Positive = they owe you, Negative = you owe them
}

// Settings Types
export interface AppSettings {
    currency: string;
    currencySymbol: string;
    darkMode: boolean;
    biometricEnabled: boolean;
    autoLockMinutes: number;
    pinLength: number;
}

// Report Types
export interface DashboardSummary {
    totalBorrowed: number;
    totalLent: number;
    totalExpenses: number;
    netBalance: number;
    monthlyExpenses: number;
}

export interface CategorySummary {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    total: number;
    percentage: number;
}
