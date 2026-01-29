import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    showBack = false,
    onBack,
    rightAction
}) => {
    return (
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
            <View className="flex-row items-center flex-1">
                {showBack && onBack && (
                    <TouchableOpacity
                        onPress={onBack}
                        className="mr-3 p-2 -ml-2"
                    >
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                )}
                <View className="flex-1">
                    <Text className="text-xl font-bold text-slate-800" numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text className="text-sm text-slate-500">{subtitle}</Text>
                    )}
                </View>
            </View>
            {rightAction && (
                <View className="ml-4">
                    {rightAction}
                </View>
            )}
        </View>
    );
};

interface ScreenContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
    children,
    className = ''
}) => {
    return (
        <SafeAreaView className={`flex-1 bg-slate-50 ${className}`}>
            {children}
        </SafeAreaView>
    );
};

export default Header;
