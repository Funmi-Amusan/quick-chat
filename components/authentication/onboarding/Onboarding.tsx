import { Link } from 'expo-router';
import React from 'react';
import { View, Text, SafeAreaView, Image } from 'react-native';

import { ImageAssets } from '~/assets';

const Onboarding = () => {
  return (
    <>
      <SafeAreaView className=" flex-1 bg-body">
        <View className=" flex-1 items-center justify-center gap-5">
          <Image
            source={ImageAssets.onboardingIllustration}
            alt="Chatting Illustration"
            className=" h-64 w-64"
          />
          <Text className=" text-2xl font-semibold ">Welcome to Quick Chat</Text>
        </View>
        <View className=" m-10">
          <Link
            className=" bg-primary mb-4 rounded-full p-2 text-center text-lg font-semibold text-white"
            href="/sign-in">
            Sign In
          </Link>
          <Link
            className=" bg-primary rounded-full p-2 text-center text-lg font-semibold text-white"
            href="/sign-up">
            Sign Up
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
};

export default Onboarding;
