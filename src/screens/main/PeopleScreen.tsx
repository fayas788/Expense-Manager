import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTransactionStore, useSettingsStore, useUIStore } from '../../stores';
import { formatCurrency } from '../../utils/formatters';
import { Person } from '../../types';

export const PeopleScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { people, loadPeople, isLoading, deletePerson } = useTransactionStore();
    const { settings } = useSettingsStore();
    const { showAlert } = useUIStore();

    useFocusEffect(
        useCallback(() => {
            loadPeople();
        }, [])
    );

    const handlePersonLongPress = (person: Person) => {
        showAlert(
            'Delete Person',
            `Are you sure you want to delete ${person.name}? This will delete ALL transactions associated with them.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePerson(person.name);
                            showAlert('Success', `${person.name} deleted successfully`);
                        } catch (error) {
                            showAlert('Error', 'Failed to delete person');
                        }
                    }
                }
            ]
        );
    };

    const renderPerson = ({ item }: { item: Person }) => {
        const isPositive = item.totalOwed > 0;
        const color = isPositive ? '#22C55E' : item.totalOwed < 0 ? '#EF4444' : '#64748B';
        const gradientColors: [string, string] = isPositive
            ? ['#22C55E', '#16A34A']
            : item.totalOwed < 0
                ? ['#EF4444', '#DC2626']
                : ['#64748B', '#475569'];

        return (
            <TouchableOpacity
                onLongPress={() => handlePersonLongPress(item)}
                className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm"
                activeOpacity={0.7}
                style={{
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                }}
            >
                {/* Gradient Avatar */}
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-12 h-12 rounded-full justify-center items-center mr-3"
                >
                    <Text className="text-xl font-bold text-white">
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                </LinearGradient>

                {/* Details */}
                <View className="flex-1">
                    <Text className="text-slate-800 font-semibold text-base">{item.name}</Text>
                    <Text className="text-slate-500 text-sm">
                        {isPositive ? 'Owes you' : item.totalOwed < 0 ? 'You owe' : 'All settled ✓'}
                    </Text>
                </View>

                {/* Amount */}
                <View className="items-end">
                    <Text
                        className="font-bold text-lg"
                        style={{ color }}
                    >
                        {isPositive ? '+' : item.totalOwed < 0 ? '-' : ''}
                        {formatCurrency(Math.abs(item.totalOwed), settings.currencySymbol)}
                    </Text>
                    {item.totalOwed !== 0 && (
                        <Text className="text-slate-400 text-xs">
                            {isPositive ? 'to receive' : 'to pay'}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Separate into owes you vs you owe
    const owesYou = people.filter(p => p.totalOwed > 0);
    const youOwe = people.filter(p => p.totalOwed < 0);
    const totalToReceive = owesYou.reduce((sum, p) => sum + p.totalOwed, 0);
    const totalToPay = Math.abs(youOwe.reduce((sum, p) => sum + p.totalOwed, 0));

    return (
        <View className="flex-1 bg-slate-100">
            <StatusBar style="light" />

            {/* Gradient Header */}
            <LinearGradient
                colors={['#4F46E5', '#6366F1', '#818CF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-14 pb-12 px-5"
            >
                <SafeAreaView edges={['top']}>
                    <Text className="text-3xl font-bold text-white">People</Text>
                    <Text className="text-white/70 mt-1">Track who owes what</Text>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                className="flex-1 px-5 -mt-8"
                data={people}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshing={isLoading}
                onRefresh={loadPeople}
                ListHeaderComponent={
                    people.length > 0 ? (
                        <View className="flex-row gap-3 mb-4 mt-2">
                            {/* To Receive Card */}
                            <View className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm">
                                <LinearGradient
                                    colors={['#22C55E', '#16A34A']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="p-3"
                                >
                                    <Text className="text-white/80 text-sm font-medium">To Receive</Text>
                                </LinearGradient>
                                <View className="p-3 items-center">
                                    <Text className="text-green-600 font-bold text-xl">
                                        {formatCurrency(totalToReceive, settings.currencySymbol)}
                                    </Text>
                                    <Text className="text-slate-400 text-xs mt-1">
                                        from {owesYou.length} {owesYou.length === 1 ? 'person' : 'people'}
                                    </Text>
                                </View>
                            </View>

                            {/* To Pay Card */}
                            <View className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm">
                                <LinearGradient
                                    colors={['#EF4444', '#DC2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="p-3"
                                >
                                    <Text className="text-white/80 text-sm font-medium">To Pay</Text>
                                </LinearGradient>
                                <View className="p-3 items-center">
                                    <Text className="text-red-600 font-bold text-xl">
                                        {formatCurrency(totalToPay, settings.currencySymbol)}
                                    </Text>
                                    <Text className="text-slate-400 text-xs mt-1">
                                        to {youOwe.length} {youOwe.length === 1 ? 'person' : 'people'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : null
                }
                renderItem={renderPerson}
                ListEmptyComponent={
                    <View className="items-center py-12 bg-white rounded-2xl mt-4">
                        <Text className="text-5xl mb-3">👥</Text>
                        <Text className="text-slate-800 font-semibold text-lg mb-1">No people yet</Text>
                        <Text className="text-slate-500 text-center px-8">
                            Add borrowing or lending transactions to see people here
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 120 }}
            />
        </View>
    );
};

export default PeopleScreen;
