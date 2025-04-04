import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {} from 'expo-modules-core';
import { registerForPushNotificationsAsync } from '~/lib/registerForPushNotificationAsync';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  scheduleNotification: (data: NotificationData, callback: () => void) => void;
  cancelAllNotifications: () => void;
  cancelNotification: (id: string) => void;
}

export type NotificationData = {
  title: string;
  body: string;
  identifier?: string;
  date: Date | null;
  otherData: Record<string, any> | undefined | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [notificationCallbacks, setNotificationCallbacks] = useState<Map<string, () => void>>(
    new Map()
  );

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => setExpoPushToken(token ?? ''),
      (error) => setError(error)
    );

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification Received: user recieved notification', notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(
        '🔔 Notification Response: user interacted with notification',
        JSON.stringify(response, null, 2),
        JSON.stringify(response.notification.request.content.data, null, 2)
      );
      const notificationId = response.notification.request.identifier;
      const callback = notificationCallbacks.get(notificationId);
      if (callback) {
        callback();
        setNotificationCallbacks((prevCallbacks) => {
          const newCallbacks = new Map(prevCallbacks);
          newCallbacks.delete(notificationId);
          return newCallbacks;
        });
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const scheduleNotification = async (data: NotificationData, callback: () => void) => {
    const { date, title, body, identifier } = data;
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data.otherData || {},
      },
      trigger: date
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(date),
          }
        : null,
      identifier,
    });

    if (notificationId) {
      setNotificationCallbacks((prevCallbacks) =>
        new Map(prevCallbacks).set(notificationId, callback)
      );
    }
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setNotificationCallbacks(new Map());
  };

  const cancelNotification = async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    setNotificationCallbacks((prevCallbacks) => {
      const newCallbacks = new Map(prevCallbacks);
      newCallbacks.delete(id);
      return newCallbacks;
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        error,
        scheduleNotification,
        cancelAllNotifications,
        cancelNotification,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};
