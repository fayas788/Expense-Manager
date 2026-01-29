import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Modal, FlatList, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { Paths, File as ExpoFile } from 'expo-file-system';

import { useSettingsStore, useAuthStore, useUIStore, useTransactionStore } from '../../stores';
import {
    setBiometricEnabled,
    isBiometricSupported,
    getBiometricLabel
} from '../../services/security/biometricService';
import { exportData, clearAllData } from '../../services/database';
import { CURRENCIES, APP_INFO } from '../../utils/constants';
import { Category } from '../../types';

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { settings, toggleDarkMode, setCurrency, toggleBiometric, setAutoLockMinutes } = useSettingsStore();
    const { logout, clearPin } = useAuthStore();
    const { showAlert } = useUIStore();
    const {
        categories,
        loadCategories,
        loadTransactions,
        loadSummary,
        addCategory: addCategoryAction,
        updateCategory: updateCategoryAction,
        deleteCategory: deleteCategoryAction
    } = useTransactionStore();

    const [biometricSupported, setBiometricSupported] = useState(false);
    const [biometricLabel, setBiometricLabel] = useState('Face ID / Fingerprint');
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [editCategoryModal, setEditCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryIcon, setCategoryIcon] = useState('');

    useEffect(() => {
        checkBiometric();
        loadCategories();
    }, []);

    const checkBiometric = async () => {
        const supported = await isBiometricSupported();
        setBiometricSupported(supported);
        if (supported) {
            // User requested specific label change
            setBiometricLabel('Biometric Finger ID');
        }
    };

    const handleExportData = async () => {
        try {
            const data = await exportData();
            const filename = `expense_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
            const file = new ExpoFile(Paths.cache, filename);

            file.write(data);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(file.uri);
            } else {
                showAlert('Success', `Backup saved to ${filename}`);
            }
        } catch (error) {
            showAlert('Error', 'Failed to export data');
        }
    };

    const handleChangePin = () => {
        showAlert(
            'Change PIN',
            'Enter your current PIN to proceed.',
            [
                { text: 'Cancel', style: 'destructive' },
                {
                    text: 'Continue',
                    onPress: () => {
                        logout();
                    }
                }
            ]
        );
    };

    const handleForgotPin = () => {
        showAlert(
            'Forgot PIN?',
            'This will clear your PIN and log you out. You can set a new PIN on next login. Your data will NOT be deleted.',
            [
                { text: 'Cancel', style: 'destructive' },
                {
                    text: 'Reset PIN',
                    style: 'destructive',
                    onPress: async () => {
                        if (clearPin) {
                            await clearPin();
                        }
                        logout();
                    }
                }
            ]
        );
    };

    const handleLock = () => {
        showAlert(
            'Lock App?',
            'This will return you to the PIN screen.',
            [
                { text: 'Cancel', style: 'destructive' },
                {
                    text: 'Lock',
                    onPress: () => {
                        logout();
                    }
                }
            ]
        );
    };

    const handleCurrencySelect = (currencyCode: string) => {
        setCurrency(currencyCode);
        setCurrencyModalVisible(false);
        showAlert('Success', 'Currency updated!');
    };

    const handleDarkModeToggle = () => {
        toggleDarkMode();
    };

    const handleClearAllData = () => {
        showAlert(
            '⚠️ Clear All Data',
            'This will permanently delete ALL transactions, payments, and attachments. This action cannot be undone!',
            [
                { text: 'Cancel', style: 'destructive' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearAllData();
                            loadTransactions();
                            loadSummary();
                            showAlert('Success', 'All data has been cleared');
                        } catch (error) {
                            showAlert('Error', 'Failed to clear data');
                        }
                    }
                }
            ]
        );
    };

    const handleEditCategory = (cat: Category) => {
        setSelectedCategory(cat);
        setCategoryName(cat.name);
        setCategoryIcon(cat.icon);
        setEditCategoryModal(true);
    };

    const handleAddCategory = () => {
        setSelectedCategory(null);
        setCategoryName('');
        setCategoryIcon('');
        setEditCategoryModal(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryName.trim()) return;

        try {
            if (selectedCategory) {
                // Update existing
                await updateCategoryAction(selectedCategory.id, {
                    name: categoryName.trim(),
                    icon: categoryIcon || selectedCategory.icon
                });
                showAlert('Success', 'Category updated!');
            } else {
                // Add new
                await addCategoryAction({
                    name: categoryName.trim(),
                    icon: categoryIcon || '🏷️',
                    color: '#64748B', // Default color for now
                    type: 'expense'
                });
                showAlert('Success', 'Category added!');
            }
            // loadCategories() is called automatically via store update logic often, but let's be safe if store doesn't auto-reload everything
            // Actually the store updates its local state so we don't strictly need loadCategories() if the store is written well. 
            // But checking transactionStore.ts, it pushes to array. So we are good.

            setEditCategoryModal(false);
        } catch (error) {
            showAlert('Error', `Failed to ${selectedCategory ? 'update' : 'add'} category`);
        }
    };

    const handleDeleteCategory = async (cat: Category) => {
        showAlert(
            'Delete Category',
            `Delete "${cat.name}"? Transactions using this category may be affected.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategoryAction(cat.id);
                            showAlert('Deleted', 'Category removed');
                        } catch (error) {
                            showAlert('Error', 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({
        title,
        subtitle,
        icon,
        onPress,
        rightElement,
        danger,
        gradientColors
    }: {
        title: string;
        subtitle?: string;
        icon: string;
        onPress?: () => void;
        rightElement?: React.ReactNode;
        danger?: boolean;
        gradientColors?: [string, string];
    }) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress && !rightElement}
            className={`rounded-2xl p-4 mb-2 flex-row items-center shadow-sm ${danger ? 'bg-red-500' : 'bg-white'}`}
            activeOpacity={onPress ? 0.7 : 1}
            style={{
                shadowColor: danger ? '#EF4444' : '#6366F1',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            {gradientColors ? (
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-10 h-10 rounded-xl justify-center items-center mr-3"
                >
                    <Text className="text-lg">{icon}</Text>
                </LinearGradient>
            ) : (
                <View
                    className="w-10 h-10 rounded-xl justify-center items-center mr-3"
                    style={{ backgroundColor: danger ? 'rgba(255,255,255,0.2)' : '#EEF2FF' }}
                >
                    <Text className="text-xl">{icon}</Text>
                </View>
            )}
            <View className="flex-1">
                <Text className={`font-semibold text-base ${danger ? 'text-white' : 'text-slate-800'}`}>
                    {title}
                </Text>
                {subtitle && (
                    <Text className={`text-sm ${danger ? 'text-white/80' : 'text-slate-500'}`}>{subtitle}</Text>
                )}
            </View>
            {rightElement}
            {onPress && !rightElement && (
                <Text className={`text-xl font-light ${danger ? 'text-white/60' : 'text-slate-300'}`}>›</Text>
            )}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
        <View className="flex-row items-center mb-2 mt-3">
            <Text className="text-lg mr-2">{icon}</Text>
            <Text className="text-slate-700 text-sm font-bold uppercase tracking-wide">{title}</Text>
        </View>
    );

    const selectedCurrency = CURRENCIES.find(c => c.code === settings.currency);

    return (
        <View className="flex-1 bg-slate-100">
            <StatusBar style="light" />

            {/* Gradient Header */}
            <LinearGradient
                colors={['#4F46E5', '#6366F1', '#818CF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-12 pb-5 px-5"
            >
                <SafeAreaView edges={['top']}>
                    <Text className="text-2xl font-bold text-white">Settings</Text>
                    <Text className="text-white/70 text-sm">Customize your experience</Text>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView className="flex-1 -mt-2" showsVerticalScrollIndicator={false}>
                {/* Security Section - Compact */}
                <View className="px-4 py-3">
                    <SectionHeader title="Security" icon="🔐" />

                    <View className="flex-row gap-2 mb-2">
                        <TouchableOpacity
                            onPress={handleChangePin}
                            className="flex-1 bg-white rounded-xl p-3 items-center"
                        >
                            <Text className="text-xl mb-1">🔑</Text>
                            <Text className="text-slate-800 font-medium text-sm">Change PIN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleForgotPin}
                            className="flex-1 bg-white rounded-xl p-3 items-center"
                        >
                            <Text className="text-xl mb-1">🔓</Text>
                            <Text className="text-slate-800 font-medium text-sm">Forgot PIN</Text>
                        </TouchableOpacity>
                        {biometricSupported && (
                            <TouchableOpacity
                                onPress={() => {
                                    toggleBiometric();
                                    setBiometricEnabled(!settings.biometricEnabled);
                                }}
                                className={`flex-1 rounded-xl p-3 items-center ${settings.biometricEnabled ? 'bg-indigo-100' : 'bg-white'}`}
                            >
                                <Text className="text-xl mb-1">{biometricLabel.includes('Face') ? '🆔' : '👆'}</Text>
                                <Text className={`font-medium text-sm ${settings.biometricEnabled ? 'text-indigo-600' : 'text-slate-800'}`}>
                                    {biometricLabel}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Preferences Section */}
                <View className="px-4 py-3">
                    <SectionHeader title="Preferences" icon="⚙️" />

                    <SettingItem
                        title="Currency"
                        subtitle={`${selectedCurrency?.symbol} ${selectedCurrency?.name || 'Indian Rupee'}`}
                        icon="💱"
                        gradientColors={['#22C55E', '#16A34A']}
                        onPress={() => setCurrencyModalVisible(true)}
                    />

                    <SettingItem
                        title="Dark Mode"
                        subtitle={settings.darkMode ? 'Enabled' : 'Disabled'}
                        icon="🌙"
                        gradientColors={['#374151', '#1F2937']}
                        rightElement={
                            <Switch
                                value={settings.darkMode}
                                onValueChange={handleDarkModeToggle}
                                trackColor={{ false: '#CBD5E1', true: '#6366F1' }}
                                thumbColor={settings.darkMode ? '#fff' : '#f4f4f5'}
                            />
                        }
                    />

                    <SettingItem
                        title="Categories"
                        subtitle={`${categories.length} categories`}
                        icon="🏷️"
                        gradientColors={['#8B5CF6', '#A78BFA']}
                        onPress={() => setCategoryModalVisible(true)}
                    />
                </View>

                {/* Data Section */}
                <View className="px-4 py-3">
                    <SectionHeader title="Data" icon="💾" />

                    <SettingItem
                        title="Export Backup"
                        subtitle="Save data as JSON"
                        icon="📤"
                        gradientColors={['#3B82F6', '#2563EB']}
                        onPress={handleExportData}
                    />

                    <SettingItem
                        title="Clear All Data"
                        subtitle="Delete all transactions"
                        icon="🗑️"
                        danger
                        onPress={handleClearAllData}
                    />
                </View>

                {/* Session */}
                <View className="px-4 py-3">
                    <SectionHeader title="Session" icon="🚪" />
                    <SettingItem
                        title="Lock App"
                        subtitle="Require PIN on next open"
                        icon="🔒"
                        danger
                        onPress={handleLock}
                    />
                </View>

                {/* About Section */}
                <View className="px-4 py-3">
                    <SectionHeader title="About" icon="ℹ️" />
                    <View className="bg-white rounded-2xl p-4 items-center shadow-sm">
                        <LinearGradient
                            colors={['#6366F1', '#818CF8']}
                            className="w-14 h-14 rounded-2xl justify-center items-center mb-2"
                        >
                            <Text className="text-2xl">💰</Text>
                        </LinearGradient>
                        <Text className="text-slate-800 font-bold">Expense Manager</Text>
                        <Text className="text-slate-500 text-xs">Version {APP_INFO.version}</Text>
                    </View>
                </View>

                <View className="h-32" />
            </ScrollView>

            {/* Currency Selection Modal */}
            <Modal
                visible={currencyModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCurrencyModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl max-h-[70%]">
                        <View className="px-5 py-4 border-b border-slate-200 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-slate-800">Select Currency</Text>
                            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                                <Text className="text-slate-400 text-2xl">✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={CURRENCIES}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleCurrencySelect(item.code)}
                                    className="px-5 py-3 flex-row items-center border-b border-slate-100"
                                >
                                    <View className="w-10 h-10 bg-slate-100 rounded-xl justify-center items-center mr-3">
                                        <Text className="text-lg font-bold text-slate-700">{item.symbol}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-800 font-medium">{item.name}</Text>
                                        <Text className="text-slate-500 text-xs">{item.code}</Text>
                                    </View>
                                    {settings.currency === item.code && (
                                        <Text className="text-green-500 text-lg">✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Category Management Modal */}
            <Modal
                visible={categoryModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl max-h-[75%]">
                        <View className="px-5 py-4 border-b border-slate-200 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-slate-800">Manage Categories</Text>
                            <View className="flex-row items-center gap-3">
                                <TouchableOpacity
                                    onPress={handleAddCategory}
                                    className="bg-indigo-100 p-2 rounded-lg"
                                >
                                    <Text className="text-indigo-600 font-bold px-2">+ Add</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                    <Text className="text-slate-400 text-2xl">✕</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View className="px-5 py-3 flex-row items-center border-b border-slate-100">
                                    <View
                                        className="w-10 h-10 rounded-xl justify-center items-center mr-3"
                                        style={{ backgroundColor: `${item.color}20` }}
                                    >
                                        <Text className="text-lg">{item.icon}</Text>
                                    </View>
                                    <Text className="flex-1 text-slate-800 font-medium">{item.name}</Text>
                                    <TouchableOpacity
                                        onPress={() => handleEditCategory(item)}
                                        className="p-2"
                                    >
                                        <Text className="text-lg">✏️</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteCategory(item)}
                                        className="p-2"
                                    >
                                        <Text className="text-lg">🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Edit Category Modal */}
            <Modal
                visible={editCategoryModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setEditCategoryModal(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50 px-8">
                    <View className="bg-white rounded-2xl w-full p-5">
                        <Text className="text-lg font-bold text-slate-800 mb-4">
                            {selectedCategory ? 'Edit Category' : 'New Category'}
                        </Text>

                        <Text className="text-slate-600 text-xs mb-1">Name</Text>
                        <TextInput
                            value={categoryName}
                            onChangeText={setCategoryName}
                            placeholder="Category name"
                            className="bg-slate-100 rounded-xl px-4 py-3 mb-3 text-slate-800"
                        />

                        <Text className="text-slate-600 text-xs mb-1">Icon (emoji)</Text>
                        <TextInput
                            value={categoryIcon}
                            onChangeText={setCategoryIcon}
                            placeholder="📦"
                            className="bg-slate-100 rounded-xl px-4 py-3 mb-4 text-slate-800"
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setEditCategoryModal(false)}
                                className="flex-1 bg-slate-200 py-3 rounded-xl items-center"
                            >
                                <Text className="text-slate-600 font-medium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveCategory}
                                className="flex-1 bg-indigo-500 py-3 rounded-xl items-center"
                            >
                                <Text className="text-white font-medium">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default SettingsScreen;
