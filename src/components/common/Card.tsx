import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: ViewStyle;
    variant?: 'default' | 'outlined' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    style,
    variant = 'default'
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'outlined':
                return 'bg-white border border-slate-200';
            case 'elevated':
                return 'bg-white shadow-lg';
            default:
                return 'bg-white shadow-sm';
        }
    };

    return (
        <View
            className={`rounded-2xl p-4 ${getVariantClasses()} ${className}`}
            style={style}
        >
            {children}
        </View>
    );
};

interface SummaryCardProps {
    title: string;
    value: string;
    icon?: string;
    color?: string;
    subtitle?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    icon,
    color = '#6366F1',
    subtitle
}) => {
    return (
        <View
            className="rounded-2xl p-4 flex-1 min-w-[140px]"
            style={{ backgroundColor: `${color}15` }}
        >
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-600 text-sm font-medium">{title}</Text>
                {icon && <Text className="text-xl">{icon}</Text>}
            </View>
            <Text
                className="text-xl font-bold"
                style={{ color }}
            >
                {value}
            </Text>
            {subtitle && (
                <Text className="text-slate-500 text-xs mt-1">{subtitle}</Text>
            )}
        </View>
    );
};

export default Card;
