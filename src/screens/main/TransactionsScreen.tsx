import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { TransactionCard } from '../../components/transactions';
import { useTransactionStore, useSettingsStore, useUIStore } from '../../stores';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

type FilterType = 'all' | TransactionType;

export const TransactionsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { transactions, isLoading, loadTransactions, deleteTransaction, updateTransaction, searchTransactions } = useTransactionStore();
    const { settings } = useSettingsStore();
    const { showAlert } = useUIStore();

    const [filter, setFilter] = useState<FilterType>('all');
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadTransactions();
        }, [])
    );

    React.useEffect(() => {
        filterTransactions();
    }, [transactions, filter, searchQuery, activeTab]);

    const filterTransactions = async () => {
        let filtered = transactions;

        // Apply search
        if (searchQuery.trim()) {
            filtered = await searchTransactions(searchQuery);
        }

        // Apply type filter
        if (filter !== 'all') {
            filtered = filtered.filter(t => t.type === filter);
        }

        // Apply History/Active filter
        if (activeTab === 'active') {
            filtered = filtered.filter(t =>
                t.type !== 'expense' && (t.remainingAmount !== undefined && t.remainingAmount > 0)
            );
        } else {
            filtered = filtered.filter(t =>
                t.type === 'expense' || (t.remainingAmount !== undefined && t.remainingAmount <= 0)
            );
        }

        setFilteredTransactions(filtered);
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
                text: '✏️ Edit Transaction',
                onPress: () => navigation.navigate('AddTransaction', { id: transaction.id, type: transaction.type })
            }
        ];

        // Status change options for all transactions
        if (transaction.status !== 'settled') {
            options.push({
                text: '✅ Mark as Paid',
                onPress: () => {
                    showAlert(
                        'Mark as Paid',
                        'This will mark the transaction as fully paid. Continue?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Confirm',
                                onPress: async () => {
                                    try {
                                        await updateTransaction(transaction.id, {
                                            status: 'settled',
                                            remainingAmount: 0
                                        });
                                        loadTransactions();
                                        showAlert('Success', 'Transaction marked as paid!');
                                    } catch (error) {
                                        showAlert('Error', 'Failed to update transaction');
                                    }
                                }
                            }
                        ]
                    );
                }
            });
        } else {
            options.push({
                text: '🔄 Mark as Pending',
                onPress: async () => {
                    try {
                        await updateTransaction(transaction.id, {
                            status: 'pending',
                            remainingAmount: transaction.amount
                        });
                        loadTransactions();
                        showAlert('Success', 'Transaction marked as pending!');
                    } catch (error) {
                        showAlert('Error', 'Failed to update transaction');
                    }
                }
            });
        }

        // Change due date option (only for borrow/lend)
        if (transaction.type !== 'expense') {
            options.push({
                text: '📅 Change Due Date',
                onPress: () => {
                    navigation.navigate('AddTransaction', { id: transaction.id, type: transaction.type });
                }
            });
        }

        options.push({
            text: '🗑️ Delete Transaction',
            style: 'destructive',
            onPress: () => {
                showAlert(
                    'Delete Transaction',
                    'Are you sure you want to delete this transaction? This cannot be undone.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                                await deleteTransaction(transaction.id);
                                showAlert('Deleted', 'Transaction has been deleted.');
                            }
                        }
                    ]
                );
            }
        });

        options.push({ text: 'Cancel', style: 'cancel' });

        const typeLabels = {
            borrow: '💸 Borrowed',
            lend: '💵 Lent',
            expense: '🛒 Expense'
        };

        showAlert(
            typeLabels[transaction.type],
            transaction.personName
                ? `${transaction.personName} - ${formatCurrency(transaction.amount, settings.currencySymbol)}`
                : formatCurrency(transaction.amount, settings.currencySymbol),
            options
        );
    };

    const handleAddTransaction = () => {
        navigation.navigate('AddTransaction', { type: 'expense' });
    };

    const handleDeleteTransaction = (transaction: Transaction) => {
        showAlert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteTransaction(transaction.id);
                        // loadTransactions(); // Store updates automatically usually, but focus effect reloads.
                        showAlert('Deleted', 'Transaction has been deleted.');
                    }
                }
            ]
        );
    };

    const filters: { label: string; value: FilterType; color: string; icon: string }[] = [
        { label: 'All', value: 'all', color: '#6366F1', icon: '📋' },
        { label: 'Borrowed', value: 'borrow', color: '#EF4444', icon: '↙️' },
        { label: 'Lent', value: 'lend', color: '#22C55E', icon: '↗️' },
        { label: 'Expenses', value: 'expense', color: '#3B82F6', icon: '💸' },
    ];

    return (
        <View className="flex-1 bg-slate-100">
            <StatusBar style="light" />

            {/* Gradient Header */}
            <LinearGradient
                colors={['#4F46E5', '#6366F1', '#818CF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-14 pb-6 px-5"
            >
                <SafeAreaView edges={['top']}>
                    <Text className="text-3xl font-bold text-white">Transactions</Text>
                    <Text className="text-white/70 mt-1">Manage your money flow</Text>
                </SafeAreaView>
            </LinearGradient>

            {/* Content Area */}
            <View className="flex-1 -mt-4 bg-slate-100 rounded-t-3xl pt-4">
                {/* Tabs */}
                <View className="px-5 py-2">
                    <View className="flex-row bg-white rounded-2xl p-1.5 shadow-sm">
                        <TouchableOpacity
                            onPress={() => setActiveTab('active')}
                            className="flex-1 overflow-hidden rounded-xl"
                        >
                            {activeTab === 'active' ? (
                                <LinearGradient
                                    colors={['#6366F1', '#818CF8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-3"
                                >
                                    <Text className="text-center font-semibold text-white">Active</Text>
                                </LinearGradient>
                            ) : (
                                <View className="py-3">
                                    <Text className="text-center font-medium text-slate-500">Active</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('history')}
                            className="flex-1 overflow-hidden rounded-xl"
                        >
                            {activeTab === 'history' ? (
                                <LinearGradient
                                    colors={['#6366F1', '#818CF8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-3"
                                >
                                    <Text className="text-center font-semibold text-white">History</Text>
                                </LinearGradient>
                            ) : (
                                <View className="py-3">
                                    <Text className="text-center font-medium text-slate-500">History</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search */}
                <View className="px-5 py-2">
                    <View className="bg-white rounded-2xl px-4 py-3.5 flex-row items-center shadow-sm">
                        <Text className="text-xl mr-3">🔍</Text>
                        <TextInput
                            className="flex-1 text-slate-800 text-base"
                            placeholder="Search by name, amount..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <View className="w-6 h-6 bg-slate-200 rounded-full justify-center items-center">
                                    <Text className="text-slate-500 text-xs">✕</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filters */}
                <View className="px-5 py-2">
                    <FlatList
                        horizontal
                        data={filters}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setFilter(item.value)}
                                className="mr-2 overflow-hidden rounded-xl"
                                activeOpacity={0.8}
                            >
                                {filter === item.value ? (
                                    <LinearGradient
                                        colors={[item.color, item.color + 'DD']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="px-4 py-2.5 flex-row items-center"
                                    >
                                        <Text className="mr-1.5">{item.icon}</Text>
                                        <Text className="font-semibold text-white">{item.label}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View
                                        className="px-4 py-2.5 flex-row items-center border-2"
                                        style={{ borderColor: item.color + '40', backgroundColor: item.color + '10' }}
                                    >
                                        <Text className="mr-1.5">{item.icon}</Text>
                                        <Text className="font-medium" style={{ color: item.color }}>{item.label}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Transaction List */}
                <FlatList
                    className="flex-1 px-5"
                    data={filteredTransactions}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    refreshing={isLoading}
                    onRefresh={loadTransactions}
                    renderItem={({ item }) => (
                        <TransactionCard
                            transaction={item}
                            currencySymbol={settings.currencySymbol}
                            onPress={() => handleTransactionPress(item)}
                            onLongPress={() => handleTransactionLongPress(item)}
                            onDelete={() => handleDeleteTransaction(item)}
                        />
                    )}
                    ListEmptyComponent={
                        <View className="items-center py-12 bg-white rounded-2xl mt-2">
                            <Text className="text-5xl mb-3">📭</Text>
                            <Text className="text-slate-800 font-semibold text-lg mb-1">
                                {searchQuery ? 'No matches found' : 'No transactions'}
                            </Text>
                            <Text className="text-slate-500 text-center px-8">
                                {searchQuery ? 'Try a different search term' : 'Add your first transaction to get started'}
                            </Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 120 }}
                />
            </View>

            {/* FAB */}
            <TouchableOpacity
                onPress={handleAddTransaction}
                className="absolute bottom-32 right-6 overflow-hidden rounded-full shadow-lg"
                style={{
                    shadowColor: '#6366F1',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                }}
            >
                <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-14 h-14 justify-center items-center"
                >
                    <Text className="text-white text-3xl font-light">+</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

export default TransactionsScreen;
