import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';

import { useSession } from '~/context/authContext';

const ProfileScreen = () => {
  const { signOut } = useSession();

  const handleSignOut = () => {
    signOut();
    router.replace('/sign-in');
  };
  return (
    <View className="flex-1 items-center justify-center p-4">
      <TouchableOpacity className=" rounded-xl bg-violet-700 p-4" onPress={() => handleSignOut()}>
        <Text className="text-white">Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
