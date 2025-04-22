import Constants from 'expo-constants';
import { StyleSheet, SafeAreaView, ViewStyle } from 'react-native';

type AppLayoutProp = {
  children: React.ReactNode;
  style?: ViewStyle;
};
const AppLayout: React.FC<AppLayoutProp> = ({ children, style, ...rest }) => {
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
});

export default AppLayout;
