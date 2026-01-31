import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDate, getTransactionColor, getTransactionLabel, getDueDateStatus, formatDueDate, getDueDateColor } from '../../utils/formatters';
import { useTransactionStore } from '../../stores';

interface TransactionCardProps {
    transaction: Transaction;
    currencySymbol?: string;
    onPress: () => void;
    onLongPress?: () => void;
    onDelete?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
    transaction,
    currencySymbol = '₹',
    onPress,
    onLongPress,
    onDelete
}) => {
    const { categories } = useTransactionStore();

    const getCategoryName = (catId: string) => {
        const cat = categories.find(c => c.id === catId);
        if (cat) return cat.name;
        return catId.charAt(0).toUpperCase() + catId.slice(1);
    };

    const categoryName = getCategoryName(transaction.category);

    const color = getTransactionColor(transaction.type);
    const typeLabel = getTransactionLabel(transaction.type);
    const dueDateStatus = getDueDateStatus(transaction.dueDate);
    const dueDateText = formatDueDate(transaction.dueDate);
    const dueDateColor = getDueDateColor(transaction.dueDate);

    const getIcon = () => {
        switch (transaction.type) {
            case 'borrow': return '↙️';
            case 'lend': return '↗️';
            case 'expense': return '💸';
            default: return '💰';
        }
    };

    const getStatusBadge = () => {
        if (transaction.type !== 'expense' && transaction.status !== 'settled' && dueDateStatus.status === 'overdue') {
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

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity
                onPress={onDelete}
                className="bg-red-500 justify-center items-center rounded-r-2xl w-20 h-full absolute right-0"
                activeOpacity={0.8}
            >
                <Animated.Text
                    style={{ transform: [{ translateX: trans }] }}
                    className="text-white text-xl"
                >
                    🗑️
                </Animated.Text>
            </TouchableOpacity>
        );
    };

    const content = (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            className="bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-md"
            activeOpacity={0.7}
            style={{
                shadowColor: color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
            }}
        >
            <View className="p-4 border-l-4" style={{ borderLeftColor: color }}>
                <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl justify-center items-center mr-3" style={{ backgroundColor: `${color}15` }}>
                        <Text className="text-xl">{getIcon()}</Text>
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-slate-800 dark:text-dark-text font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                                {transaction.personName || categoryName}
                            </Text>
                            <Text className="font-bold text-base" style={{ color }}>
                                {formatCurrency(transaction.amount, currencySymbol)}
                            </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <Text className="text-slate-500 dark:text-slate-400 text-sm mr-2">
                                    {formatDate(transaction.date)}
                                    {transaction.personName ? ` • ${categoryName}` : ''}
                                </Text>
                                {getStatusBadge()}
                            </View>
                            {transaction.status !== 'settled' && transaction.remainingAmount < transaction.amount && (
                                <Text className="text-slate-400 dark:text-slate-500 text-xs">
                                    Left: {formatCurrency(transaction.remainingAmount, currencySymbol)}
                                </Text>
                            )}
                        </View>
                        {transaction.type !== 'expense' && transaction.dueDate && transaction.status !== 'settled' && (
                            <View className="flex-row items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Text className="text-sm mr-1">⏰</Text>
                                <Text className="text-sm font-medium" style={{ color: dueDateColor }}>{dueDateText}</Text>
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

    if (onDelete) {
        return (
            <View className="mb-3">
                <Swipeable renderRightActions={renderRightActions} containerStyle={{ overflow: 'visible' }}>
                    {content}
                </Swipeable>
            </View>
        );
    }

    return <View className="mb-3">{content}</View>;
};

export default TransactionCard;
