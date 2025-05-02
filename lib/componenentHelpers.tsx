import { Feather } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import { LastMessageData } from './types';

export const generatePreviewMessageContent = (
  lastMessage: LastMessageData | undefined
): React.ReactNode | string => {
  if (!lastMessage) {
    return 'Be the first to send a message';
  }

  if (lastMessage?.messageType === 'text') {
    return lastMessage.content;
  } else if (lastMessage?.messageType === 'image') {
    return (
      <View className="flex-row items-center gap-2">
        <Feather name="camera" size={16} color="grey" />
        {lastMessage?.content && lastMessage?.content.length > 1 ? (
          <Text className="font-medium text-grey">{lastMessage?.content}</Text>
        ) : (
          <Text className="font-medium text-grey">Image</Text>
        )}
      </View>
    );
  } else if (lastMessage?.messageType === 'file') {
    return (
      <View className="flex-row items-center gap-2">
        <Feather name="file" size={16} color="grey" />
        {lastMessage?.content && lastMessage?.content.length > 1 ? (
          <Text className="font-medium text-grey">{lastMessage?.content}</Text>
        ) : (
          <Text className="font-medium text-grey">File</Text>
        )}
      </View>
    );
  } else {
    return '';
  }
};
