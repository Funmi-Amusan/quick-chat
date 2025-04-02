import { Link, Stack } from 'expo-router';
import { Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />

      <Text className="">This screen doesn't exist.</Text>
      <Link href="/" className="">
        <Text className="">Go to home screen!</Text>
      </Link>
    </>
  );
}
