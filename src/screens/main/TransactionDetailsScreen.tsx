import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

import { useTransactionStore, useSettingsStore, useUIStore } from '../../stores';
import { formatCurrency } from '../../utils/formatters';
import { Transaction, Payment } from '../../types';
import { RepaymentModal } from '../../components/transactions';

export const TransactionDetailsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params;

    const { transactions, getPayments, loadTransactions } = useTransactionStore();
    const { settings } = useSettingsStore();
    const { showAlert } = useUIStore();

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);

    const loadData = async () => {
        const found = transactions.find(t => t.id === id);
        if (found) {
            setTransaction(found);
            const history = await getPayments(id);
            setPayments(history);
        } else {
            navigation.goBack();
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [transactions, id])
    );

    if (!transaction) return null;

    const isFullyPaid = transaction.remainingAmount === 0 || transaction.status === 'settled';
    const percentPaid = transaction.amount > 0
        ? ((transaction.amount - (transaction.remainingAmount || 0)) / transaction.amount) * 100
        : 100;

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="light" />

            {/* Header */}
            <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                className="pt-14 pb-8 px-6 rounded-b-[32px] shadow-lg"
            >
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="bg-white/20 p-2 rounded-full mr-4"
                    >
                        <Text className="text-white text-lg">←</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold flex-1">Transaction Details</Text>
                    <View className={`px-3 py-1 rounded-full ${transaction.type === 'lend' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                        <Text className="text-white font-medium capitalize">
                            {transaction.type === 'lend' ? 'To Receive' : 'To Pay'}
                        </Text>
                    </View>
                </View>

                <View className="items-center mb-2">
                    <Text className="text-white/70 text-base mb-1">Total Amount</Text>
                    <Text className="text-white text-4xl font-bold">
                        {formatCurrency(transaction.amount, settings.currencySymbol)}
                    </Text>
                </View>

                {/* Progress Bar */}
                <View className="mt-6">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-white/80 font-medium">
                            Paid: {Math.round(percentPaid)}%
                        </Text>
                        <Text className="text-white/80 font-medium">
                            Remaining: {formatCurrency(transaction.remainingAmount || 0, settings.currencySymbol)}
                        </Text>
                    </View>
                    <View className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <View
                            className="h-full bg-white rounded-full"
                            style={{ width: `${percentPaid}%` }}
                        />
                    </View>
                </View>
            </LinearGradient>

            {/* Content */}
            <View className="flex-1 px-6 pt-6">
                <Text className="text-slate-800 font-bold text-lg mb-4">Payment History</Text>

                <FlatList
                    data={payments}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View className="bg-white p-6 rounded-2xl items-center border border-slate-100">
                            <Text className="text-4xl mb-2">📝</Text>
                            <Text className="text-slate-500">No payments recorded yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl mb-3 flex-row items-center justify-between shadow-sm border border-slate-100">
                            <View>
                                <Text className="text-slate-800 font-bold text-base">
                                    {formatCurrency(item.amount, settings.currencySymbol)}
                                </Text>
                                <Text className="text-slate-400 text-xs">
                                    {format(new Date(item.date), 'MMM dd, yyyy')}
                                </Text>
                            </View>
                            {item.note && (
                                <Text className="text-slate-500 text-sm italic max-w-[50%] text-right">
                                    {item.note}
                                </Text>
                            )}
                        </View>
                    )}
                />
            </View>

            {/* Footer Action */}
            {!isFullyPaid && (
                <View className="absolute bottom-8 left-6 right-6">
                    <TouchableOpacity
                        onPress={() => setRepaymentModalVisible(true)}
                        className="shadow-lg shadow-indigo-200"
                    >
                        <LinearGradient
                            colors={['#6366F1', '#4F46E5']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 rounded-2xl items-center flex-row justify-center"
                        >
                            <Text className="text-white text-xl mr-2">+</Text>
                            <Text className="text-white font-bold text-lg">Add Repayment</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <RepaymentModal
                visible={repaymentModalVisible}
                onClose={() => setRepaymentModalVisible(false)}
                transaction={transaction}
            />
        </View>
    );
};
