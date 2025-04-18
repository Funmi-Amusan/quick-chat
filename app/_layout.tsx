import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'context/authContext';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '../global.css';
import { NotificationProvider } from '~/context/NotificationContext';

const queryClient = new QueryClient();

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <SessionProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Slot />
          </GestureHandlerRootView>
        </SessionProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}
