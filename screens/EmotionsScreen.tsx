import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  useColorScheme,
} from 'react-native';

import Orb from '~/components/ui/Orb';
import GradientSlider from '~/components/ui/Slider';
import { emotionsData } from '~/lib/data';

const { width, height } = Dimensions.get('window');

const EmotionSelectionScreen: React.FC = () => {
  const [emotionIntensity, setEmotionIntensity] = useState(25); // Start at neutral
  const [selectedEmotion, setSelectedEmotion] = useState('Neutral');
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const renderEmotionCircle = () => {
    return (
      <View
        style={{
          width: width * 0.7,
          height: width * 0.7,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Orb emotionIntensity={emotionIntensity} />
      </View>
    );
  };

  const { baseHue, baseColor, lighterColor, buttonStyle, backgroundColors } = useMemo(() => {
    const colorIndex = Math.min(Math.floor(emotionIntensity / 10), emotionsData.length - 1);
    const baseHue = emotionsData[colorIndex]?.hue || 270;

    const baseColor = `hsla(${baseHue}, 70%, 30%, 0.8)`;
    const lighterColor = `hsl(${baseHue}, 50%, 50%)`;

    const buttonStyle = {
      backgroundColor: lighterColor,
      width: '80%',
      padding: 12,
      borderRadius: 24,
    };

    const backgroundColors = [baseColor, `hsla(${baseHue}, 60%, 20%, 0.6)`];

    return { baseHue, baseColor, lighterColor, buttonStyle, backgroundColors };
  }, [emotionIntensity, isDarkMode]);

  const handleIntensityChange = (value: number) => {
    const clampedValue = Math.min(Math.max(0, value), 50);

    const matchedEmotion =
      emotionsData.find(
        (emotion) => clampedValue >= emotion.range[0] && clampedValue < emotion.range[1]
      ) || emotionsData[2];

    setEmotionIntensity(clampedValue);
    setSelectedEmotion(matchedEmotion.label);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={backgroundColors}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 items-center justify-center pb-24">
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>Emotion</Text>
          <View
            style={{
              width: '100%',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              paddingHorizontal: 20,
            }}>
            <Text
              style={{
                marginBottom: 20,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
              }}>
              Choose how you felt in a previous moment
            </Text>
            {renderEmotionCircle()}
            <Text
              style={{
                marginVertical: 16,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
              }}>
              {selectedEmotion}
            </Text>
            <GradientSlider onValueChange={handleIntensityChange} />
          </View>
          <TouchableOpacity style={buttonStyle} activeOpacity={0.8}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 20,
                fontWeight: 'bold',
                color: 'white',
              }}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default EmotionSelectionScreen;
