import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

const CustomRefreshControl = ({ refreshing, onRefresh, children }) => {
  const { dark } = useTheme();
  const [refreshHeight, setRefreshHeight] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [refreshing, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y <= -60 && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
    }
    if (y < 0 && !refreshing) {
      setRefreshHeight(Math.abs(y));
    }
  };

  const handleScrollEnd = () => {
    if (!refreshing) {
      setRefreshHeight(0);
    }
    setIsRefreshing(false);
  };

  const ghostOpacity = refreshHeight / 60;

  return (
    <View className="relative flex-1">
      <Animated.View
        className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center bg-primary"
        style={[
          {
            height: refreshing ? 60 : refreshHeight,
            opacity: refreshing ? 1 : ghostOpacity,
          },
        ]}>
        <Animated.View style={{ transform: [{ rotate: refreshing ? spin : '0deg' }] }}>
          <View className="items-center justify-center">
            <Ionicons name="refresh" size={24} color={dark ? '#ffffff' : '#333333'} />
            <Text className="mt-2 text-xl text-black">
              {refreshing ? 'Updating...' : 'Pull to refresh'}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {React.cloneElement(children, {
        onScroll: handleScroll,
        onScrollEndDrag: handleScrollEnd,
        scrollEventThrottle: 16,
        contentContainerStyle: {
          paddingTop: refreshing ? 60 : 0,
        },
        refreshing: false,
      })}
    </View>
  );
};

export default CustomRefreshControl;

