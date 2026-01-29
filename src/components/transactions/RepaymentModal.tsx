import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Transaction } from '../../types';
import { useTransactionStore, useUIStore } from '../../stores';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useSettingsStore } from '../../stores';

interface RepaymentModalProps {
    visible: boolean;
    onClose: () => void;
    transaction: Transaction;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({ visible, onClose, transaction }) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { addPayment, loadTransactions, loadSummary } = useTransactionStore();
    const { showAlert } = useUIStore();
    const { settings } = useSettingsStore();

    const handleSave = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            showAlert('Invalid Amount', 'Please enter a valid amount greater than 0');
            return;
        }

        if (numAmount > (transaction.remainingAmount || 0)) {
            showAlert('Invalid Amount', 'Payment cannot exceed remaining balance');
            return;
        }

        try {
            await addPayment(transaction.id, numAmount, note, date.toISOString());
            loadTransactions();
            loadSummary();
            showAlert('Success', 'Payment recorded successfully');
            setAmount('');
            setNote('');
            setDate(new Date());
            onClose();
        } catch (error) {
            showAlert('Error', 'Failed to add payment');
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 justify-end">
                    {/* Backdrop */}
                    <TouchableOpacity
                        className="absolute inset-0 bg-black/50"
                        activeOpacity={1}
                        onPress={onClose}
                    />

                    <View className="bg-white rounded-t-3xl overflow-hidden">
                        <LinearGradient
                            colors={['#ffffff', '#f8fafc']}
                            className="p-6"
                        >
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-slate-800">Add Repayment</Text>
                                <TouchableOpacity onPress={onClose} className="bg-slate-100 p-2 rounded-full">
                                    <Text className="text-slate-500 font-bold">✕</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                                <Text className="text-slate-500 text-sm mb-1">Remaining Balance</Text>
                                <Text className="text-2xl font-bold text-slate-800">
                                    {formatCurrency(transaction.remainingAmount || 0, settings.currencySymbol)}
                                </Text>
                            </View>

                            <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Amount</Text>
                            <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4">
                                <Text className="text-xl text-slate-400 mr-2">{settings.currencySymbol}</Text>
                                <TextInput
                                    className="flex-1 text-xl font-semibold text-slate-800"
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    value={amount}
                                    onChangeText={setAmount}
                                    autoFocus
                                />
                            </View>

                            <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Date Received</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex-row items-center"
                            >
                                <Text className="text-lg mr-2">📅</Text>
                                <Text className="text-base text-slate-800 flex-1">{formatDate(date.toISOString())}</Text>
                                <Text className="text-slate-400">›</Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                />
                            )}

                            <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">Note (Optional)</Text>
                            <TextInput
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 mb-6"
                                placeholder="e.g. Bank transfer"
                                value={note}
                                onChangeText={setNote}
                            />

                            <TouchableOpacity
                                onPress={handleSave}
                                className="w-full shadow-lg shadow-indigo-200"
                            >
                                <LinearGradient
                                    colors={['#6366F1', '#4F46E5']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4 rounded-xl items-center"
                                >
                                    <Text className="text-white font-bold text-lg">Confirm Payment</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View className="h-8" />
                        </LinearGradient>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
