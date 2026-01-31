import { create } from 'zustand';
import {
    isPinSetup,
    verifyPin,
    isLocked,
    recordFailedAttempt,
    resetRateLimit,
    getRemainingLockTime
} from '../services/security/pinService';
import {
    isBiometricEnabled,
    authenticateWithBiometric
} from '../services/security/biometricService';
import { clearAllData } from '../services/database';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthState {
    isAuthenticated: boolean;
    isPinSet: boolean;
    isBiometricEnabled: boolean;
    isLoading: boolean;
    failedAttempts: number;
    lockRemainingMs: number;
    error: string | null;

    // Actions
    checkPinSetup: () => Promise<void>;
    authenticate: (pin: string) => Promise<boolean>;
    authenticateBiometric: () => Promise<boolean>;
    logout: () => void;
    setAuthenticated: (value: boolean) => void;
    updateLockTimer: () => void;
    clearError: () => void;
    clearPin: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    isPinSet: false,
    isBiometricEnabled: false,
    isLoading: true,
    failedAttempts: 0,
    lockRemainingMs: 0,
    error: null,

    checkPinSetup: async () => {
        try {
            set({ isLoading: true });
            const pinSet = await isPinSetup();
            const biometricEnabled = await isBiometricEnabled();
            set({
                isPinSet: pinSet,
                isBiometricEnabled: biometricEnabled,
                isLoading: false
            });
        } catch (error) {
            console.error('Error checking PIN setup:', error);
            set({ isLoading: false, error: 'Failed to check authentication status' });
        }
    },

    authenticate: async (pin: string) => {
        try {
            // Check if locked
            if (isLocked()) {
                set({
                    error: 'Too many failed attempts. Please wait.',
                    lockRemainingMs: getRemainingLockTime()
                });
                return false;
            }

            const isValid = await verifyPin(pin);

            if (isValid) {
                resetRateLimit();
                set({
                    isAuthenticated: true,
                    failedAttempts: 0,
                    error: null,
                    lockRemainingMs: 0
                });
                return true;
            } else {
                recordFailedAttempt();
                const newFailedAttempts = get().failedAttempts + 1;
                set({
                    failedAttempts: newFailedAttempts,
                    error: 'Incorrect PIN',
                    lockRemainingMs: getRemainingLockTime()
                });
                return false;
            }
        } catch (error) {
            console.error('Authentication error:', error);
            set({ error: 'Authentication failed' });
            return false;
        }
    },

    authenticateBiometric: async () => {
        try {
            const result = await authenticateWithBiometric('Unlock Expense Manager');

            if (result.success) {
                set({ isAuthenticated: true, error: null });
                return true;
            } else {
                set({ error: result.error });
                return false;
            }
        } catch (error) {
            console.error('Biometric authentication error:', error);
            set({ error: 'Biometric authentication failed' });
            return false;
        }
    },

    logout: () => {
        set({ isAuthenticated: false, error: null });
    },

    setAuthenticated: (value: boolean) => {
        set({ isAuthenticated: value });
    },

    updateLockTimer: () => {
        set({ lockRemainingMs: getRemainingLockTime() });
    },

    clearError: () => {
        set({ error: null });
    },

    clearPin: async () => {
        try {
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_SALT);
            set({ isPinSet: false, isAuthenticated: false });
        } catch (error) {
            console.error('Error clearing PIN:', error);
        }
    },

    deleteAccount: async () => {
        try {
            set({ isLoading: true });

            // Clear database data
            await clearAllData();

            // Clear security credentials
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_SALT);

            set({
                isPinSet: false,
                isAuthenticated: false,
                isLoading: false,
                isBiometricEnabled: false
            });
        } catch (error) {
            console.error('Error deleting account:', error);
            set({ isLoading: false, error: 'Failed to delete account' });
            throw error;
        }
    }
}));

