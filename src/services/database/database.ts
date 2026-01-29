import * as SQLite from 'expo-sqlite';
import {
    Transaction,
    Payment,
    Attachment,
    Category,
    Person,
    DashboardSummary,
    CategorySummary
} from '../../types';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import { v4 as uuidv4 } from 'uuid';

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize database
 */
export const initDatabase = async (): Promise<void> => {
    try {
        database = await SQLite.openDatabaseAsync('expense_manager.db');

        // Create tables
        await database.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        person_name TEXT,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        due_date TEXT,
        status TEXT DEFAULT 'pending',
        remaining_amount REAL,
        created_at TEXT,
        updated_at TEXT
      );
      
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        created_at TEXT,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        type TEXT
      );
      
      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        notes TEXT
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
    `);

        // Initialize default categories if empty
        const categoryCount = await database.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM categories'
        );

        if (categoryCount && categoryCount.count === 0) {
            for (const cat of DEFAULT_CATEGORIES) {
                await database.runAsync(
                    'INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)',
                    [cat.id, cat.name, cat.icon, cat.color, 'expense']
                );
            }
        }

        // Migration: Add due_date column if it doesn't exist (for existing databases)
        try {
            await database.execAsync(`
                ALTER TABLE transactions ADD COLUMN due_date TEXT;
            `);
        } catch (e) {
            // Column already exists, ignore error
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

/**
 * Get database instance
 */
export const getDatabase = (): SQLite.SQLiteDatabase => {
    if (!database) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return database;
};

// ==================== TRANSACTIONS ====================

/**
 * Get all transactions
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM transactions ORDER BY date DESC');
    return rows.map(mapRowToTransaction);
};

/**
 * Get transactions by type
 */
export const getTransactionsByType = async (type: string): Promise<Transaction[]> => {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
        'SELECT * FROM transactions WHERE type = ? ORDER BY date DESC',
        [type]
    );
    return rows.map(mapRowToTransaction);
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
    const db = getDatabase();
    const row = await db.getFirstAsync<any>(
        'SELECT * FROM transactions WHERE id = ?',
        [id]
    );
    return row ? mapRowToTransaction(row) : null;
};

/**
 * Add new transaction
 */
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO transactions 
    (id, type, amount, person_name, category, description, date, due_date, status, remaining_amount, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            transaction.type,
            transaction.amount,
            transaction.personName || null,
            transaction.category,
            transaction.description || null,
            transaction.date,
            transaction.dueDate || null,
            transaction.status,
            transaction.remainingAmount,
            now,
            now
        ]
    );

    return {
        ...transaction,
        id,
        createdAt: now,
        updatedAt: now
    };
};

/**
 * Update transaction
 */
export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const db = getDatabase();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
    if (updates.personName !== undefined) { fields.push('person_name = ?'); values.push(updates.personName); }
    if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
    if (updates.dueDate !== undefined) { fields.push('due_date = ?'); values.push(updates.dueDate); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.remainingAmount !== undefined) { fields.push('remaining_amount = ?'); values.push(updates.remainingAmount); }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(
        `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (id: string): Promise<void> => {
    const db = getDatabase();
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

/**
 * Search transactions
 */
export const searchTransactions = async (query: string): Promise<Transaction[]> => {
    const db = getDatabase();
    const searchPattern = `%${query}%`;
    const rows = await db.getAllAsync<any>(
        `SELECT * FROM transactions 
     WHERE person_name LIKE ? OR description LIKE ? OR category LIKE ?
     ORDER BY date DESC`,
        [searchPattern, searchPattern, searchPattern]
    );
    return rows.map(mapRowToTransaction);
};

/**
 * Get transactions by date range
 */
export const getTransactionsByDateRange = async (
    startDate: string,
    endDate: string
): Promise<Transaction[]> => {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
        'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [startDate, endDate]
    );
    return rows.map(mapRowToTransaction);
};

// ==================== PAYMENTS ====================

/**
 * Get payments for a transaction
 */
