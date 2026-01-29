import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { SplashScreen } from '../screens/auth';
import { useAuthStore, useSettingsStore } from '../stores';
import { initDatabase } from '../services/database';

export const AppNavigator: React.FC = () => {
    const [isReady, setIsReady] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [statusText, setStatusText] = useState('Initializing...');

    const {
        isAuthenticated,
        isPinSet,
        isLoading,
        checkPinSetup,
        setAuthenticated
    } = useAuthStore();
    const { loadSettings } = useSettingsStore();

    useEffect(() => {
        initApp();
    }, []);

    const initApp = async () => {
        try {
            console.log('App initialization started');
            setStatusText('Starting app...');

            // Initialize database
            console.log('Initializing database...');
            setStatusText('Initializing database...');
            await initDatabase();
            console.log('Database initialized');

            // Load settings
            console.log('Loading settings...');
            setStatusText('Loading settings...');
            await loadSettings();
            console.log('Settings loaded');

            // Check PIN setup status
            console.log('Checking PIN setup...');
            setStatusText('Checking security...');
            await checkPinSetup();
            console.log('PIN setup checked');

            setIsReady(true);
            console.log('App ready');
        } catch (error) {
            console.error('Error initializing app:', error);
            setIsReady(true);
        }
    };

    const handleSplashFinish = () => {
        setShowSplash(false);
    };

    const handleAuthenticated = () => {
        setAuthenticated(true);
    };

    // Show splash screen
    if (showSplash) {
        return <SplashScreen onFinish={handleSplashFinish} />;
    }

    // Show loading while checking auth
    if (!isReady || isLoading) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#6366F1" className="mb-4" />
                <Text className="text-gray-500 text-base">{statusText}</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? (
                <MainNavigator />
            ) : (
                <AuthNavigator
                    isPinSet={isPinSet}
                    onAuthenticated={handleAuthenticated}
                />
            )}
        </NavigationContainer>
    );
};

export default AppNavigator;
