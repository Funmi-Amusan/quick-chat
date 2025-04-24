import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Image } from 'react-native';

import { ImageAssets } from '~/assets';
import { auth } from '~/lib/firebase-config';

const ChatsListHeader = ({
  setIsSearchActive,
  openUserListModal,
}: {
  setIsSearchActive: (value: boolean) => void;
  openUserListModal: () => void;
}) => {
  const { dark } = useTheme();

  const currentUser = auth.currentUser;

  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="flex-row items-center gap-2">
        <Image source={ImageAssets.shaz} className="h-12 w-12 rounded-full" />
        <Text className=" text-xl font-bold text-title-light dark:text-title-dark ">
          Welcome {currentUser?.displayName}
        </Text>
      </View>
      <View className=" flex-row">
        <TouchableOpacity
          onPress={() => setIsSearchActive(true)}
          className="flex-row items-center gap-2 p-2">
          <Ionicons name="search-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={openUserListModal} className="flex-row items-center gap-2 p-2">
          <FontAwesome name="plus-circle" size={30} color={dark ? '#ffffff' : '#333333'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatsListHeader;