export const getPaymentsByTransaction = async (transactionId: string): Promise<Payment[]> => {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
        'SELECT * FROM payments WHERE transaction_id = ? ORDER BY date DESC',
        [transactionId]
    );
    return rows.map(mapRowToPayment);
};

/**
 * Add payment
 */
export const addPayment = async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
    const db = getDatabase();
    const id = uuidv4();

    await db.runAsync(
        'INSERT INTO payments (id, transaction_id, amount, date, note) VALUES (?, ?, ?, ?, ?)',
        [id, payment.transactionId, payment.amount, payment.date, payment.note || null]
    );

    // Update transaction remaining amount and status
    const transaction = await getTransactionById(payment.transactionId);
    if (transaction) {
        const newRemaining = transaction.remainingAmount - payment.amount;
        const newStatus = newRemaining <= 0 ? 'settled' : 'partial';
        await updateTransaction(payment.transactionId, {
            remainingAmount: Math.max(0, newRemaining),
            status: newStatus
        });
    }

    return { ...payment, id };
};

// ==================== CATEGORIES ====================

/**
 * Get all categories
 */
export const getAllCategories = async (): Promise<Category[]> => {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM categories ORDER BY name');
    return rows.map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        type: row.type
    }));
};

// ==================== PEOPLE ====================

/**
 * Get all people with balances
 */
export const getAllPeople = async (): Promise<Person[]> => {
    const db = getDatabase();

    const rows = await db.getAllAsync<any>(`
    SELECT 
      COALESCE(person_name, 'Unknown') as name,
      SUM(CASE 
        WHEN type = 'lend' AND status != 'settled' THEN remaining_amount
        WHEN type = 'borrow' AND status != 'settled' THEN -remaining_amount
        ELSE 0 
      END) as total_owed
    FROM transactions 
    WHERE person_name IS NOT NULL AND type IN ('borrow', 'lend')
    GROUP BY person_name
    ORDER BY ABS(total_owed) DESC
  `);

    return rows.map((row, index) => ({
        id: `person_${index}`,
        name: row.name,
        totalOwed: row.total_owed || 0
    }));
};

/**
 * Get transactions for a person
 */
export const getTransactionsByPerson = async (personName: string): Promise<Transaction[]> => {
    const db = getDatabase();
    const rows = await db.getAllAsync<any>(
        'SELECT * FROM transactions WHERE person_name = ? ORDER BY date DESC',
        [personName]
    );
    return rows.map(mapRowToTransaction);
};

/**
 * Delete a person (deletes all transactions for that person)
 */
export const deletePerson = async (personName: string): Promise<void> => {
    const db = getDatabase();
    // Delete all transactions associated with this person
    await db.runAsync('DELETE FROM transactions WHERE person_name = ?', [personName]);
};

// ==================== REPORTS ====================

/**
 * Get dashboard summary
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const db = getDatabase();

    const result = await db.getFirstAsync<any>(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'borrow' AND status != 'settled' THEN remaining_amount ELSE 0 END), 0) as total_borrowed,
      COALESCE(SUM(CASE WHEN type = 'lend' AND status != 'settled' THEN remaining_amount ELSE 0 END), 0) as total_lent,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
    FROM transactions
  `);

    // Get this month's expenses
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyResult = await db.getFirstAsync<any>(`
    SELECT COALESCE(SUM(amount), 0) as monthly_expenses
    FROM transactions 
    WHERE type = 'expense' AND date >= ?
  `, [startOfMonth.toISOString()]);

    return {
        totalBorrowed: result?.total_borrowed || 0,
        totalLent: result?.total_lent || 0,
        totalExpenses: result?.total_expenses || 0,
        netBalance: (result?.total_lent || 0) - (result?.total_borrowed || 0),
        monthlyExpenses: monthlyResult?.monthly_expenses || 0
    };
};

/**
 * Get category-wise expense summary
 */
