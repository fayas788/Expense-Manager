import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../../utils/constants';

/**
 * Biometric authentication types
 */
export type BiometricType = 'fingerprint' | 'facial' | 'none';

/**
 * Check if device supports biometric authentication
 */
export const isBiometricSupported = async (): Promise<boolean> => {
    try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        return compatible && enrolled;
    } catch (error) {
        console.error('Error checking biometric support:', error);
        return false;
    }
};

/**
 * Get available biometric type
 */
export const getBiometricType = async (): Promise<BiometricType> => {
    try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'facial';
        }

        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'fingerprint';
        }

        return 'none';
    } catch (error) {
        console.error('Error getting biometric type:', error);
        return 'none';
    }
};

/**
 * Get biometric type label for UI
 */
export const getBiometricLabel = async (): Promise<string> => {
    const type = await getBiometricType();
    switch (type) {
        case 'facial':
            return 'Face ID';
        case 'fingerprint':
            return 'Fingerprint';
        default:
            return 'Biometric';
    }
};

/**
 * Check if biometric is enabled for this app
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
    try {
        const enabled = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
        return enabled === 'true';
    } catch (error) {
        console.error('Error checking biometric enabled:', error);
        return false;
    }
};

/**
 * Enable/disable biometric authentication
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<boolean> => {
    try {
        await SecureStore.setItemAsync(
            STORAGE_KEYS.BIOMETRIC_ENABLED,
            enabled.toString()
        );
        return true;
    } catch (error) {
        console.error('Error setting biometric enabled:', error);
        return false;
    }
};

/**
 * Authenticate using biometrics
 */
export const authenticateWithBiometric = async (
    promptMessage: string = 'Authenticate to continue'
): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        // Check if biometric is supported and enabled
        const supported = await isBiometricSupported();
        if (!supported) {
            return { success: false, error: 'Biometric not supported on this device' };
        }

        const enabled = await isBiometricEnabled();
        if (!enabled) {
            return { success: false, error: 'Biometric authentication is not enabled' };
        }

        // Perform authentication
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Use PIN',
            cancelLabel: 'Cancel',
            disableDeviceFallback: true, // We handle PIN fallback ourselves
        });

        if (result.success) {
            return { success: true };
        }

        // Handle errors
        switch (result.error) {
            case 'user_cancel':
                return { success: false, error: 'Authentication cancelled' };
            case 'user_fallback':
                return { success: false, error: 'Use PIN instead' };
            case 'lockout':
                return { success: false, error: 'Too many failed attempts. Try again later.' };
            default:
                return { success: false, error: 'Authentication failed' };
        }
    } catch (error) {
        console.error('Error during biometric authentication:', error);
        return { success: false, error: 'An error occurred during authentication' };
    }
};

/**
 * Prompt user to set up biometric after PIN setup
 */
export const promptBiometricSetup = async (): Promise<{
    supported: boolean;
    type: BiometricType;
    label: string;
}> => {
    const supported = await isBiometricSupported();
    const type = await getBiometricType();
    const label = await getBiometricLabel();

    return { supported, type, label };
};
