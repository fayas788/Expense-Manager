import { create } from 'zustand';
import { Transaction, Payment, Category, Person, DashboardSummary, CategorySummary } from '../types';
import * as db from '../services/database';

interface TransactionState {
    transactions: Transaction[];
    categories: Category[];
    people: Person[];
    summary: DashboardSummary | null;
    categorySummary: CategorySummary[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadTransactions: () => Promise<void>;
    loadCategories: () => Promise<void>;
    loadPeople: () => Promise<void>;
    loadSummary: () => Promise<void>;
    loadCategorySummary: (startDate?: string, endDate?: string) => Promise<void>;

    addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    deletePerson: (personName: string) => Promise<void>;

    addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    addPayment: (transactionId: string, amount: number, note?: string, date?: string) => Promise<void>;
    getPayments: (transactionId: string) => Promise<Payment[]>;

    searchTransactions: (query: string) => Promise<Transaction[]>;
    filterByType: (type: string | null) => Promise<void>;
    filterByDateRange: (startDate: string, endDate: string) => Promise<void>;

    clearError: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
    transactions: [],
    categories: [],
    people: [],
    summary: null,
    categorySummary: [],
    isLoading: false,
    error: null,

    loadTransactions: async () => {
        try {
            set({ isLoading: true });
            const transactions = await db.getAllTransactions();
            set({ transactions, isLoading: false });
        } catch (error) {
            console.error('Error loading transactions:', error);
            set({ error: 'Failed to load transactions', isLoading: false });
        }
    },

    loadCategories: async () => {
        try {
            const categories = await db.getAllCategories();
            set({ categories });
        } catch (error) {
            console.error('Error loading categories:', error);
            set({ error: 'Failed to load categories' });
        }
    },

    loadPeople: async () => {
        try {
            const people = await db.getAllPeople();
            set({ people });
        } catch (error) {
            console.error('Error loading people:', error);
            set({ error: 'Failed to load people' });
        }
    },

    loadSummary: async () => {
        try {
            const summary = await db.getDashboardSummary();
            set({ summary });
        } catch (error) {
            console.error('Error loading summary:', error);
            set({ error: 'Failed to load summary' });
        }
    },

    loadCategorySummary: async (startDate?: string, endDate?: string) => {
        try {
            const categorySummary = await db.getCategorySummary(startDate, endDate);
            set({ categorySummary });
        } catch (error) {
            console.error('Error loading category summary:', error);
            set({ error: 'Failed to load category summary' });
        }
    },

    addTransaction: async (transaction) => {
        try {
            set({ isLoading: true });
            const newTransaction = await db.addTransaction(transaction);
            set(state => ({
                transactions: [newTransaction, ...state.transactions],
                isLoading: false
            }));
            // Refresh summary and people
            get().loadSummary();
            get().loadPeople();
            return newTransaction;
        } catch (error) {
            console.error('Error adding transaction:', error);
            set({ error: 'Failed to add transaction', isLoading: false });
            throw error;
        }
    },

    updateTransaction: async (id, updates) => {
        try {
            set({ isLoading: true });
            await db.updateTransaction(id, updates);
            set(state => ({
                transactions: state.transactions.map(t =>
                    t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                ),
                isLoading: false
            }));
            // Refresh summary and people
            get().loadSummary();
            get().loadPeople();
        } catch (error) {
            console.error('Error updating transaction:', error);
            set({ error: 'Failed to update transaction', isLoading: false });
            throw error;
        }
    },

    deleteTransaction: async (id) => {
        try {
            set({ isLoading: true });
            await db.deleteTransaction(id);
            set(state => ({
                transactions: state.transactions.filter(t => t.id !== id),
                isLoading: false
            }));
            // Refresh summary and people
            get().loadSummary();
            get().loadPeople();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            set({ error: 'Failed to delete transaction', isLoading: false });
            throw error;
        }
    },

    deletePerson: async (personName: string) => {
        try {
            set({ isLoading: true });
            await db.deletePerson(personName);
            // Refresh everything
            get().loadTransactions();
            get().loadSummary();
            get().loadPeople();
        } catch (error) {
            console.error('Error deleting person:', error);
            set({ error: 'Failed to delete person', isLoading: false });
            throw error;
        }
    },

    addCategory: async (category) => {
        try {
            set({ isLoading: true });
            const newCategory = await db.addCategory(category);
            set(state => ({
                categories: [...state.categories, newCategory],
                isLoading: false
            }));
            return newCategory;
        } catch (error) {
            console.error('Error adding category:', error);
            set({ error: 'Failed to add category', isLoading: false });
            throw error;
        }
    },

    updateCategory: async (id, updates) => {
        try {
            set({ isLoading: true });
            await db.updateCategory(id, updates);
            set(state => ({
                categories: state.categories.map(c =>
                    c.id === id ? { ...c, ...updates } : c
                ),
                isLoading: false
            }));
        } catch (error) {
            console.error('Error updating category:', error);
            set({ error: 'Failed to update category', isLoading: false });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            set({ isLoading: true });
            await db.deleteCategory(id);
            set(state => ({
                categories: state.categories.filter(c => c.id !== id),
                isLoading: false
            }));
        } catch (error) {
            console.error('Error deleting category:', error);
            set({ error: 'Failed to delete category', isLoading: false });
            throw error;
        }
    },

    addPayment: async (transactionId, amount, note, date) => {
        try {
            await db.addPayment({
                transactionId,
                amount,
                date: date || new Date().toISOString(),
                note
            });
            // Refresh the transaction
            const updatedTransaction = await db.getTransactionById(transactionId);
            if (updatedTransaction) {
                set(state => ({
                    transactions: state.transactions.map(t =>
                        t.id === transactionId ? updatedTransaction : t
                    )
                }));
            }
            // Refresh summary and people
            get().loadSummary();
            get().loadPeople();
        } catch (error) {
            console.error('Error adding payment:', error);
            set({ error: 'Failed to add payment' });
            throw error;
        }
    },

    getPayments: async (transactionId) => {
        try {
            return await db.getPaymentsByTransaction(transactionId);
        } catch (error) {
            console.error('Error getting payments:', error);
            return [];
        }
    },

    searchTransactions: async (query) => {
        try {
            if (!query.trim()) {
                return get().transactions;
            }
            return await db.searchTransactions(query);
        } catch (error) {
            console.error('Error searching transactions:', error);
            return [];
        }
    },

    filterByType: async (type) => {
        try {
            set({ isLoading: true });
            const transactions = type
                ? await db.getTransactionsByType(type)
                : await db.getAllTransactions();
            set({ transactions, isLoading: false });
        } catch (error) {
            console.error('Error filtering transactions:', error);
            set({ error: 'Failed to filter transactions', isLoading: false });
        }
    },

    filterByDateRange: async (startDate, endDate) => {
        try {
            set({ isLoading: true });
            const transactions = await db.getTransactionsByDateRange(startDate, endDate);
            set({ transactions, isLoading: false });
        } catch (error) {
            console.error('Error filtering transactions by date:', error);
            set({ error: 'Failed to filter transactions', isLoading: false });
        }
    },

    clearError: () => {
        set({ error: null });
    }
}));
