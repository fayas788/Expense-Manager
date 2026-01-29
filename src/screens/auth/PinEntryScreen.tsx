import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
    withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { PinDots, PinPad, BiometricButton } from '../../components/auth';
import { useAuthStore, useUIStore } from '../../stores';
import {
    isLocked,
    getRemainingLockTime,
    recordFailedAttempt,
    resetRateLimit
} from '../../services/security/pinService';
import {
    isBiometricEnabled,
    getBiometricType,
    BiometricType
} from '../../services/security/biometricService';
import { SECURITY } from '../../utils/constants';

interface PinEntryScreenProps {
    onSuccess: () => void;
}

export const PinEntryScreen: React.FC<PinEntryScreenProps> = ({ onSuccess }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [locked, setLocked] = useState(false);
    const [lockTime, setLockTime] = useState(0);
    const [biometricType, setBiometricType] = useState<BiometricType>('none');
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    const { authenticate, authenticateBiometric, failedAttempts, clearPin } = useAuthStore();
    const { showAlert } = useUIStore();

    const shakeX = useSharedValue(0);
    const successScale = useSharedValue(1);

    useEffect(() => {
        checkBiometric();
        checkLockStatus();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (locked) {
            interval = setInterval(() => {
                const remaining = getRemainingLockTime();
                if (remaining <= 0) {
                    setLocked(false);
                    setLockTime(0);
                    setError('');
                } else {
                    setLockTime(Math.ceil(remaining / 1000));
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [locked]);

    // Try biometric on mount if enabled
    useEffect(() => {
        if (biometricEnabled && biometricType !== 'none') {
            setTimeout(() => {
                handleBiometric();
            }, 500);
        }
    }, [biometricEnabled, biometricType]);

    const checkBiometric = async () => {
        const type = await getBiometricType();
        const enabled = await isBiometricEnabled();
        setBiometricType(type);
        setBiometricEnabled(enabled);
    };

    const checkLockStatus = () => {
        if (isLocked()) {
            setLocked(true);
            setLockTime(Math.ceil(getRemainingLockTime() / 1000));
        }
    };

    const shake = async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeX.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(0, { duration: 50 })
        );
    };

    const showSuccess = async () => {
        setIsSuccess(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        successScale.value = withSequence(
            withSpring(1.2, { damping: 10 }),
            withSpring(1, { damping: 10 })
        );
        setTimeout(() => {
            onSuccess();
        }, 500);
    };

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }]
    }));

    const handleDigitPress = async (digit: string) => {
        if (locked || isSuccess) return;
        if (pin.length >= SECURITY.MAX_PIN_LENGTH) return;

        const newPin = pin + digit;
        setPin(newPin);
        setError('');

        // Auto-verify when PIN is complete (4+ digits)
        if (newPin.length >= SECURITY.MIN_PIN_LENGTH) {
            const success = await authenticate(newPin);
            if (success) {
                showSuccess();
            } else {
                if (isLocked()) {
                    setLocked(true);
                    setLockTime(Math.ceil(getRemainingLockTime() / 1000));
                    setError('Too many attempts. Please wait.');
                } else {
                    setError('Incorrect PIN');
                    shake();
                }
                setTimeout(() => setPin(''), 300);
            }
        }
    };

    const handleDelete = () => {
        if (locked || isSuccess) return;
        setPin(pin.slice(0, -1));
        setError('');
    };

    const handleBiometric = async () => {
        if (locked || isSuccess) return;

        const success = await authenticateBiometric();
        if (success) {
            showSuccess();
        }
    };

    const handleForgotPin = () => {
        showAlert(
            'Reset PIN?',
            'This will remove your current PIN and security settings. You can set a new PIN in Settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await clearPin();
                        // Clearing PIN updates authStore state, which should redirect/unlock
                    }
                }
            ]
        );
    };

    return (
        <LinearGradient
            colors={isSuccess ? ['#059669', '#10B981'] : locked ? ['#DC2626', '#B91C1C'] : ['#4F46E5', '#6366F1', '#818CF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
        >
            <SafeAreaView className="flex-1">
                <StatusBar style="light" />

                <View className="flex-1 px-6 pt-8">
                    {/* Header */}
                    <View className="items-center mb-6">
                        <View
                            className="w-20 h-20 rounded-3xl justify-center items-center mb-4 bg-white/20"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.2,
                                shadowRadius: 16,
                            }}
                        >
                            <Text className="text-4xl">
                                {isSuccess ? '✓' : locked ? '🔒' : '💰'}
                            </Text>
                        </View>
                        <Text className="text-3xl font-bold text-white text-center">
                            {isSuccess ? 'Welcome!' : locked ? 'Locked' : 'Enter PIN'}
                        </Text>
                        <Text className="text-white/70 text-center mt-2">
                            {isSuccess ? 'Authentication successful' : locked ? `Try again in ${lockTime} seconds` : 'Enter your PIN to continue'}
                        </Text>
                    </View>

                    {/* Glass Card for PIN Area */}
                    <View
                        className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mx-2"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                        }}
                    >
                        {/* PIN Dots */}
                        <Animated.View style={shakeStyle}>
                            <PinDots
                                length={SECURITY.MIN_PIN_LENGTH}
                                filled={pin.length}
                                maxLength={SECURITY.MIN_PIN_LENGTH}
                                error={!!error && !locked}
                                success={isSuccess}
                            />
                        </Animated.View>

                        {/* Error Message */}
                        {error && !locked && (
                            <Text className="text-red-300 text-center mt-4 font-medium">{error}</Text>
                        )}

                        {/* Failed Attempts Counter */}
                        {failedAttempts > 0 && failedAttempts < SECURITY.MAX_FAILED_ATTEMPTS && !locked && (
                            <Text className="text-amber-300 text-center text-sm mt-2">
                                {SECURITY.MAX_FAILED_ATTEMPTS - failedAttempts} attempts remaining
                            </Text>
                        )}
                    </View>

                    {/* PIN Pad */}
                    <View className="flex-1 justify-center mt-4">
                        <PinPad
                            onPress={handleDigitPress}
                            onDelete={handleDelete}
                            onBiometric={handleBiometric}
                            showBiometric={biometricEnabled && biometricType !== 'none' && !locked}
                            disabled={locked || isSuccess}
                        />
                    </View>

                    {/* Biometric Button (alternative) */}
                    {biometricEnabled && biometricType !== 'none' && !locked && !isSuccess && (
                        <View className="py-2 items-center">
                            <BiometricButton
                                type={biometricType}
                                onPress={handleBiometric}
                            />
                        </View>
                    )}

                    {/* Forgot PIN Button */}
                    {!locked && !isSuccess && (
                        <TouchableOpacity
                            onPress={handleForgotPin}
                            className="py-4 items-center"
                        >
                            <Text className="text-white/60 text-sm font-medium">Forgot PIN?</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default PinEntryScreen;
