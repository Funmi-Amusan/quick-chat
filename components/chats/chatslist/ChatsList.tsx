import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import AppLayout from 'components/layout/AppLayout';
import { Unsubscribe } from 'firebase/database';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';

import ChatItem from '../chatItem/ChatItem';
import UserListModal from '../modals/UserListModals';

import { ImageAssets } from '~/assets';
import { auth } from '~/lib/firebase-config';
import { fetchAllUsers, listenToUserChats } from '~/lib/firebase-sevice';
import { ChatData } from '~/lib/types';

const ChatsList = () => {
  const [userChats, setUserChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { dark } = useTheme();

  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const {
    data: allUsers = [],
    isLoading: modalLoading,
    error: modalError,
    refetch: refetchAllUsers,
  } = useQuery({
    queryKey: ['allUsers', currentUserId],
    queryFn: () => {
      if (!currentUserId) {
        throw new Error('User not authenticated for fetching users.');
      }
      return fetchAllUsers(currentUserId);
    },
    enabled: isModalVisible && !!currentUserId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!currentUser) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    unsubscribeRef.current = listenToUserChats(
      currentUser.uid,
      (chatsFromService, serviceError) => {
        if (serviceError) {
          console.error('Error from chat listener service:', serviceError);
          setError(serviceError.message || 'Failed to load chats.');
          setUserChats([]);
        } else {
          const sortedChats = chatsFromService.sort((a, b) => {
            const dateA = new Date(a.lastMessage?.timestamp || 0);
            const dateB = new Date(b.lastMessage?.timestamp || 0);
            return dateB.getTime() - dateA.getTime();
          });
          setUserChats(sortedChats);
          setError(null);
        }
        setLoading(false);
      }
    );
    return () => {};
  }, [currentUser]);

  const openUserListModal = async () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" />
          <Text>Loading chats...</Text>
        </View>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center p-4">
          <Text className=" mb-2 text-center text-red-500 ">Error: {error}</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <View className="flex-row items-center gap-2">
        <Image source={ImageAssets.shaz} className="h-12 w-12 rounded-full" />
        <Text className=" text-title-light dark:text-title-dark text-xl font-bold ">
          Welcome {currentUser?.displayName}
        </Text>
      </View>
      <View className=" flex-row items-center justify-between pb-3 ">
        <Text className=" text-title-light dark:text-title-dark text-3xl font-bold  "> Chats</Text>
        <TouchableOpacity onPress={openUserListModal} className="flex-row items-center gap-2 p-2">
          <FontAwesome name="plus-circle" size={30} color={dark ? '#ffffff' : '#333333'} />
        </TouchableOpacity>
      </View>

      {userChats.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text>No chats yet. Tap 'Add Chat' to start!</Text>
        </View>
      ) : (
        <FlatList
          data={userChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatItem {...item} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <UserListModal
        isVisible={isModalVisible}
        onClose={closeModal}
        allUsers={allUsers}
        userChats={userChats}
        loading={modalLoading}
        error={modalError}
        currentUser={currentUser}
        refreshAllUsers={refetchAllUsers}
      />
    </AppLayout>
  );
};

export default ChatsList;
