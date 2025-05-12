import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'context/authContext';
import { router, Link } from 'expo-router';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Text, View, Pressable } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { BaseTextInput } from '~/components/ui';

const signUpSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const { signUp } = useSession();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const register = async (data: SignUpFormData) => {
    try {
      const response = await signUp(data.email, data.password, data.name);
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
          text2: 'Something went wrong, pls try again',
        });
      }
    },
  });

  const handleRegisterPress = handleSubmit((data) => handleRegister(data));

  return (
    <View className="dark:bg-bodyDark flex-1 flex-col items-center justify-center gap-4 bg-body-light p-4 dark:bg-body-dark">
      <View className="items-center">
        <Text className="text-3xl font-bold text-title-light dark:text-title-dark">
          Create Account
        </Text>
        <Text className="text-base text-greyText-light dark:text-greyText-dark ">
          Sign up to get started
        </Text>
      </View>

      <View className=" w-full max-w-[300px] space-y-4">
        <View>
          <Controller
            control={control}
            rules={{ required: 'Email is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <BaseTextInput
                label="Your username"
                placeholder="Jane Doe"
                value={value}
                onChangeText={onChange}
                textContentType="username"
                hasError={!!errors.name}
                errorMsg={errors.name?.message}
              />
            )}
            name="name"
          />
        </View>

        <View>
        <Controller
            control={control}
            rules={{ required: 'Email is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <BaseTextInput
                label="Your email"
                placeholder="jane.doe@example.com"
                value={value}
                onChangeText={onChange}
                textContentType="emailAddress"
                hasError={!!errors.name}
                errorMsg={errors.name?.message}
              />
            )}
            name="email"
          />
        </View>

        <View>
        <Controller
            control={control}
            rules={{ required: 'Password is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <BaseTextInput
                placeholder="Your password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                textContentType="password"
                label="Your password"
                hasError={!!errors.password}
                errorMsg={errors.password?.message}
              />
            )}
            name="password"
          />
        </View>
      </View>
      <View className="w-full flex-col items-center gap-4 text-center">
        <Pressable
          onPress={handleRegisterPress}
          className="w-full max-w-[300px] rounded-full bg-primary p-4 active:bg-lighterPrimary">
          <Text className="text-center text-base font-semibold text-white">
            {isPending || isSubmitting ? 'Processing' : 'Sign up'}
          </Text>
        </Pressable>
        <View className="  flex-row items-center">
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
    </View>
  );
}
