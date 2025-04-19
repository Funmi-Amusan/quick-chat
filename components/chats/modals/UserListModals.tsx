import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';
import { User } from 'firebase/auth';
import {
  View,
  Text,
  Modal,
  FlatList,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';

import { ImageAssets } from '~/assets';
import { createChat } from '~/lib/firebase-sevice';
import { FormattedUser, ChatData } from '~/lib/types';

interface UserListModalProps {
  isVisible: boolean;
  onClose: () => void;
  allUsers: FormattedUser[];
  userChats: ChatData[];
  loading: boolean;
  error: Error | null;
  currentUser: User | null;
  refreshAllUsers: () => void;

}

const UserListModal = ({
  isVisible,
  onClose,
  allUsers,
  userChats,
  loading,
  error,
  currentUser,
  refreshAllUsers,
}: UserListModalProps) => {
  const chatsToList = allUsers.filter(
    (user) => user.id !== 'undefined' && !userChats.some((chat) => chat.id.includes(user.id))
  );

  const createChatWithUser = async (otherUser: FormattedUser) => {
    if (!currentUser) {
      console.error('Create chat failed: User not authenticated.');
      onClose();
      return;
    }
    try {
      const chatId = await createChat(
        currentUser.uid,
        currentUser.displayName || 'Anonymous',
        otherUser.id,
        otherUser.username
      );
      router.push(`/chatroom/${chatId}`);
      onClose();
      return chatId;
    } catch (error: any) {
      console.error('Error creating chat via service:', error);
    }
  };

  return (
    <Modal animationType="slide" transparent={false} visible={isVisible} onRequestClose={onClose}>
      <View className=" mt-12 flex-1 ">
        <View className=" flex-row items-center justify-between border-b border-gray-300 p-4">
          <Text className=" text-xl font-bold ">Start New Chat</Text>
          <Pressable onPress={onClose}>
          <AntDesign name="closecircle" size={24} color="black" />
          </Pressable>
        </View>
        {loading && (
          <View className=" flex-1 items-center justify-center p-5 ">
            <ActivityIndicator size="large" />
            <Text>Loading users...</Text>
          </View>
        )}
        {error && (
          <View className=" flex-1 items-center justify-center p-5 ">
            <Text className=" mb-2 text-center text-red-500 ">Error: {error.message}</Text>
          </View>
        )}
        {!loading && !error && (
          <FlatList
          onRefresh={refreshAllUsers}
            refreshing={loading}
            data={chatsToList}
            keyExtractor={(item: FormattedUser) => item.id}
            renderItem={({ item }: { item: FormattedUser }) => (
              <TouchableOpacity
                className=" border-b border-gray-300 px-4 py-2 "
                onPress={() => createChatWithUser(item)}>
                <View className=" flex-row items-center gap-2 ">
                  <Image source={ImageAssets.avatar} className=" h-8 w-8 " />
                  <Text className=" text-xl font-medium">{item.username}</Text>
                </View>
                {/* Add more user details later */}
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View className=" flex-1 items-center justify-center p-5 ">
                <Text className=" text-xl font-medium">No other users found.</Text>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

export default UserListModal;
