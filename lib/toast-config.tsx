import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

interface CustomToastProps extends BaseToastProps {
  text1?: string;
  text2?: string;
}

const BaseToast = ({ text1, text2, color }: { text1?: string; text2?: string; color: string }) => {

  return (
    <View style={[styles.container]} className=' backdrop-blur-3xl ' >
      <LinearGradient
        colors={[color ? color : '#FFC7C4', 'white']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}>
        <View>
          {text1 && <Text className={` text-base font-semibold`}>{text1}</Text>}
          {text2 && <Text className="text-sm text-gray-500">{text2}</Text>}
        </View>
      </LinearGradient>
    </View>
  );
};

const toastConfig = {
  error: ({ text1, text2 }: CustomToastProps) => (
    <BaseToast text1={text1} text2={text2} color="#FDE2E1" />
  ),
  success: ({ text1, text2 }: CustomToastProps) => (
    <BaseToast text1={text1} text2={text2} color="#E6F6E9" />
  ),
  delete: ({ text1, text2 }: CustomToastProps) => (
    <BaseToast text1={text1} text2={text2} color="#FDF5E6" />
  ),
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 5,
    left: '5%',
    right: '5%',
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
});

export default toastConfig;
