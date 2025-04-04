import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

const ActiveTypingBubble = () => {
  const [dot1Opacity, setDot1Opacity] = useState(0.3);
  const [dot2Opacity, setDot2Opacity] = useState(0.3);
  const [dot3Opacity, setDot3Opacity] = useState(0.3);

  useEffect(() => {
    const animateDot = (setOpacity, delay) => {
      setTimeout(() => {
        setOpacity(1);
        setTimeout(() => {
          setOpacity(0.3);
        }, 300);
      }, delay);
    };

    const startAnimation = () => {
      animateDot(setDot1Opacity, 0);
      animateDot(setDot2Opacity, 150);
      animateDot(setDot3Opacity, 300);
    };

    const interval = setInterval(() => {
      startAnimation();
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="my-2 ml-4 flex-row items-center">
      <View className="my-1 rounded-2xl rounded-bl-sm bg-[#F4EFF4] p-4 shadow-sm">
        <View className="flex-row gap-2">
          <View style={{ opacity: dot1Opacity }} className="h-2 w-2 rounded-full bg-gray-500" />
          <View style={{ opacity: dot2Opacity }} className="h-2 w-2 rounded-full bg-gray-500" />
          <View style={{ opacity: dot3Opacity }} className="h-2 w-2 rounded-full bg-gray-500" />
        </View>
      </View>
    </View>
  );
};

export default ActiveTypingBubble;
