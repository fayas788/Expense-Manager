import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { PinDots, PinPad } from '../../components/auth';
import { Button } from '../../components/common';
import { setupPin } from '../../services/security/pinService';
import {
    isBiometricSupported,
    setBiometricEnabled,
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
            // User requested explicit label change
            setBiometricLabel('Biometric Finger ID');
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
        } else {
            setConfirmPin(newPin);
            if (newPin.length === pin.length) {
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
            <LinearGradient
                colors={['#312E81', '#3730A3', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1"
            >
                <SafeAreaView className="flex-1">
                    <StatusBar style="light" />
                    <View className="flex-1 justify-between px-6 py-12">
                        <View className="flex-1 justify-center items-center">
                            <View className="w-24 h-24 bg-white/20 rounded-full justify-center items-center mb-8 backdrop-blur-md">
                                <Text className="text-5xl">👆</Text>
                            </View>

                            <Text className="text-3xl font-bold text-white text-center mb-2">
                                Enable {biometricLabel}?
                            </Text>
                            <Text className="text-white/80 text-center mb-8 px-4 text-base">
                                Use {biometricLabel} for faster and more secure access to your app.
                            </Text>
                        </View>

                        <View className="w-full gap-4 mb-8">
                            <Button
                                title={`Enable ${biometricLabel}`}
                                onPress={handleEnableBiometric}
                                fullWidth
                                // Style override for white button
                                style={{ backgroundColor: 'white' }}
                                textStyle={{ color: '#4F46E5', fontWeight: 'bold' }}
                            />
                            <Button
                                title="Skip for now"
                                variant="ghost"
                                onPress={handleSkipBiometric}
                                fullWidth
                                textStyle={{ color: 'white' }}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#312E81', '#3730A3', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
        >
            <SafeAreaView className="flex-1">
                <StatusBar style="light" />

                <View className="flex-1 px-6 pt-12">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="w-16 h-16 bg-white/20 rounded-2xl justify-center items-center mb-4 backdrop-blur-md">
                            <Text className="text-3xl">🔐</Text>
                        </View>
                        <Text className="text-2xl font-bold text-white text-center">
                            {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
                        </Text>
                        <Text className="text-white/70 text-center mt-2">
                            {step === 'create'
                                ? `Enter ${SECURITY.MIN_PIN_LENGTH}-${SECURITY.MAX_PIN_LENGTH} digits`
                                : 'Enter your PIN again to confirm'
                            }
                        </Text>
                    </View>

                    {/* PIN Dots */}
                    <Animated.View style={shakeStyle} className="mb-8">
                        <PinDots
                            length={SECURITY.MIN_PIN_LENGTH}
                            filled={step === 'create' ? pin.length : confirmPin.length}
                            maxLength={step === 'create' ? Math.max(pin.length, SECURITY.MIN_PIN_LENGTH) : pin.length}
                            error={!!error}
                            // Pass dark style prop if needed, or update component
                            theme="light"
                        />
                    </Animated.View>

                    {/* Error Message */}
                    {error ? (
                        <View className="bg-red-500/20 px-4 py-2 rounded-lg self-center mb-6">
                            <Text className="text-white font-medium text-center">{error}</Text>
                        </View>
                    ) : (
                        <View className="h-10 mb-6" />
                    )}

                    {/* Continue Button (only on create step) */}
                    {step === 'create' && pin.length >= SECURITY.MIN_PIN_LENGTH && (
                        <View className="mb-6">
                            <Button
                                title="Continue"
                                onPress={handleContinue}
                                fullWidth
                                style={{ backgroundColor: 'white' }}
                                textStyle={{ color: '#4F46E5', fontWeight: 'bold' }}
                            />
                        </View>
                    )}

                    {/* PIN Pad */}
                    <View className="flex-1 justify-end pb-8">
                        <PinPad
                            onPress={handleDigitPress}
                            onDelete={handleDelete}
                            disabled={loading}
                            theme="light" // Tell PinPad to render for dark background
                        />
                    </View>

                    {/* Back Button (on confirm step) */}
                    {step === 'confirm' && (
                        <View className="pb-4">
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
                                textStyle={{ color: 'white/70' }}
                            />
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default PinSetupScreen;
