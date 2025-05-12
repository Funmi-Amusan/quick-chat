import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { View } from 'react-native';

type SliderPropsType = {
  minimumValue?: number;
  maximumValue?: number;
  onValueChange: (value: number) => void;
  step?: number;
};

const GradientSlider = ({
  minimumValue = 0,
  maximumValue = 50,
  onValueChange,
  step = 1,
}: SliderPropsType) => {
  const [value, setValue] = useState(minimumValue);

  const handleValueChange = (newValue: number) => {
    setValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <View className="w-full px-4">
      <Slider
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor="white"
        maximumTrackTintColor="white"
        thumbTintColor="white"
      />
    </View>
  );
};

export default GradientSlider;
