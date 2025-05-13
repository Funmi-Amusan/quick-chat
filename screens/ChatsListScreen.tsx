import AppLayout from 'components/layout/AppLayout';
import { useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';

import ChatItem from '../components/chats/chatslist/chatsItem/ChatItem';
import UserListModal from '../components/chats/modals/UserListModals';

import CustomRefreshControl from '~/components/chats/chatslist/RefreshControl';
import ChatsListHeader from '~/components/chats/chatslist/chatsListHeader/chatsListHeader';
import SearchInput from '~/components/chats/shared/SearchInput';
import { useChatContext } from '~/context/ChatContext';
import { useAllUsers } from '~/lib/queries/useAllUsers';
import { useCurrentUser } from '~/lib/queries/useCurrentUser';

const ChatsList = () => {
  const {
    userChats: allUserChats,
    loading: userChatsLoading,
    error: userChatError,
  } = useChatContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchString, setSearchString] = useState('');

  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();
  //? full screen loader is userLoading
  //? navigate to sign in page is userError
  const currentUserId = currentUser?.uid;

  const {
    data: allUsers = [],
    isLoading: modalLoading,
    error: modalError,
    refetch: refetchAllUsers,
  } = useAllUsers(currentUserId, { enabled: isModalVisible });

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
        <ChatsListHeader
          setIsSearchActive={(e) => setIsSearchActive(e)}
          openUserListModal={openUserListModal}
        />
      )}

      {filteredAndSortedUserChats.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text>No chats yet. Tap 'Add Chat' to start!</Text>
        </View>
      ) : (
        <View className="flex-1 bg-primary">
          <CustomRefreshControl refreshing={loading} onRefresh={() => console.log('first')}>
            <FlatList
              data={filteredAndSortedUserChats}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChatItem {...item} />}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={() => (
                <View className="flex-row items-center justify-between gap-4 bg-body-light py-3 dark:bg-body-dark">
                  <Text className="text-3xl font-bold text-title-light dark:text-title-dark">
                    Chats
                  </Text>
                </View>
              )}
              className="flex-grow bg-body-light dark:bg-body-dark"
            />
          </CustomRefreshControl>
        </View>
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
