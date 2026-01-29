import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
    static async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return false;
        }

        return true;
    }

    static async scheduleNotification(
        title: string,
        body: string,
        triggerDate: Date,
        data: Record<string, any> = {}
    ): Promise<string | null> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return null;

        // Ensure date is in the future
        if (triggerDate.getTime() <= Date.now()) {
            console.warn('Notification scheduled for past time, skipping.');
            return null;
        }

        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: true,
                },
                trigger: triggerDate as any,
            });
            return id;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    }

    static async cancelNotification(notificationId: string) {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
            console.error('Error cancelling notification:', error);
        }
    }

    static async getAllScheduledNotifications() {
        return await Notifications.getAllScheduledNotificationsAsync();
    }
}
