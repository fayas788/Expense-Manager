import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDate, getTransactionColor, getTransactionLabel, getDueDateStatus, formatDueDate, getDueDateColor } from '../../utils/formatters';

interface TransactionCardProps {
    transaction: Transaction;
    currencySymbol?: string;
    onPress?: () => void;
    onLongPress?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
    transaction,
    currencySymbol = '₹',
    onPress,
    onLongPress
}) => {
    const color = getTransactionColor(transaction.type);
    const typeLabel = getTransactionLabel(transaction.type);
    const dueDateStatus = getDueDateStatus(transaction.dueDate);
    const dueDateText = formatDueDate(transaction.dueDate);
    const dueDateColor = getDueDateColor(transaction.dueDate);

    const getIcon = () => {
        switch (transaction.type) {
            case 'borrow':
                return '↙️';
            case 'lend':
                return '↗️';
            case 'expense':
                return '💸';
            default:
                return '💰';
        }
    };

    const getStatusBadge = () => {
        // Override status with overdue if applicable
        if (transaction.type !== 'expense' &&
            transaction.status !== 'settled' &&
            dueDateStatus.status === 'overdue') {
            return (
                <View className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded-full border border-red-200 dark:border-red-800">
                    <Text className="text-red-700 dark:text-red-400 text-xs font-medium">Overdue</Text>
                </View>
            );
        }

        switch (transaction.status) {
            case 'settled':
                return (
                    <View className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
                        <Text className="text-green-700 dark:text-green-400 text-xs font-medium">Paid</Text>
                    </View>
                );
            case 'partial':
                return (
                    <View className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
                        <Text className="text-blue-700 dark:text-blue-400 text-xs font-medium">Partial</Text>
                    </View>
                );
            case 'pending':
            default:
                return (
                    <View className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full border border-amber-200 dark:border-amber-800">
                        <Text className="text-amber-700 dark:text-amber-400 text-xs font-medium">Pending</Text>
                    </View>
                );
        }
    };

    const getGradientColors = (): [string, string] => {
        switch (transaction.type) {
            case 'borrow':
                return ['#FEF2F2', '#FFFFFF'];
            case 'lend':
                return ['#F0FDF4', '#FFFFFF'];
            case 'expense':
                return ['#EFF6FF', '#FFFFFF'];
            default:
                return ['#FFFFFF', '#FFFFFF'];
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            className="mb-3 rounded-2xl overflow-hidden shadow-md"
            activeOpacity={0.7}
            style={{
                shadowColor: color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
            }}
        >
            <View
                className="bg-white dark:bg-dark-card p-4 border-l-4"
                style={{ borderLeftColor: color }}
            >
                <View className="flex-row items-center">
                    {/* Icon */}
                    <View
                        className="w-12 h-12 rounded-2xl justify-center items-center mr-3"
                        style={{ backgroundColor: `${color}15` }}
                    >
                        <Text className="text-xl">{getIcon()}</Text>
                    </View>

                    {/* Details */}
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-slate-800 dark:text-dark-text font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                                {transaction.type === 'expense'
                                    ? transaction.category
                                    : transaction.personName || 'Unknown'
                                }
                            </Text>
                            <Text
                                className="font-bold text-base"
                                style={{ color }}
                            >
                                {formatCurrency(transaction.amount, currencySymbol)}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <Text className="text-slate-500 dark:text-slate-400 text-sm mr-2">
                                    {formatDate(transaction.date)}
                                </Text>
                                {transaction.type !== 'expense' && getStatusBadge()}
                            </View>

                            {transaction.status !== 'settled' && transaction.remainingAmount < transaction.amount && (
                                <Text className="text-slate-400 dark:text-slate-500 text-xs">
                                    Left: {formatCurrency(transaction.remainingAmount, currencySymbol)}
                                </Text>
                            )}
                        </View>

                        {/* Due Date Display */}
                        {transaction.type !== 'expense' && transaction.dueDate && transaction.status !== 'settled' && (
                            <View className="flex-row items-center mt-2 pt-2 border-t border-slate-100">
                                <Text className="text-sm mr-1">⏰</Text>
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: dueDateColor }}
                                >
                                    {dueDateText}
                                </Text>
                            </View>
                        )}

                        {transaction.description && (
                            <Text className="text-slate-400 dark:text-slate-500 text-sm mt-1" numberOfLines={1}>
                                {transaction.description}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default TransactionCard;
