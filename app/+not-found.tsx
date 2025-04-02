import { Link, Stack } from 'expo-router';
import { SafeAreaView, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <SafeAreaView>
        <Stack.Screen options={{ title: 'Oops!' }} />

        <Text className="">This screen doesn't exist.</Text>
        <Link href="/sign-in" className="">
          <Text className="">Go to home screen!</Text>
        </Link>
      </SafeAreaView>
    </>
  );
}
