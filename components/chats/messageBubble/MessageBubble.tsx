import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { formatTimestamp } from '~/lib/helpers';

const MessageBubble = ({
  content,
  isFromSelf,
  timestamp,
  isRead = false,
}: {
  content: string;
  isFromSelf: boolean;
  timestamp?: number;
  isRead: boolean;
}) => {
  return (
    <View
      className={`max-w-3/4 mb-3 w-fit min-w-32 text-sm md:text-base ${isFromSelf ? 'ml-auto bg-violet-200 text-white' : 'mr-auto bg-[#eeeeee] text-gray-800'} my-1 rounded-2xl px-4 py-2 shadow-sm ${isFromSelf ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
      <Text className="whitespace-pre-wrap break-words">{content}</Text>
      <View className=" flex-row items-center justify-end gap-1">
        <Text className="mt-1 text-right text-xs text-gray-500">
          {formatTimestamp(timestamp ?? 0)}
        </Text>
        {isFromSelf && (
          <Text className="mt-1 text-right text-xs text-gray-500">
            <FontAwesome name={isRead ? 'eye' : 'check'} size={10} color="gray" />
          </Text>
        )}
      </View>
    </View>
  );
};

export default MessageBubble;
