import { router } from 'expo-router';
import {
  View,
  Text,
  Modal,
  FlatList,
  ActivityIndicator,
  Button,
  TouchableOpacity,
} from 'react-native';

import { createChat } from '~/lib/firebase-sevice';
import { FormattedUser, ChatData } from '~/lib/types';

interface UserListModalProps {
  isVisible: boolean;
  onClose: () => void;
  allUsers: FormattedUser[];
  userChats: ChatData[];
  loading: boolean;
  error: string | null;
  currentUserId: string;
}

const UserListModal = ({
  isVisible,
  onClose,
  allUsers,
  userChats,
  loading,
  error,
  currentUserId,
}: UserListModalProps) => {
  const createChatWithUser = async (otherUser: FormattedUser) => {
    if (!currentUserId) {
      console.error('Create chat failed: User not authenticated.');
      onClose();
      return;
    }

    const existingChat = userChats.find(
      (chat) =>
        chat.participants && chat.participants[otherUser.id] && chat.participants[currentUserId]
    );

    if (existingChat) {
      console.log(`Chat with ${otherUser.username || otherUser.id} already exists.`);
      onClose();
      router.push(`/chats/${existingChat.id}`);
      return existingChat.id;
    }

    console.log(`Attempting to create chat with: ${otherUser.username || otherUser.id}`);

    try {
      const chatId = await createChat(currentUserId, otherUser.id);
      console.log('Chat creation initiated via service, new chat ID:', chatId);
      router.push(`/chats/${chatId}`);
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
          <Button title="Close" onPress={onClose} />
        </View>

        {loading && (
          <View className=" flex-1 items-center justify-center p-5 ">
            <ActivityIndicator size="large" />
            <Text>Loading users...</Text>
          </View>
        )}

        {error && (
          <View className=" flex-1 items-center justify-center p-5 ">
            <Text className=" mb-2 text-center text-red-500 ">Error: {error}</Text>
          </View>
        )}

        {!loading && !error && (
          <FlatList
            data={allUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className=" border-b border-gray-300 px-4 py-2 "
                onPress={() => createChatWithUser(item)}>
                <Text className=" text-lg ">{item.username}</Text>
                {/* Add more user details later */}
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View className=" flex-1 items-center justify-center p-5 ">
                <Text>No other users found.</Text>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

export default UserListModal;