export const getCategorySummary = async (
    startDate?: string,
    endDate?: string
): Promise<CategorySummary[]> => {
    const db = getDatabase();

    let query = `
    SELECT 
      t.category,
      c.name as category_name,
      c.color as category_color,
      SUM(t.amount) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category = c.id
    WHERE t.type = 'expense'
  `;

    const params: string[] = [];

    if (startDate) {
        query += ' AND t.date >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND t.date <= ?';
        params.push(endDate);
    }

    query += ' GROUP BY t.category ORDER BY total DESC';

    const rows = await db.getAllAsync<any>(query, params);

    const total = rows.reduce((sum, row) => sum + (row.total || 0), 0);

    return rows.map(row => ({
        categoryId: row.category,
        categoryName: row.category_name || row.category,
        categoryColor: row.category_color || '#64748B',
        total: row.total || 0,
        percentage: total > 0 ? ((row.total || 0) / total) * 100 : 0
    }));
};

// ==================== HELPERS ====================

const mapRowToTransaction = (row: any): Transaction => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    personName: row.person_name,
    category: row.category,
    description: row.description,
    date: row.date,
    dueDate: row.due_date,
    status: row.status,
    remainingAmount: row.remaining_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const mapRowToPayment = (row: any): Payment => ({
    id: row.id,
    transactionId: row.transaction_id,
    amount: row.amount,
    date: row.date,
    note: row.note
});

// ==================== BACKUP ====================

/**
 * Export all data as JSON
 */
export const exportData = async (): Promise<string> => {
    const transactions = await getAllTransactions();
    const categories = await getAllCategories();

    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        transactions,
        categories
    };

    return JSON.stringify(data, null, 2);
};

/**
 * Import data from JSON
 */
export const importData = async (jsonData: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const data = JSON.parse(jsonData);

        if (!data.transactions) {
            return { success: false, error: 'Invalid backup file format' };
        }

        const db = getDatabase();

        // Clear existing data
        await db.execAsync('DELETE FROM payments; DELETE FROM transactions;');

        // Import transactions
        for (const tx of data.transactions) {
            await db.runAsync(
                `INSERT INTO transactions 
        (id, type, amount, person_name, category, description, date, status, remaining_amount, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tx.id,
                    tx.type,
                    tx.amount,
                    tx.personName || null,
                    tx.category,
                    tx.description || null,
                    tx.date,
                    tx.status,
                    tx.remainingAmount,
                    tx.createdAt,
                    tx.updatedAt
                ]
            );
        }

        return { success: true };
    } catch (error) {
        console.error('Error importing data:', error);
        return { success: false, error: 'Failed to import data' };
    }
};

// ==================== CLEAR DATA ====================

/**
 * Clear all data from the database
 */
export const clearAllData = async (): Promise<void> => {
    const db = getDatabase();
    await db.execAsync('DELETE FROM payments; DELETE FROM attachments; DELETE FROM transactions;');
};

// ==================== CATEGORY MANAGEMENT ====================

/**
 * Update a category
 */
export const updateCategory = async (id: string, updates: { name?: string; icon?: string; color?: string }): Promise<void> => {
    const db = getDatabase();
    const setClauses = [];
    const values: any[] = [];

    if (updates.name) {
        setClauses.push('name = ?');
        values.push(updates.name);
    }
    if (updates.icon) {
        setClauses.push('icon = ?');
        values.push(updates.icon);
    }
    if (updates.color) {
        setClauses.push('color = ?');
        values.push(updates.color);
    }

    if (setClauses.length > 0) {
        values.push(id);
        await db.runAsync(
            `UPDATE categories SET ${setClauses.join(', ')} WHERE id = ?`,
            values
        );
    }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<void> => {
    const db = getDatabase();
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
};

/**
 * Add a new category
 */
export const addCategory = async (category: { name: string; icon: string; color: string; type: string }): Promise<Category> => {
    const db = getDatabase();
    const id = uuidv4();

    await db.runAsync(
        'INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)',
        [id, category.name, category.icon, category.color, category.type]
    );

    return { id, ...category } as Category;
};

