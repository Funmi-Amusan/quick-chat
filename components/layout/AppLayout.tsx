import Constants from 'expo-constants';
import { StyleSheet, SafeAreaView, ViewStyle } from 'react-native';

type AppLayoutProp = {
  children: React.ReactNode;
  style?: ViewStyle;
};
const AppLayout: React.FC<AppLayoutProp> = ({ children, style, ...rest }) => {
  return (
    <SafeAreaView style={[styles.container, style]} {...rest}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight,
    flex: 1,
    backgroundColor: '#fff',
  },
  view: {
    flex: 1,
  },
});

export default AppLayout;
