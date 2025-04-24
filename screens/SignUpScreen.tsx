import { useMutation } from '@tanstack/react-query';
import { useSession } from 'context/authContext';
import { router, Link } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import Toast from 'react-native-toast-message';
import { BaseTextInput } from '~/components/ui';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { signUp } = useSession();

  const register = async () => {
    try {
      const response = await signUp(email, password, name);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const { mutate: handleRegister, isPending } = useMutation({
    mutationFn: register,
    onSuccess: () => {
      router.replace('/sign-in');
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

  const handleRegisterPress = () => {
    handleRegister();
  };

  return (
    <View className="dark:bg-bodyDark flex-1 items-center justify-center bg-body-light p-4 dark:bg-body-dark">
      <View className="mb-8 items-center">
        <Text className="text-2xl font-bold text-title-light dark:text-title-dark">
          Create Account
        </Text>
        <Text className="text-base text-greyText-light dark:text-greyText-dark ">
          Sign up to get started
        </Text>
      </View>

      <View className="mb-8 w-full max-w-[300px] space-y-4">
        <View>
          <BaseTextInput
            label="Your username"
            value={name}
            onChangeText={setName}
            textContentType="username"
          />
        </View>

        <View>
          <BaseTextInput
            label="Your email"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
          />
        </View>

        <View>
          <BaseTextInput
            label="Your password"
            value={password}
            onChangeText={setPassword}
            textContentType="password"
          />
        </View>
      </View>
      <Pressable
        onPress={handleRegisterPress}
        className="w-full max-w-[300px] rounded-lg bg-primary py-3 active:bg-lighterPrimary">
        <Text className="text-center text-base font-semibold text-white">
          {isPending ? 'Processing' : 'Sign up'}
        </Text>
      </Pressable>
      <View className="mt-6 flex-row items-center">
        <Text className="text-greyText-light dark:text-greyText-dark ">
          Already have an account?
        </Text>
        <Link href="/sign-in" asChild>
          <Pressable className="ml-2">
            <Text className="font-semibold text-primary">Sign In</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
