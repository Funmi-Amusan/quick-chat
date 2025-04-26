import { ImageAssets } from 'assets';
import { Link } from 'expo-router';
import { View, Text, Image } from 'react-native';

import { formatTimestampToTimeOrDate } from '~/lib/helpers';
import { ChatData } from '~/lib/types';

const ChatItem = ({ lastMessage, id, partner }: ChatData) => {
  const previewMessageContent = lastMessage?.content ?? 'Be the first to say hello';
  return (
    <Link href={`/chatroom/${id}`}>
      <View className="flex-row items-center justify-between gap-4 border border-b-white/20 bg-slate-100 p-2 text-black dark:bg-body-dark ">
        <Image source={ImageAssets.colleen} className="h-14 w-14 rounded-full" />
        <View className=" flex-grow gap-1 py-2">
          <View className="flex-row items-center justify-between ">
            <Text className="  text-xl font-bold  capitalize text-title-light dark:text-title-dark">
              {partner}
            </Text>
            <Text className=" h-5 w-5 items-center rounded-full bg-mint text-center text-sm text-title-dark dark:text-title-light ">
              5
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className=" line-clamp-1 font-medium text-grey ">{previewMessageContent}</Text>
            {lastMessage && (
              <Text className=" line-clamp-1 text-grey ">
                {formatTimestampToTimeOrDate(lastMessage?.timestamp)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Link>
  );
};

export default ChatItem;
