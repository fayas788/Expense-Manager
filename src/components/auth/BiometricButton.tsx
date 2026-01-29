import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface BiometricButtonProps {
    type: 'fingerprint' | 'facial' | 'none';
    onPress: () => void;
    disabled?: boolean;
    label?: string;
}

export const BiometricButton: React.FC<BiometricButtonProps> = ({
    type,
    onPress,
    disabled = false,
    label
}) => {
    if (type === 'none') return null;

    const handlePress = async () => {
        if (disabled) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    const icon = type === 'facial' ? '😊' : '👆';
    const defaultLabel = type === 'facial' ? 'Use Face ID' : 'Use Fingerprint';

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled}
            className="flex-row items-center justify-center py-3 px-6 rounded-xl bg-primary-50 active:bg-primary-100"
            style={{ opacity: disabled ? 0.5 : 1 }}
        >
            <Text className="text-2xl mr-2">{icon}</Text>
            <Text className="text-primary-600 font-semibold text-base">
                {label || defaultLabel}
            </Text>
        </TouchableOpacity>
    );
};

export default BiometricButton;
