import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import AppLayout from 'components/layout/AppLayout';
import { Unsubscribe } from 'firebase/database';
import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';

import ChatItem from '../chatItem/ChatItem';
import UserListModal from '../modals/UserListModals';

import { ImageAssets } from '~/assets';
import SearchInput from '~/components/modals/searchInput';
import { auth } from '~/lib/firebase-config';
import { fetchAllUsers, listenToUserChats } from '~/lib/firebase-sevice';
import { ChatData } from '~/lib/types';

const ChatsList = () => {
  const [allUserChats, setAllUserChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchString, setSearchString] = useState('');
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
          setAllUserChats([]);
        } else {
          setAllUserChats(chatsFromService);
          setError(null);
        }
        setLoading(false);
      }
    );
    return () => {};
  }, [currentUser]);

  const filteredAndSortedUserChats = useMemo(() => {
    let filtered = allUserChats;
    if (searchString) {
      const lowerCaseSearch = searchString.toLowerCase();
      filtered = allUserChats.filter((chat) =>
        chat.partner?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.lastMessage?.timestamp || 0);
      const dateB = new Date(b.lastMessage?.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [allUserChats, searchString]);

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
      {isSearchActive ? (
        <SearchInput
          setSearchString={setSearchString}
          searchString={searchString}
          closeSearchModal={() => setIsSearchActive(false)}
        />
      ) : (
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
            <TouchableOpacity
              onPress={openUserListModal}
              className="flex-row items-center gap-2 p-2">
              <FontAwesome name="plus-circle" size={30} color={dark ? '#ffffff' : '#333333'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View className=" flex-row items-center justify-between gap-4 py-3 ">
        <Text className=" text-3xl font-bold text-title-light dark:text-title-dark  "> Chats</Text>
      </View>

      {filteredAndSortedUserChats.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text>No chats yet. Tap 'Add Chat' to start!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedUserChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatItem {...item} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <UserListModal
        isVisible={isModalVisible}
        onClose={closeModal}
        allUsers={allUsers}
        userChats={allUserChats}
        loading={modalLoading}
        error={modalError}
        currentUser={currentUser}
        refreshAllUsers={refetchAllUsers}
      />
    </AppLayout>
  );
};

export default ChatsList;
