import { Stack, Link } from 'expo-router';
import { SafeAreaView, View, Text } from 'react-native';

export default function Home() {
  return (
    <>
      <SafeAreaView className=" flex-1 bg-blue-300">
        <Stack.Screen />
        <View>
          <Text className=" text-2xl font-semibold ">Onboarding Screen</Text>
        </View>
        <Link className=" mb-4 rounded-full bg-blue-700 p-2" href="/sign-in">
          Sign In
        </Link>
        <Link className=" rounded-full bg-blue-700 p-2" href="/sign-up">
          Sign Up
        </Link>
      </SafeAreaView>
    </>
  );
}
