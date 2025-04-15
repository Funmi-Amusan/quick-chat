import { View } from 'react-native';

const ChatHeaderSkeleton = () => {
  return (
    <View className="flex-row items-center">
      <View className="mr-3 h-10 w-10 rounded-full bg-gray-200" />
      <View>
        <View className="h-5 w-32 rounded bg-gray-200" />
        <View className="mt-0.5 h-3 w-20 rounded bg-gray-200" />
      </View>
    </View>
  );
};
export default ChatHeaderSkeleton;