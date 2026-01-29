import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { STORAGE_KEYS, SECURITY } from '../../utils/constants';

/**
 * Generate a random salt for PIN hashing
 */
const generateSalt = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
};

/**
 * Hash PIN with salt using SHA-256
 */
const hashPin = async (pin: string, salt: string): Promise<string> => {
    const data = pin + salt;
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data
    );
    return hash;
};

/**
 * Check if PIN is set up
 */
export const isPinSetup = async (): Promise<boolean> => {
    try {
        const pinHash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
        return pinHash !== null;
    } catch (error) {
        console.error('Error checking PIN setup:', error);
        return false;
    }
};

/**
 * Set up new PIN
 */
export const setupPin = async (pin: string): Promise<boolean> => {
    try {
        const salt = await generateSalt();
        const hash = await hashPin(pin, salt);

        await SecureStore.setItemAsync(STORAGE_KEYS.PIN_SALT, salt);
        await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, hash);

        // Mark first launch as complete
        await SecureStore.setItemAsync(STORAGE_KEYS.FIRST_LAUNCH, 'false');

        return true;
    } catch (error) {
        console.error('Error setting up PIN:', error);
        return false;
    }
};

/**
 * Verify PIN
 */
export const verifyPin = async (pin: string): Promise<boolean> => {
    try {
        const storedHash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
        const salt = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_SALT);

        if (!storedHash || !salt) {
            return false;
        }

        const hash = await hashPin(pin, salt);
        return hash === storedHash;
    } catch (error) {
        console.error('Error verifying PIN:', error);
        return false;
    }
};

/**
 * Change PIN
 */
export const changePin = async (currentPin: string, newPin: string): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        // Verify current PIN first
        const isValid = await verifyPin(currentPin);
        if (!isValid) {
            return { success: false, error: 'Current PIN is incorrect' };
        }

        // Set up new PIN
        const success = await setupPin(newPin);
        if (!success) {
            return { success: false, error: 'Failed to set new PIN' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error changing PIN:', error);
        return { success: false, error: 'An error occurred' };
    }
};

/**
 * Reset PIN (requires security questions or backup method)
 */
export const resetPin = async (newPin: string): Promise<boolean> => {
    try {
        // Clear existing PIN data
        await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_SALT);

        // Set up new PIN
        return await setupPin(newPin);
    } catch (error) {
        console.error('Error resetting PIN:', error);
        return false;
    }
};

/**
 * Security questions storage
 */
export interface SecurityQuestion {
    question: string;
    answerHash: string;
}

export const saveSecurityQuestions = async (
    questions: { question: string; answer: string }[]
): Promise<boolean> => {
    try {
        const salt = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_SALT);
        if (!salt) return false;

        const hashedQuestions: SecurityQuestion[] = await Promise.all(
            questions.map(async (q) => ({
                question: q.question,
                answerHash: await hashPin(q.answer.toLowerCase().trim(), salt),
            }))
        );

        await SecureStore.setItemAsync(
            STORAGE_KEYS.SECURITY_QUESTIONS,
            JSON.stringify(hashedQuestions)
        );

        return true;
    } catch (error) {
        console.error('Error saving security questions:', error);
        return false;
    }
};

export const verifySecurityAnswers = async (
    answers: string[]
): Promise<boolean> => {
    try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEYS.SECURITY_QUESTIONS);
        const salt = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_SALT);

        if (!stored || !salt) return false;

        const questions: SecurityQuestion[] = JSON.parse(stored);

        for (let i = 0; i < questions.length; i++) {
            const answerHash = await hashPin(answers[i].toLowerCase().trim(), salt);
            if (answerHash !== questions[i].answerHash) {
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error verifying security answers:', error);
        return false;
    }
};

/**
 * Check if security questions are set
 */
export const hasSecurityQuestions = async (): Promise<boolean> => {
    try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEYS.SECURITY_QUESTIONS);
        return stored !== null;
    } catch (error) {
        return false;
    }
};

/**
 * Get security questions (without answers)
 */
export const getSecurityQuestions = async (): Promise<string[]> => {
    try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEYS.SECURITY_QUESTIONS);
        if (!stored) return [];

        const questions: SecurityQuestion[] = JSON.parse(stored);
        return questions.map(q => q.question);
    } catch (error) {
        return [];
    }
};

/**
 * Rate limiting for failed attempts
 */
interface RateLimitState {
    failedAttempts: number;
    lockUntil: number | null;
}

let rateLimitState: RateLimitState = {
    failedAttempts: 0,
    lockUntil: null,
};

export const getRateLimitState = (): RateLimitState => {
    return { ...rateLimitState };
};

export const isLocked = (): boolean => {
    if (!rateLimitState.lockUntil) return false;
    if (Date.now() >= rateLimitState.lockUntil) {
        rateLimitState.lockUntil = null;
        rateLimitState.failedAttempts = 0;
        return false;
    }
    return true;
};

export const getRemainingLockTime = (): number => {
    if (!rateLimitState.lockUntil) return 0;
    return Math.max(0, rateLimitState.lockUntil - Date.now());
};

export const recordFailedAttempt = (): void => {
    rateLimitState.failedAttempts++;
    if (rateLimitState.failedAttempts >= SECURITY.MAX_FAILED_ATTEMPTS) {
        rateLimitState.lockUntil = Date.now() + SECURITY.LOCKOUT_DURATION_MS;
    }
};

export const resetRateLimit = (): void => {
    rateLimitState.failedAttempts = 0;
    rateLimitState.lockUntil = null;
};

/**
 * Last active tracking for auto-lock
 */
export const updateLastActive = async (): Promise<void> => {
    try {
        await SecureStore.setItemAsync(
            STORAGE_KEYS.LAST_ACTIVE,
            Date.now().toString()
        );
    } catch (error) {
        console.error('Error updating last active:', error);
    }
};

export const getLastActive = async (): Promise<number> => {
    try {
        const lastActive = await SecureStore.getItemAsync(STORAGE_KEYS.LAST_ACTIVE);
        return lastActive ? parseInt(lastActive, 10) : 0;
    } catch (error) {
        return 0;
    }
};

export const shouldAutoLock = async (autoLockMinutes: number): Promise<boolean> => {
    const lastActive = await getLastActive();
    if (!lastActive) return true;

    const elapsed = Date.now() - lastActive;
    const autoLockMs = autoLockMinutes * 60 * 1000;

    return elapsed >= autoLockMs;
};
