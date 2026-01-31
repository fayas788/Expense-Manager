import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { TransactionCard } from '../../components/transactions';
import { useTransactionStore, useSettingsStore, useUIStore } from '../../stores';
import { formatCurrency, getDueDateStatus } from '../../utils/formatters';
import { Transaction } from '../../types';

export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const {
        transactions,
        summary,
        isLoading,
        loadTransactions,
        loadSummary,
        loadCategories,
        updateTransaction,
        deleteTransaction
    } = useTransactionStore();
    const { settings } = useSettingsStore();
    const { showAlert } = useUIStore();

    useFocusEffect(
        useCallback(() => {
            loadTransactions();
            loadSummary();
            loadCategories();
        }, [])
    );

    const recentTransactions = transactions.slice(0, 4);

    const handleAddTransaction = (type: 'borrow' | 'lend' | 'expense') => {
        navigation.navigate('AddTransaction', { type });
    };

    const handleViewAll = () => {
        navigation.navigate('Transactions');
    };

    const handleTransactionPress = (transaction: Transaction) => {
        if (transaction.type === 'expense') {
            navigation.navigate('AddTransaction', { id: transaction.id, type: transaction.type });
        } else {
            navigation.navigate('TransactionDetails', { id: transaction.id });
        }
    };

    const handleTransactionLongPress = (transaction: Transaction) => {
        const options: any[] = [
            {
                text: '✏️ Edit',
                onPress: () => navigation.navigate('AddTransaction', { id: transaction.id, type: transaction.type })
            }
        ];

        if (transaction.status !== 'settled') {
            options.push({
                text: '✅ Mark as Paid',
                onPress: async () => {
                    try {
                        await updateTransaction(transaction.id, {
                            status: 'settled',
                            remainingAmount: 0
                        });
                        loadTransactions();
                        loadSummary();
                        showAlert('Success', 'Transaction marked as paid!');
                    } catch (error) {
                        showAlert('Error', 'Failed to update');
                    }
                }
            });
        } else {
            options.push({
                text: '🔄 Mark Pending',
                onPress: async () => {
                    try {
                        await updateTransaction(transaction.id, {
                            status: 'pending',
                            remainingAmount: transaction.amount
                        });
                        loadTransactions();
                        loadSummary();
                    } catch (error) {
                        showAlert('Error', 'Failed to update');
                    }
                }
            });
        }

        options.push({
            text: '🗑️ Delete',
            style: 'destructive',
            onPress: () => {
                showAlert(
                    'Delete?',
                    'This cannot be undone.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                                await deleteTransaction(transaction.id);
                                loadTransactions();
                                loadSummary();
                            }
                        }
                    ]
                );
            }
        });

        options.push({ text: 'Cancel', style: 'cancel' });

        const typeLabels: Record<string, string> = {
            borrow: '💸 Borrowed',
            lend: '💵 Lent',
            expense: '🛒 Expense'
        };

        showAlert(
            typeLabels[transaction.type] || 'Transaction',
            transaction.personName
                ? `${transaction.personName} - ${formatCurrency(transaction.amount, settings.currencySymbol)}`
                : formatCurrency(transaction.amount, settings.currencySymbol),
            options
        );
    };

    const handleDeleteTransaction = (transaction: Transaction) => {
        showAlert(
            'Delete transaction?',
            'This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteTransaction(transaction.id);
                        loadTransactions();
                        loadSummary();
                    }
                }
            ]
        );
    };

    const overdueTransactions = transactions
        .filter(t => t.type !== 'expense' && t.status !== 'settled')
        .filter(t => t.dueDate && getDueDateStatus(t.dueDate).status === 'overdue');

    return (
        <View className="flex-1 bg-slate-100 dark:bg-dark-bg">
            <StatusBar style="light" />

            {/* Gradient Header */}
            <LinearGradient
                colors={['#4F46E5', '#6366F1', '#818CF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-14 pb-12 px-5"
            >
                <SafeAreaView edges={['top']}>
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-white/70 text-base">Welcome back!</Text>
                            <Text className="text-3xl font-bold text-white">Dashboard</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Settings')}
                            className="bg-white/20 p-2 rounded-xl backdrop-blur-md"
                        >
                            <Text className="text-xl">⚙️</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                className="flex-1 -mt-8"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={() => {
                            loadTransactions();
                            loadSummary();
                        }}
                        tintColor="#6366F1"
                    />
                }
            >
                {/* Summary Cards */}
                <View className="px-5 py-4">
                    <View className="flex-row gap-3 mb-3">
                        <View className="flex-1 bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm" style={{ shadowColor: '#22C55E', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
                            <View className="flex-row items-center mb-2">
                                <View className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl justify-center items-center mr-3">
                                    <Text className="text-lg">💵</Text>
                                </View>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm flex-1">
                                    To Receive {summary?.lendCount ? `(${summary.lendCount})` : ''}
                                </Text>
                            </View>
                            <Text className="text-green-600 dark:text-green-400 text-xl font-bold">{formatCurrency(summary?.totalLent || 0, settings.currencySymbol)}</Text>
                        </View>
                        <View className="flex-1 bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm" style={{ shadowColor: '#EF4444', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
                            <View className="flex-row items-center mb-2">
                                <View className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl justify-center items-center mr-3">
                                    <Text className="text-lg">💳</Text>
                                </View>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm flex-1">
                                    To Pay {summary?.borrowCount ? `(${summary.borrowCount})` : ''}
                                </Text>
                            </View>
                            <Text className="text-red-600 dark:text-red-400 text-xl font-bold">{formatCurrency(summary?.totalBorrowed || 0, settings.currencySymbol)}</Text>
                        </View>
                    </View>
                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm" style={{ shadowColor: '#6366F1', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
                            <View className="flex-row items-center mb-2">
                                <View className="w-10 h-10 bg-primary-100 dark:bg-indigo-900/30 rounded-xl justify-center items-center mr-3">
                                    <Text className="text-lg">⚖️</Text>
                                </View>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm flex-1">Net Balance</Text>
                            </View>
                            <Text className={`text-xl font-bold ${summary?.netBalance && summary.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(summary?.netBalance || 0, settings.currencySymbol)}
                            </Text>
                        </View>
                        <View className="flex-1 bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm" style={{ shadowColor: '#3B82F6', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
                            <View className="flex-row items-center mb-2">
                                <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl justify-center items-center mr-3">
                                    <Text className="text-lg">📊</Text>
                                </View>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm flex-1">Expenses</Text>
                            </View>
                            <Text className="text-blue-600 dark:text-blue-400 text-xl font-bold">{formatCurrency(summary?.monthlyExpenses || 0, settings.currencySymbol)}</Text>
                        </View>
                    </View>
                </View>

                {/* Overdue Alert */}
                {overdueTransactions.length > 0 && (
                    <TouchableOpacity
                        onPress={handleViewAll}
                        className="mx-5 mb-4"
                    >
                        <LinearGradient
                            colors={['#FEE2E2', '#FECACA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="rounded-2xl p-4 flex-row items-center border border-red-200"
                        >
                            <View className="w-12 h-12 bg-red-200 rounded-xl justify-center items-center mr-3">
                                <Text className="text-2xl">⚠️</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-red-800 font-semibold text-base">
                                    {overdueTransactions.length} Overdue Transaction{overdueTransactions.length > 1 ? 's' : ''}
                                </Text>
                                <Text className="text-red-600 text-sm">Tap to view and settle</Text>
                            </View>
                            <Text className="text-red-400 text-xl">›</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Quick Actions */}
                <View className="px-5 py-4">
                    <Text className="text-lg font-bold text-slate-800 dark:text-white mb-3">Quick Actions</Text>
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => handleAddTransaction('lend')}
                            className="flex-1 overflow-hidden rounded-2xl"
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#22C55E', '#16A34A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="py-5 items-center"
                            >
                                <Text className="text-2xl mb-1">↗️</Text>
                                <Text className="text-white font-semibold">Add Lend</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleAddTransaction('borrow')}
                            className="flex-1 overflow-hidden rounded-2xl"
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="py-5 items-center"
                            >
                                <Text className="text-2xl mb-1">↙️</Text>
                                <Text className="text-white font-semibold">Add Borrow</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleAddTransaction('expense')}
                            className="flex-1 overflow-hidden rounded-2xl"
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#3B82F6', '#2563EB']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="py-5 items-center"
                            >
                                <Text className="text-2xl mb-1">💸</Text>
                                <Text className="text-white font-semibold">Add Expense</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent History */}
                <View className="px-5 py-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg font-bold text-slate-800 dark:text-white">Recent History</Text>
                        {transactions.length > 4 && (
                            <TouchableOpacity onPress={handleViewAll}>
                                <Text className="text-primary-500 font-semibold">View All ›</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {recentTransactions.length === 0 ? (
                        <View className="bg-white dark:bg-dark-card rounded-2xl p-8 items-center shadow-sm">
                            <Text className="text-5xl mb-3">📝</Text>
                            <Text className="text-slate-800 dark:text-white font-semibold text-lg mb-1">No transactions yet</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-center">
                                Add your first transaction to get started!
                            </Text>
                        </View>
                    ) : (
                        <>
                            {recentTransactions.map((transaction) => (
                                <TransactionCard
                                    key={transaction.id}
                                    transaction={transaction}
                                    currencySymbol={settings.currencySymbol}
                                    onPress={() => handleTransactionPress(transaction)}
                                    onLongPress={() => handleTransactionLongPress(transaction)}
                                    onDelete={() => handleDeleteTransaction(transaction)}
                                />
                            ))}

                            {transactions.length > 4 && (
                                <TouchableOpacity
                                    onPress={handleViewAll}
                                    className="bg-white dark:bg-dark-card p-4 rounded-2xl items-center mt-1 border border-slate-100 dark:border-slate-800 shadow-sm"
                                >
                                    <Text className="text-primary-600 dark:text-primary-400 font-semibold">
                                        View All Transactions ({transactions.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>

                {/* Bottom padding for tab bar */}
                <View className="h-28" />
            </ScrollView>
        </View>
    );
};

export default DashboardScreen;
