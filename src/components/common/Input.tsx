import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    containerClassName = '',
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View className={`mb-4 ${containerClassName}`}>
            {label && (
                <Text className="text-slate-700 font-medium mb-2 text-sm">{label}</Text>
            )}
            <View
                className={`
          flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border
          ${isFocused ? 'border-primary-500' : error ? 'border-red-400' : 'border-slate-200'}
        `}
            >
                {leftIcon && <View className="mr-3">{leftIcon}</View>}
                <TextInput
                    className="flex-1 text-slate-800 text-base"
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
                {rightIcon && <View className="ml-3">{rightIcon}</View>}
            </View>
            {error && (
                <Text className="text-red-500 text-xs mt-1">{error}</Text>
            )}
        </View>
    );
};

interface AmountInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
    label?: string;
    error?: string;
    value: string;
    onChangeText: (value: string) => void;
    currencySymbol?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
    label,
    error,
    value,
    onChangeText,
    currencySymbol = '₹',
    ...props
}) => {
    const handleChange = (text: string) => {
        // Allow only numbers and one decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        if (parts[1]?.length > 2) return;
        onChangeText(cleaned);
    };

    return (
        <View className="mb-4">
            {label && (
                <Text className="text-slate-700 font-medium mb-2 text-sm">{label}</Text>
            )}
            <View
                className={`
          flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border
          ${error ? 'border-red-400' : 'border-slate-200'}
        `}
            >
                <Text className="text-2xl text-slate-600 mr-2">{currencySymbol}</Text>
                <TextInput
                    className="flex-1 text-slate-800 text-2xl font-semibold"
                    value={value}
                    onChangeText={handleChange}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    {...props}
                />
            </View>
            {error && (
                <Text className="text-red-500 text-xs mt-1">{error}</Text>
            )}
        </View>
    );
};

export default Input;
