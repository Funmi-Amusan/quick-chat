import { ImageAssets } from 'assets';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

import { ChatData } from '~/lib/types';

const ChatItem = ({ createdAt, id, participants }: ChatData) => {
  return (
    <TouchableOpacity
      onPress={() => {
        router.push(`/chats/${id}`);
      }}>
      <View className="flex-row items-center justify-between gap-4 px-4 py-2 text-black">
        <Image source={ImageAssets.avatar} className="h-12 w-12 rounded-full" />
        <View className=" flex-grow gap-2 border-t-[0.5px] border-gray-300 py-2">
          <View className="flex-row items-center justify-between">
            <Text className=" text-lg font-bold">{id}</Text>
            <Text>{createdAt}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text />
            <Text className=" aspect-square h-6 items-center justify-center rounded-full bg-blue-600 text-center align-middle">
              1
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ChatItem;
