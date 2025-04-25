import { Link } from 'expo-router';
import { View, Text, SafeAreaView, Image } from 'react-native';

import { ImageAssets } from '~/assets';

const Onboarding = () => {

  return (
    <>
      <SafeAreaView className=" flex-1 bg-body-light dark:bg-body-dark">
        <View className=" flex-1 items-center justify-center gap-5">
          <Image
            source={ImageAssets.onboardingIllustration}
            alt="Chatting Illustration"
            className=" h-64 w-64"
          />
          <Text className=" text-2xl font-semibold text-title-light dark:text-title-dark ">
            Welcome to Quick Chat
          </Text>
        </View>
        <View className=" m-10">
          <Link
            className=" mb-4 rounded-full bg-primary p-2 text-center text-lg font-semibold text-white"
            href="/sign-in">
            Sign In
          </Link>
          <Link
            className=" rounded-full bg-primary p-2 text-center text-lg font-semibold text-white"
            href="/sign-up">
            Sign Up
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
};

export default Onboarding;
