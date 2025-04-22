// app/_layout.js or app/_layout.tsx
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

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
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#272729',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
      <Stack>
        {/* Your stack screens */}
      </Stack>
    </ThemeProvider>
  );
}