import { format, parseISO, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';

/**
 * Format currency with symbol
 */
export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
    const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(amount));

    return `${symbol}${formatted}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string, formatStr: string = 'MMM dd, yyyy'): string => {
    try {
        return format(parseISO(dateString), formatStr);
    } catch {
        return dateString;
    }
};

/**
 * Get relative date label
 */
export const getRelativeDateLabel = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        if (isToday(date)) return 'Today';
        if (isThisWeek(date)) return format(date, 'EEEE');
        if (isThisMonth(date)) return format(date, 'MMM dd');
        if (isThisYear(date)) return format(date, 'MMM dd');
        return format(date, 'MMM dd, yyyy');
    } catch {
        return dateString;
    }
};

/**
 * Get transaction type color
 */
export const getTransactionColor = (type: 'borrow' | 'lend' | 'expense'): string => {
    switch (type) {
        case 'borrow':
            return '#EF4444'; // Red
        case 'lend':
            return '#22C55E'; // Green
        case 'expense':
            return '#3B82F6'; // Blue
        default:
            return '#64748B';
    }
};

/**
 * Get transaction type label
 */
export const getTransactionLabel = (type: 'borrow' | 'lend' | 'expense'): string => {
    switch (type) {
        case 'borrow':
            return 'Borrowed';
        case 'lend':
            return 'Lent';
        case 'expense':
            return 'Expense';
        default:
            return type;
    }
};

/**
 * Get status badge color
 */
export const getStatusColor = (status: 'pending' | 'settled' | 'partial'): string => {
    switch (status) {
        case 'pending':
            return '#F59E0B'; // Amber
        case 'settled':
            return '#22C55E'; // Green
        case 'partial':
            return '#3B82F6'; // Blue
        default:
            return '#64748B';
    }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
};

/**
 * Get due date status based on current date
 */
export type DueDateStatus = 'upcoming' | 'due_soon' | 'overdue' | 'no_due_date';

export const getDueDateStatus = (dueDate?: string): { status: DueDateStatus; daysLeft: number } => {
    if (!dueDate) {
        return { status: 'no_due_date', daysLeft: 0 };
    }

    try {
        const due = parseISO(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
            return { status: 'overdue', daysLeft: Math.abs(daysLeft) };
        } else if (daysLeft <= 3) {
            return { status: 'due_soon', daysLeft };
        } else {
            return { status: 'upcoming', daysLeft };
        }
    } catch {
        return { status: 'no_due_date', daysLeft: 0 };
    }
};

/**
 * Format due date with human-readable text
 */
export const formatDueDate = (dueDate?: string): string => {
    if (!dueDate) return '';

    const { status, daysLeft } = getDueDateStatus(dueDate);

    switch (status) {
        case 'overdue':
            return daysLeft === 1 ? '1 day overdue' : `${daysLeft} days overdue`;
        case 'due_soon':
            if (daysLeft === 0) return 'Due today';
            return daysLeft === 1 ? 'Due tomorrow' : `Due in ${daysLeft} days`;
        case 'upcoming':
            return `Due in ${daysLeft} days`;
        default:
            return '';
    }
};

/**
 * Get due date badge color
 */
export const getDueDateColor = (dueDate?: string): string => {
    if (!dueDate) return '#64748B';

    const { status } = getDueDateStatus(dueDate);

    switch (status) {
        case 'overdue':
            return '#DC2626'; // Red
        case 'due_soon':
            return '#F59E0B'; // Amber
        case 'upcoming':
            return '#22C55E'; // Green
        default:
            return '#64748B';
    }
};
