import { FontAwesome } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

import ChatHeaderSkeleton from './ChatHeaderSkeleton';
import SearchInput from '../../shared/SearchInput';

import { ImageAssets } from '~/assets';
import { formatMomentAgo } from '~/lib/helpers';
import { ChatPartner } from '~/lib/types';

const ChatHeader = ({
  chatPartner,
  setSearchString,
  searchString,
  isLoading,
}: {
  chatPartner: ChatPartner | undefined;
  setSearchString: (arg: string) => void;
  searchString: string;
  isLoading: boolean;
}) => {
  const { dark } = useTheme();

  const [isSearchActive, setIsSearchActive] = useState(false);

  if (isLoading) {
    return <ChatHeaderSkeleton />;
  }

  return (
    <>
      <View className="border-b border-white/30 bg-body-light/20 px-4 py-2 dark:bg-greyBg-dark/20">
        {isSearchActive ? (
          <SearchInput
            setSearchString={setSearchString}
            searchString={searchString}
            closeSearchModal={() => setIsSearchActive(false)}
          />
        ) : (
          <View className="flex-row items-center gap-2">
            <TouchableOpacity testID='back-icon' className="px-2" onPress={() => router.back()}>
              <FontAwesome name="chevron-left" size={14} color={dark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
            <View className=" flex-1 flex-row items-center justify-between ">
              <View>
                <Image source={ImageAssets.avatar} className="mr-3 h-10 w-10 rounded-full" />
                <View>
                  <Text className="text-lg font-semibold text-title-light dark:text-title-dark">
                    {chatPartner?.username}
                  </Text>
                  <View className="mt-0.5 flex-row items-center text-greyText-light dark:text-greyText-dark">
                    {chatPartner?.isActive ? (
                      <>
                        <View className="mr-1 h-2 w-2 rounded-full bg-green-500" />
                        <Text className="text-xs text-gray-600">Active now</Text>
                      </>
                    ) : (
                      <Text className="text-xs text-greyText-light dark:text-greyText-dark">
                        {chatPartner?.lastActive
                          ? `Left Chatroom ${formatMomentAgo(chatPartner.lastActive)}`
                          : 'Offline'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <TouchableOpacity testID='search-icon' onPress={() => setIsSearchActive(true)} className="">
                <Ionicons name="search-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

export default ChatHeader;
