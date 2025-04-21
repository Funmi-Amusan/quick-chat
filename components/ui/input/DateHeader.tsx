import { View, Text } from 'react-native';

const DateHeader = ({ date }: { date: string }) => {
  return (
    <View className="mb-2 flex-row items-center justify-center">
      <View className="flex-row items-center justify-center rounded-full bg-white px-2 py-1 shadow-md">
        <Text>{date}</Text>
      </View>
    </View>
  );
};

export default DateHeader;
