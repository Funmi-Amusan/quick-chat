import { View, Text, Image } from 'react-native';

import ChatHeaderSkeleton from './ChatHeaderSkeleton';

import { ImageAssets } from '~/assets';
import { formatMomentAgo } from '~/lib/helpers';
import { ChatPartner } from '~/lib/types';

const ChatHeader = ({
  chatPartner,
  isLoading,
}: {
  chatPartner: ChatPartner | undefined;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <ChatHeaderSkeleton />;
  }

  return (
    <>
      <Image source={ImageAssets.avatar} className="mr-3 h-10 w-10 rounded-full" />
      <View>
        <Text className="text-title-light dark:text-title-dark text-lg font-semibold">
          {chatPartner?.username}
        </Text>
        <View className="text-greyText-light dark:text-greyText-dark mt-0.5 flex-row items-center">
          {chatPartner?.isActive ? (
            <>
              <View className="mr-1 h-2 w-2 rounded-full bg-green-500" />
              <Text className="text-xs text-gray-600">Active now</Text>
            </>
          ) : (
            <Text className="text-greyText-light dark:text-greyText-dark text-xs">
              {chatPartner?.lastActive
                ? `Left Chatroom ${formatMomentAgo(chatPartner.lastActive)}`
                : 'Offline'}
            </Text>
          )}
        </View>
      </View>
    </>
  );
};

export default ChatHeader;
