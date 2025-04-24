import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { View, Text, Image } from 'react-native';

import { ReplyMessageInfo } from '~/lib/types';

const ReplyPreview = ({
  replyMessage,
  setReplyMessage,
}: {
  replyMessage: ReplyMessageInfo;
  setReplyMessage: (arg0: ReplyMessageInfo | null) => void;
}) => {
  return (
    <View className="h-12 flex-row items-center gap-2 border-l-4 border-mint bg-black/20 dark:bg-white/20 ">
      <View className="flex-grow flex-row items-start gap-2 px-2">
        {replyMessage.imageUrl && <MaterialCommunityIcons name="camera" size={20} color="grey" />}
        <Text className=" line-clamp-1 text-sm text-greyText-light dark:text-greyText-dark">
          {replyMessage.content ? replyMessage.content : replyMessage.imageUrl ? 'Photo' : ''}
        </Text>
      </View>
      <View className=" my-1 flex-row items-center justify-center">
        <Image
          source={{ uri: replyMessage.imageUrl || '' }}
          className="aspect-square h-full rounded-md"
          resizeMode="cover"
        />
        <Ionicons
          name="close-circle-outline"
          size={24}
          color="white"
          className="mx-2"
          onPress={() => setReplyMessage(null)}
        />
      </View>
    </View>
  );
};

export default ReplyPreview;
