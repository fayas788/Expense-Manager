import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withDelay,
    withSequence
} from 'react-native-reanimated';

interface SplashScreenProps {
    onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        logoScale.value = withSpring(1, { damping: 12 });
        logoOpacity.value = withSpring(1);
        textOpacity.value = withDelay(300, withSpring(1));

        // Call onFinish after animation
        if (onFinish) {
            const timer = setTimeout(onFinish, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value
    }));

    return (
        <View className="flex-1 bg-primary-500 justify-center items-center">
            <StatusBar style="light" />

            <Animated.View
                style={logoStyle}
                className="w-28 h-28 bg-white rounded-3xl justify-center items-center mb-6 shadow-lg"
            >
                <Text className="text-5xl">💰</Text>
            </Animated.View>

            <Animated.View style={textStyle} className="items-center">
                <Text className="text-white text-3xl font-bold mb-2">
                    Expense Manager
                </Text>
                <Text className="text-primary-100 text-base">
                    Track • Manage • Save
                </Text>
            </Animated.View>

            <View className="absolute bottom-16">
                <ActivityIndicator color="#fff" size="small" />
            </View>
        </View>
    );
};

export default SplashScreen;
