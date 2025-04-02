import { Stack, Link } from 'expo-router';

export default function Home() {
  return (
    <>
      <Stack.Screen />
      <Link href="/(auth)/sign-in">Sign In</Link>
    </>
  );
}
