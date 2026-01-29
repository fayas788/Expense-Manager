import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PinPadProps {
    onPress: (digit: string) => void;
    onDelete: () => void;
    onBiometric?: () => void;
    showBiometric?: boolean;
    disabled?: boolean;
}

export const PinPad: React.FC<PinPadProps> = ({
    onPress,
    onDelete,
    onBiometric,
    showBiometric = false,
    disabled = false
}) => {
    const handlePress = async (digit: string) => {
        if (disabled) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(digit);
    };

    const handleDelete = async () => {
        if (disabled) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDelete();
    };

    const handleBiometric = async () => {
        if (disabled || !onBiometric) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onBiometric();
    };

    const digits = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        [showBiometric ? 'biometric' : '', '0', 'delete']
    ];

    return (
        <View className="w-full max-w-[300px] mx-auto">
            {digits.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row justify-center mb-4">
                    {row.map((item, colIndex) => {
                        if (item === '') {
                            return <View key={colIndex} className="w-20 h-20 mx-2" />;
                        }

                        if (item === 'delete') {
                            return (
                                <PinButton
                                    key={colIndex}
                                    onPress={handleDelete}
                                    disabled={disabled}
                                >
                                    <Text className="text-2xl text-slate-700">⌫</Text>
                                </PinButton>
                            );
                        }

                        if (item === 'biometric') {
                            return (
                                <PinButton
                                    key={colIndex}
                                    onPress={handleBiometric}
                                    disabled={disabled}
                                >
                                    <Text className="text-2xl">👆</Text>
                                </PinButton>
                            );
                        }

                        return (
                            <PinButton
                                key={colIndex}
                                onPress={() => handlePress(item)}
                                disabled={disabled}
                            >
                                <Text className="text-3xl font-semibold text-slate-800">{item}</Text>
                            </PinButton>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

interface PinButtonProps {
    onPress: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

const PinButton: React.FC<PinButtonProps> = ({ onPress, disabled, children }) => {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            className="w-20 h-20 mx-2 rounded-full bg-slate-100 justify-center items-center active:bg-slate-200"
            style={({ pressed }) => ({
                opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }]
            })}
        >
            {children}
        </Pressable>
    );
};

export default PinPad;
