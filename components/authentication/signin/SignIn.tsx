import { useMutation } from '@tanstack/react-query';
import { useSession } from 'context/authContext';
import { router, Link } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View, Pressable, Alert } from 'react-native';
import Toast, { } from 'react-native-toast-message';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useSession();

  const handleLogin = async () => {
    try {
      return await signIn(email, password);
    } catch (err) {
      throw err;
    }
  };

  const { mutate: login, isPending } = useMutation({
    mutationFn: handleLogin,
    onSuccess: () => {
      router.replace('/(tabs)/chats');
    },
    onError: (error) => {
      if (error instanceof Error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Something went wrong',
        });
      }
    },
  });

  const handleSignInPress = () => {
    login();
  };

  return (
    <View className="flex-1 items-center justify-center bg-body p-4">
      <View className="mb-8 items-center">
        <Text className="mb-2 text-2xl font-bold text-gray-800">Welcome Back</Text>
        <Text className="text-sm text-gray-500">Please sign in to continue</Text>
      </View>

      <View className="mb-8 w-full max-w-[300px] space-y-4">
        <View>
          <Text className="mb-1 ml-1 text-sm font-medium text-gray-700">Email</Text>
          <TextInput
            placeholder="name@mail.com"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base"
          />
        </View>

        <View>
          <Text className="mb-1 ml-1 text-sm font-medium text-gray-700">Password</Text>
          <TextInput
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base"
          />
        </View>
      </View>

      <Pressable
        onPress={handleSignInPress}
        className="w-full max-w-[300px] rounded-lg bg-primary py-3 active:bg-lighterPrimary">
        <Text className="text-center text-base font-semibold text-white">
          {isPending ? 'Processing' : 'Sign In'}
        </Text>
      </Pressable>

      <View className="mt-6 flex-row items-center">
        <Text className="text-gray-600">Don't have an account?</Text>
        <Link href="/sign-up" asChild>
          <Pressable className="ml-2">
            <Text className="font-semibold text-primary">Sign Up</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
