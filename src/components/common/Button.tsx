import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleProp, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    fullWidth = false,
    style,
    textStyle
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'primary':
                return 'bg-primary-500 active:bg-primary-600';
            case 'secondary':
                return 'bg-slate-100 active:bg-slate-200';
            case 'danger':
                return 'bg-red-500 active:bg-red-600';
            case 'ghost':
                return 'bg-transparent active:bg-slate-100';
            default:
                return 'bg-primary-500 active:bg-primary-600';
        }
    };

    const getTextClasses = () => {
        switch (variant) {
            case 'primary':
            case 'danger':
                return 'text-white';
            case 'secondary':
                return 'text-slate-700';
            case 'ghost':
                return 'text-primary-500';
            default:
                return 'text-white';
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'px-4 py-2';
            case 'md':
                return 'px-6 py-3';
            case 'lg':
                return 'px-8 py-4';
            default:
                return 'px-6 py-3';
        }
    };

    const getTextSize = () => {
        switch (size) {
            case 'sm':
                return 'text-sm';
            case 'md':
                return 'text-base';
            case 'lg':
                return 'text-lg';
            default:
                return 'text-base';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={`
        rounded-xl flex-row justify-center items-center
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
      `}
            style={[{ opacity: disabled || loading ? 0.6 : 1 }, style]}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' || variant === 'danger' ? '#fff' : '#6366F1'}
                />
            ) : (
                <>
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text
                        className={`font-semibold ${getTextClasses()} ${getTextSize()}`}
                        style={textStyle}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

export default Button;
