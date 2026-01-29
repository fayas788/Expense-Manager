import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
    withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { PinDots, PinPad } from '../../components/auth';
import { Button } from '../../components/common';
import { setupPin, isPinSetup } from '../../services/security/pinService';
import {
    isBiometricSupported,
    setBiometricEnabled,
    getBiometricLabel
} from '../../services/security/biometricService';
import { validatePin } from '../../utils/validators';
import { SECURITY } from '../../utils/constants';

interface PinSetupScreenProps {
    onComplete: () => void;
}

type SetupStep = 'create' | 'confirm' | 'biometric';

export const PinSetupScreen: React.FC<PinSetupScreenProps> = ({ onComplete }) => {
    const [step, setStep] = useState<SetupStep>('create');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricLabel, setBiometricLabel] = useState('Biometric');
    const [loading, setLoading] = useState(false);

    const shakeX = useSharedValue(0);

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        const supported = await isBiometricSupported();
        setBiometricAvailable(supported);
        if (supported) {
            const label = await getBiometricLabel();
            setBiometricLabel(label);
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

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }]
    }));

    const handleDigitPress = async (digit: string) => {
        const currentPin = step === 'create' ? pin : confirmPin;
        if (currentPin.length >= SECURITY.MAX_PIN_LENGTH) return;

        const newPin = currentPin + digit;

        if (step === 'create') {
            setPin(newPin);
            if (newPin.length >= SECURITY.MIN_PIN_LENGTH) {
                // Auto-proceed to confirm when PIN is long enough
            }
        } else {
            setConfirmPin(newPin);
            if (newPin.length === pin.length) {
                // Check if PINs match
                if (newPin === pin) {
                    handlePinConfirmed();
                } else {
                    setError('PINs do not match');
                    shake();
                    setTimeout(() => {
                        setConfirmPin('');
                        setError('');
                    }, 500);
                }
            }
        }
    };

    const handleDelete = () => {
        if (step === 'create') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
        setError('');
    };

    const handleContinue = () => {
        const validation = validatePin(pin, SECURITY.MIN_PIN_LENGTH, SECURITY.MAX_PIN_LENGTH);
        if (!validation.valid) {
            setError(validation.error || 'Invalid PIN');
            shake();
            return;
        }
        setStep('confirm');
        setError('');
    };

    const handlePinConfirmed = async () => {
        setLoading(true);
        try {
            const success = await setupPin(pin);
            if (success) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (biometricAvailable) {
                    setStep('biometric');
                } else {
                    onComplete();
                }
            } else {
                setError('Failed to set up PIN');
                shake();
            }
        } catch (err) {
            setError('An error occurred');
            shake();
        } finally {
            setLoading(false);
        }
    };

    const handleEnableBiometric = async () => {
        await setBiometricEnabled(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete();
    };

    const handleSkipBiometric = () => {
        onComplete();
    };

    if (step === 'biometric') {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar style="dark" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-24 h-24 bg-primary-100 rounded-full justify-center items-center mb-8">
                        <Text className="text-5xl">👆</Text>
                    </View>

                    <Text className="text-2xl font-bold text-slate-800 text-center mb-2">
                        Enable {biometricLabel}?
                    </Text>
                    <Text className="text-slate-500 text-center mb-8 px-4">
                        Use {biometricLabel} for faster and more secure access to your app.
                    </Text>

                    <View className="w-full gap-3">
                        <Button
                            title={`Enable ${biometricLabel}`}
                            onPress={handleEnableBiometric}
                            fullWidth
                        />
                        <Button
                            title="Skip for now"
                            variant="ghost"
                            onPress={handleSkipBiometric}
                            fullWidth
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            <View className="flex-1 px-6 pt-12">
                {/* Header */}
                <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-primary-100 rounded-2xl justify-center items-center mb-4">
                        <Text className="text-3xl">🔐</Text>
                    </View>
                    <Text className="text-2xl font-bold text-slate-800 text-center">
                        {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
                    </Text>
                    <Text className="text-slate-500 text-center mt-2">
                        {step === 'create'
                            ? `Enter ${SECURITY.MIN_PIN_LENGTH}-${SECURITY.MAX_PIN_LENGTH} digits`
                            : 'Enter your PIN again to confirm'
                        }
                    </Text>
                </View>

                {/* PIN Dots */}
                <Animated.View style={shakeStyle}>
                    <PinDots
                        length={SECURITY.MIN_PIN_LENGTH}
                        filled={step === 'create' ? pin.length : confirmPin.length}
                        maxLength={step === 'create' ? Math.max(pin.length, SECURITY.MIN_PIN_LENGTH) : pin.length}
                        error={!!error}
                    />
                </Animated.View>

                {/* Error Message */}
                {error && (
                    <Text className="text-red-500 text-center mb-4">{error}</Text>
                )}

                {/* Continue Button (only on create step) */}
                {step === 'create' && pin.length >= SECURITY.MIN_PIN_LENGTH && (
                    <View className="mb-4">
                        <Button
                            title="Continue"
                            onPress={handleContinue}
                            fullWidth
                        />
                    </View>
                )}

                {/* PIN Pad */}
                <View className="flex-1 justify-center">
                    <PinPad
                        onPress={handleDigitPress}
                        onDelete={handleDelete}
                        disabled={loading}
                    />
                </View>

                {/* Back Button (on confirm step) */}
                {step === 'confirm' && (
                    <View className="py-4">
                        <Button
                            title="Start Over"
                            variant="ghost"
                            onPress={() => {
                                setStep('create');
                                setPin('');
                                setConfirmPin('');
                                setError('');
                            }}
                            fullWidth
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default PinSetupScreen;
