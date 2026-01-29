import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AppSettings } from '../types';
import { STORAGE_KEYS, CURRENCIES } from '../utils/constants';

const DEFAULT_SETTINGS: AppSettings = {
    currency: 'INR',
    currencySymbol: '₹',
    darkMode: false,
    biometricEnabled: false,
    autoLockMinutes: 5,
    pinLength: 4
};

interface SettingsState {
    settings: AppSettings;
    isLoading: boolean;

    // Actions
    loadSettings: () => Promise<void>;
    updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
    setCurrency: (code: string) => Promise<void>;
    toggleDarkMode: () => Promise<void>;
    toggleBiometric: () => Promise<void>;
    setAutoLockMinutes: (minutes: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: DEFAULT_SETTINGS,
    isLoading: true,

    loadSettings: async () => {
        try {
            set({ isLoading: true });
            const stored = await SecureStore.getItemAsync(STORAGE_KEYS.SETTINGS);

            if (stored) {
                const settings = JSON.parse(stored);
                set({ settings: { ...DEFAULT_SETTINGS, ...settings }, isLoading: false });
            } else {
                set({ settings: DEFAULT_SETTINGS, isLoading: false });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            set({ settings: DEFAULT_SETTINGS, isLoading: false });
        }
    },

    updateSettings: async (updates) => {
        try {
            const newSettings = { ...get().settings, ...updates };
            await SecureStore.setItemAsync(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
            set({ settings: newSettings });
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    },

    setCurrency: async (code) => {
        const currency = CURRENCIES.find(c => c.code === code);
        if (currency) {
            await get().updateSettings({
                currency: currency.code,
                currencySymbol: currency.symbol
            });
        }
    },

    toggleDarkMode: async () => {
        await get().updateSettings({ darkMode: !get().settings.darkMode });
    },

    toggleBiometric: async () => {
        await get().updateSettings({ biometricEnabled: !get().settings.biometricEnabled });
    },

    setAutoLockMinutes: async (minutes) => {
        await get().updateSettings({ autoLockMinutes: minutes });
    }
}));
