import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'context/authContext';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import '../global.css';
import { NotificationProvider } from '~/context/NotificationContext';
import toastConfig from '~/lib/toast-config';

const queryClient = new QueryClient();

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <SessionProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Slot />
          </GestureHandlerRootView>
          <Toast config={toastConfig} visibilityTime={5000} />
        </SessionProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}
