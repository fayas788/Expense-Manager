import React from 'react';
import { View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface PinDotsProps {
    length: number;
    filled: number;
    maxLength: number;
    error?: boolean;
    success?: boolean;
}

export const PinDots: React.FC<PinDotsProps> = ({
    length,
    filled,
    maxLength,
    error,
    success
}) => {
    const dots = Array(maxLength).fill(0);

    return (
        <View className="flex-row justify-center items-center gap-4 my-8">
            {dots.map((_, index) => (
                <PinDot
                    key={index}
                    filled={index < filled}
                    error={error}
                    success={success}
                />
            ))}
        </View>
    );
};

interface PinDotProps {
    filled: boolean;
    error?: boolean;
    success?: boolean;
}

const PinDot: React.FC<PinDotProps> = ({ filled, error, success }) => {
    const animatedStyle = useAnimatedStyle(() => {
        let backgroundColor = filled ? '#6366F1' : '#E2E8F0';

        if (error) backgroundColor = '#EF4444';
        if (success) backgroundColor = '#22C55E';

        return {
            transform: [{
                scale: withSpring(filled ? 1.2 : 1, { damping: 15 })
            }],
            backgroundColor
        };
    });

    return (
        <Animated.View
            className="w-4 h-4 rounded-full"
            style={animatedStyle}
        />
    );
};

export default PinDots;
