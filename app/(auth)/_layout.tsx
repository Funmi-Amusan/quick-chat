import '../../global.css';
import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
        headerBackTitle: 'Back',
        headerShown: false,
        contentStyle: {
          backgroundColor: '#fff',
        },
      }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
    </Stack>
  );
}
