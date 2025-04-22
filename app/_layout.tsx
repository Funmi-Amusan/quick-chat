import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'context/authContext';
import { Slot } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import '../global.css';
import { NotificationProvider } from '~/context/NotificationContext';
import toastConfig from '~/lib/toast-config';

// Custom theme definitions
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    background: '#f9f9f9',
    card: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3498db',
    background: '#00000',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#272729',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
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
    </ThemeProvider>
  );
}
