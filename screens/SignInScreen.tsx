import { useMutation } from '@tanstack/react-query';
import { useSession } from 'context/authContext';
import { router, Link } from 'expo-router';
import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import Toast from 'react-native-toast-message';

import { BaseTextInput } from '~/components/ui';

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
    <View className="flex-1 items-center justify-center bg-body-light p-4 dark:bg-body-dark">
      <View className="mb-8 items-center">
        <Text className="text-2xl font-bold text-title-light dark:text-title-dark">
          Welcome Back
        </Text>
        <Text className=" text-base text-greyText-light dark:text-greyText-dark">
          Please sign in to continue
        </Text>
      </View>

      <View className="mb-8 w-full max-w-[300px] space-y-4">
        <View>
          <BaseTextInput
            label="Your email"
            placeholder="Your email"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
          />
        </View>

        <View>
          <BaseTextInput
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            label="Your password"
          />
        </View>
      </View>

      <View className=" w-full items-center text-center ">
        <Pressable
          onPress={handleSignInPress}
          className=" w-full max-w-[300px] rounded-full bg-primary p-4 active:bg-lighterPrimary ">
          <Text className="text-center text-base font-semibold text-white">
            {isPending ? 'Processing' : 'Sign In'}
          </Text>
        </Pressable>

        <View className="flex-row items-center pt-6">
          <Text className="text-greyText-light dark:text-greyText-dark">
            Don't have an account?
          </Text>
          <Link href="/sign-up" asChild>
            <Pressable className="ml-2">
              <Text className="font-semibold text-primary ">Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
