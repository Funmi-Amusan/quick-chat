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
    <View className="flex-1 items-center justify-center p-4 bg-body-light dark:bg-body-dark">
      <TouchableOpacity className=" rounded-xl bg-primary p-4" onPress={() => handleSignOut()}>
        <Text className="text-title-light dark:text-title-dark">Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
