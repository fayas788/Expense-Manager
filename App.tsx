import './global.css';
import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { AppNavigator } from './src/navigation';
import { useSettingsStore } from './src/stores';

import { CustomAlert } from './src/components/common/CustomAlert';

// Configure notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(console.warn);

export default function App() {
  console.log("App component mounting...");

  // Force light mode
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    setColorScheme('light');
  }, [setColorScheme]);

  const onLayoutRootView = useCallback(async () => {
    // This tells the splash screen to hide immediately! If we do this as soon as we render the root view,
    // the native splash screen will go away, potentially revealing our custom splash screen.
    console.log("Root view layout done, hiding native splash screen");
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    // Fallback: If for some reason onLayoutRootView is not called (e.g. layout issue),
    // force hide splash screen after 5 seconds so user isn't stuck forever.
    const timeout = setTimeout(async () => {
      console.log("Fallback: Forcing splash screen hide after 5s");
      await SplashScreen.hideAsync();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // Set up notification channels for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AppNavigator />
        <CustomAlert />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

