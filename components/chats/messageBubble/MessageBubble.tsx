import { View, Text } from 'react-native';

const MessageBubble = ({
  content,
  isFromSelf,
  timestamp = '1:22pm',
}: {
  content: string;
  isFromSelf: boolean;
  timestamp?: string;
}) => {
  return (
    <View
      className={`max-w-3/4 mb-3 w-fit min-w-32 text-sm md:text-base ${!isFromSelf ? 'ml-auto bg-[#8dc2ff] text-white' : 'mr-auto bg-[#eeeeee] text-gray-800'} my-1 rounded-2xl px-4 py-2 shadow-sm ${!isFromSelf ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
      <Text className="whitespace-pre-wrap break-words">{content}</Text>
      <Text className="mt-1 text-right text-xs text-gray-500">{timestamp}</Text>
    </View>
  );
};

export default MessageBubble;
