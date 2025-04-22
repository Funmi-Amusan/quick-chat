import Constants from 'expo-constants';
import { StyleSheet, SafeAreaView, ViewStyle } from 'react-native';

type ChatRoomLayoutProp = {
  children: React.ReactNode;
  style?: ViewStyle;
};
const ChatRoomLayout: React.FC<ChatRoomLayoutProp> = ({ children, style, ...rest }) => {
  return (
    <SafeAreaView
      style={[styles.container, style]}
      {...rest}
      className=" bg-body-light dark:bg-body-dark">
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight,
    flex: 1,
  },
  view: {
    flex: 1,
  },
});

export default ChatRoomLayout;
