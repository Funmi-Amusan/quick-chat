import { useTheme } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ViewStyle,
  Image,
  ImageBackground,
  Platform,
} from 'react-native';

import { ImageAssets } from '~/assets';

type AppLayoutProp = {
  children: React.ReactNode;
  style?: ViewStyle;
};
const AppLayout: React.FC<AppLayoutProp> = ({ children, style, ...rest }) => {
  const { dark } = useTheme();
  const backgroundImage = dark ? ImageAssets.darkBackGround : ImageAssets.backGround;

  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  useEffect(() => {
    setBackgroundLoaded(false);

    if (Platform.OS !== 'web') {
      const imageSource = Image.resolveAssetSource(backgroundImage);
      if (imageSource && imageSource.uri) {
        Image.prefetch(imageSource.uri)
          .then(() => setBackgroundLoaded(true))
          .catch((err) => console.error('Failed to preload background image:', err));
      } else {
        setBackgroundLoaded(true);
      }
    } else {
      setBackgroundLoaded(true);
    }
  }, [dark, backgroundImage]);

  return (
    <SafeAreaView
      style={[styles.container, style]}
      {...rest}
      className=" bg-body-light dark:bg-body-dark ">
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight,
    flex: 1,
    paddingHorizontal: 16,
  },
  view: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default AppLayout;
