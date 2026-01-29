import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SplashScreen, PinSetupScreen, PinEntryScreen } from '../screens/auth';

export type AuthStackParamList = {
    Splash: undefined;
    PinSetup: undefined;
    PinEntry: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
    isPinSet: boolean;
    onAuthenticated: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({
    isPinSet,
    onAuthenticated
}) => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isPinSet ? (
                <Stack.Screen name="PinSetup">
                    {() => <PinSetupScreen onComplete={onAuthenticated} />}
                </Stack.Screen>
            ) : (
                <Stack.Screen name="PinEntry">
                    {() => <PinEntryScreen onSuccess={onAuthenticated} />}
                </Stack.Screen>
            )}
        </Stack.Navigator>
    );
};

export default AuthNavigator;
