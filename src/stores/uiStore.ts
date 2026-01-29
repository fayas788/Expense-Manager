import { create } from 'zustand';

interface AlertState {
    isVisible: boolean;
    title: string;
    message: string;
    buttons: {
        text: string;
        style?: 'default' | 'cancel' | 'destructive';
        onPress?: () => void;
    }[];
    showAlert: (
        title: string,
        message: string,
        buttons?: {
            text: string;
            style?: 'default' | 'cancel' | 'destructive';
            onPress?: () => void;
        }[]
    ) => void;
    hideAlert: () => void;
}

export const useUIStore = create<AlertState>((set) => ({
    isVisible: false,
    title: '',
    message: '',
    buttons: [],
    showAlert: (title, message, buttons = [{ text: 'OK' }]) =>
        set({
            isVisible: true,
            title,
            message,
            buttons,
        }),
    hideAlert: () =>
        set({
            isVisible: false,
            title: '',
            message: '',
            buttons: [],
        }),
}));
