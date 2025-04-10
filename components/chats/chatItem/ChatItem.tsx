import { ImageAssets } from 'assets';
import { Link } from 'expo-router';
import React from 'react';
import { View, Text, Image } from 'react-native';

import { formatTimestamp } from '~/lib/helpers';
import { ChatData } from '~/lib/types';

const ChatItem = ({ lastMessage, id, partner }: ChatData) => {
  const lastMessageContent = lastMessage?.content ?? 'Be the first to say hello';
  return (
    <Link href={`/chatroom/${id}`}>
      <View className="flex-row items-center justify-between gap-4 px-4 py-2 text-black">
        <Image source={ImageAssets.avatar} className="h-12 w-12 rounded-full" />
        <View className=" flex-grow gap-1 border-b-[0.5px] border-gray-300 py-2">
          <View className="flex-row items-center justify-between">
            <Text className=" text-lg font-bold">{partner}</Text>
            {lastMessage && <Text>{formatTimestamp(lastMessage?.timestamp)}</Text>}
          </View>
          <View className="flex-row items-center justify-between">
            <Text className=" line-clamp-1 ">{lastMessageContent}</Text>
          </View>
        </View>
      </View>
    </Link>
  );
};

export default ChatItem;
