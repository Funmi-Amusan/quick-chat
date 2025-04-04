import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const ActiveTypingBubble = () => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    const startAnimation = () => {
      dot1Opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 300 })
      );
      dot2Opacity.value = withDelay(
        150,
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 }))
      );
      dot3Opacity.value = withDelay(
        300,
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 }))
      );
    };

    const interval = setInterval(() => {
      startAnimation();
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  return (
    <View className="my-2 ml-4 flex-row items-center">
      <View className="my-1 rounded-2xl rounded-bl-sm bg-[#F4EFF4] p-4  shadow-sm">
        <View className="flex-row gap-2">
          <Animated.View style={[dot1Style]} className="h-2 w-2 rounded-full bg-gray-500" />
          <Animated.View style={[dot2Style]} className="h-2 w-2 rounded-full bg-gray-500" />
          <Animated.View style={[dot3Style]} className="h-2 w-2 rounded-full bg-gray-500" />
        </View>
      </View>
    </View>
  );
};

export default ActiveTypingBubble;
