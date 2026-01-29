import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    DashboardScreen,
    TransactionsScreen,
    AddTransactionScreen,
    ReportsScreen,
    PeopleScreen,
    SettingsScreen,
    TransactionDetailsScreen
} from '../screens/main';

export type MainTabParamList = {
    Dashboard: undefined;
    Transactions: undefined;
    Reports: undefined;
    People: undefined;
    Settings: undefined;
};

export type MainStackParamList = {
    MainTabs: undefined;
    AddTransaction: { type?: 'borrow' | 'lend' | 'expense'; id?: string };
    TransactionDetails: { id: string };
    PinChange: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const tabConfig = [
    { name: 'Dashboard', icon: '🏠', label: 'Home' },
    { name: 'Transactions', icon: '📋', label: 'Activity' },
    { name: 'Reports', icon: '📊', label: 'Reports' },
    { name: 'People', icon: '👥', label: 'People' },
    { name: 'Settings', icon: '⚙️', label: 'Settings' },
];

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
            <View style={styles.tabBarBackground}>
                <View style={styles.tabBarInner}>
                    {state.routes.map((route: any, index: number) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;
                        const config = tabConfig[index];

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                style={styles.tabItem}
                                activeOpacity={0.7}
                            >
                                {isFocused ? (
                                    <LinearGradient
                                        colors={['#6366F1', '#818CF8']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.activeIndicator}
                                    >
                                        <Text style={styles.tabIcon}>{config.icon}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.inactiveIndicator}>
                                        <Text style={[styles.tabIcon, { opacity: 0.5 }]}>{config.icon}</Text>
                                    </View>
                                )}
                                <Text style={[
                                    styles.tabLabel,
                                    { color: isFocused ? '#6366F1' : '#94A3B8' }
                                ]}>
                                    {config.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    tabBarBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    tabBarInner: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    activeIndicator: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inactiveIndicator: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabIcon: {
        fontSize: 22,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
});

const MainTabs = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Transactions" component={TransactionsScreen} />
            <Tab.Screen name="Reports" component={ReportsScreen} />
            <Tab.Screen name="People" component={PeopleScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

export const MainNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
                name="AddTransaction"
                component={AddTransactionScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="TransactionDetails"
                component={TransactionDetailsScreen} // Was DashboardScreen placeholder
                options={{ presentation: 'card' }}
            />
        </Stack.Navigator>
    );
};

export default MainNavigator;
