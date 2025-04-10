import FontAwesome from '@expo/vector-icons/FontAwesome';
import AppLayout from 'components/layout/AppLayout';
import { Unsubscribe } from 'firebase/database';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';

import ChatItem from '../chatItem/ChatItem';
import UserListModal from '../modals/UserListModals';

import { auth } from '~/lib/firebase-config';
import { fetchAllUsers, listenToUserChats } from '~/lib/firebase-sevice';
import { ChatData, FormattedUser } from '~/lib/types';

const ChatsList = () => {
  const [userChats, setUserChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState<FormattedUser[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const currentUser = auth.currentUser;
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

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
          setUserChats(chatsFromService);
          setError(null);
        }
        setLoading(false);
      }
    );
    return () => {};
  }, [currentUser]);

  const openUserListModal = async () => {
    if (!currentUser) {
      setModalError('User not authenticated.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    setAllUsers([]);
    setIsModalVisible(true);

    try {
      const fetchedUsers = await fetchAllUsers(currentUser.uid);
      setAllUsers(fetchedUsers);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalError(null);
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
      <View>
        <Text className=" text-xl font-bold ">Welcome {currentUser?.displayName}</Text>
      </View>
      <View className=" flex-row items-center justify-between border-b border-gray-300 pb-3 ">
        <Text className=" text-3xl font-bold "> Chats</Text>
        <TouchableOpacity onPress={openUserListModal} className="flex-row items-center gap-2 p-2">
          <Text className=" text-base text-gray-700 ">Add Chat</Text>
          <FontAwesome name="plus-circle" size={30} color="#6d28d9" />
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
      />
    </AppLayout>
  );
};

export default ChatsList;
