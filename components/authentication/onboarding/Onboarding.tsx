import { Link } from 'expo-router';
import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

const Onboarding = () => {
  return (
    <>
      <SafeAreaView className=" flex-1 bg-slate-200">
        <View className=" flex-1 items-center justify-center">
          <Text className=" text-2xl font-semibold ">Welcome to Quick Chat</Text>
        </View>
        <View className=" m-10">
          <Link
            className=" mb-4 rounded-full bg-violet-500 p-2 text-center text-lg font-semibold text-white"
            href="/sign-in">
            Sign In
          </Link>
          <Link
            className=" rounded-full bg-violet-500 p-2 text-center text-lg font-semibold text-white"
            href="/sign-up">
            Sign Up
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
};

export default Onboarding;
