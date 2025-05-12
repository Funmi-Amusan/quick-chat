import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  useDerivedValue,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

import { emotionsData } from '~/lib/data';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Orb = ({ emotionIntensity = 0, size = 600 }) => {
  const animatedTime1 = useSharedValue(0);
  const animatedTime2 = useSharedValue(0);
  const animatedTime3 = useSharedValue(0);

  useEffect(() => {
    animatedTime1.value = 0;
    animatedTime2.value = 0;
    animatedTime3.value = 0;

    animatedTime1.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );

    setTimeout(() => {
      animatedTime2.value = withRepeat(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    }, 2000);

    setTimeout(() => {
      animatedTime3.value = withRepeat(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    }, 4600);

    return () => {
      animatedTime1.value = 0;
      animatedTime2.value = 0;
      animatedTime3.value = 0;
    };
  }, []);

  const colorIndex = Math.min(Math.floor(emotionIntensity / 10), emotionsData.length - 1);
  const baseHue = emotionsData[colorIndex]?.hue || 270;

  const lighterColor = `hsl(${baseHue}, 70%, 85%)`;
  const midColor = `hsl(${baseHue}, 40%, 80%)`;
  const darkerColor = `hsl(${baseHue}, 70%, 60%)`;

  const animatedViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + animatedTime1.value * 0.01 }],
    };
  });

  const radius1 = useDerivedValue(() => {
    return interpolate(animatedTime1.value, [0, 1], [62, 208]);
  });

  const radius2 = useDerivedValue(() => {
    return interpolate(animatedTime2.value, [0, 1], [62, 208]);
  });

  const radius3 = useDerivedValue(() => {
    return interpolate(animatedTime3.value, [0, 1], [62, 208]);
  });

  const opacity1 = useDerivedValue(() => {
    return interpolate(animatedTime1.value, [0, 0.7, 1], [0.6, 0.4, 0]);
  });

  const opacity2 = useDerivedValue(() => {
    return interpolate(animatedTime2.value, [0, 0.7, 1], [0.6, 0.4, 0]);
  });

  const opacity3 = useDerivedValue(() => {
    return interpolate(animatedTime3.value, [0, 0.7, 1], [0.6, 0.4, 0]);
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedViewStyle,
      ]}>
      <AnimatedSvg width="100%" height="100%" viewBox="0 0 800 800">
        <Defs>
          <RadialGradient id="cccircular-grad" r="50%" cx="50%" cy="50%">
            <Stop offset="15%" stopColor={darkerColor} stopOpacity="0.5" />
            <Stop offset="75%" stopColor={lighterColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={midColor} stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Static background circles */}
        <Circle r="124" cx="400" cy="400" opacity="0.3" fill="url(#cccircular-grad)" />
        <Circle r="93" cx="400" cy="400" opacity="0.5" fill="url(#cccircular-grad)" />
        <Circle r="62" cx="400" cy="400" opacity="0.7" fill="url(#cccircular-grad)" />

        {/* Animated expanding circles */}
        <AnimatedCircle
          r={radius1}
          cx="400"
          cy="400"
          opacity={opacity1}
          stroke={midColor}
          strokeWidth="4"
          fill="url(#cccircular-grad)"
        />
        <AnimatedCircle
          r={radius2}
          cx="400"
          cy="400"
          opacity={opacity2}
          stroke={midColor}
          strokeWidth="4"
          fill="url(#cccircular-grad)"
        />
        <AnimatedCircle
          r={radius3}
          cx="400"
          cy="400"
          opacity={opacity3}
          stroke={midColor}
          strokeWidth="4"
          fill="url(#cccircular-grad)"
        />
      </AnimatedSvg>
    </Animated.View>
  );
};

export default Orb;
