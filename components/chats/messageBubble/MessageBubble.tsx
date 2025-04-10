import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { reactToMessage } from '~/lib/firebase-sevice';
import { formatTimestamp } from '~/lib/helpers';

const MessageBubble = ({
  content,
  isFromSelf,
  timestamp,
  isRead = false,
  id,
  chatId,
  reaction,
  item,
}: {
  content: string;
  isFromSelf: boolean;
  timestamp?: number;
  isRead: boolean;
  id: any;
  chatId: string;
  reaction: string;
  item: any;
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  console.log('item', item);

  const handleLongPress = () => {
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    reactToMessage(id, emoji, chatId);
    setShowEmojiPicker(false);
  };

  const renderEmojiPicker = () => (
    <View className="absolute left-0 right-0 top-12 w-2/3 flex-row justify-around rounded-full bg-white p-4 shadow-sm">
      {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
        <TouchableOpacity key={emoji} onPress={() => handleEmojiSelect(emoji)}>
          <Text className="text-xl">{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  console.log('showEmojiPicker', showEmojiPicker);

  return (
    <TouchableOpacity onLongPress={handleLongPress}>
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

        {/* Display reactions */}
        {reaction && (
          <View className=" absolute -bottom-3 left-0 rounded-lg bg-white/80 p-0.5 ">
            <Text className="mr-1 text-lg"> {reaction}</Text>
          </View>
        )}
      </View>

      {/* Render emoji picker conditionally */}
      {showEmojiPicker && renderEmojiPicker()}
    </TouchableOpacity>
  );
};

export default MessageBubble;
