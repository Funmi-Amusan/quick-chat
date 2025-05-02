import { User } from 'firebase/auth';
import { useCallback, useRef } from 'react';
import { FlatList, View } from 'react-native';

import ActiveTypingBubble from './ActiveTypingBubble';
import MessageBubble from './messageBubble/MessageBubble';

import { DateHeader } from '~/components/ui';
import { ActualMessage, ChatPartner, ProcessedMessage, ReplyMessageInfo } from '~/lib/types';

const MessageList = ({
  processedMessages,
  currentUser,
  chatId,
  handleReply,
  loadOlderMessages,
  hasMoreMessages,
  loadingOlder,
  chatPartner,
  flatListRef,
  highlightedIndex,
}: {
  processedMessages: ProcessedMessage[];
  currentUser: User | null;
  chatId: string;
  handleReply: (arg0: ReplyMessageInfo) => void;
  loadOlderMessages: () => void;
  hasMoreMessages: boolean;
  loadingOlder: boolean;
  chatPartner?: ChatPartner;
  flatListRef: React.RefObject<FlatList>;
  highlightedIndex: number;
}) => {
  const swipeableRowRef = useRef<FlatList>(null);

  const renderItem = ({ item, index }: { item: ProcessedMessage; index: number }) => {
    if (item.type === 'header') {
      return <DateHeader date={item.date} />;
    }

    if (item.type === 'message') {
      const isHighlighted = index === highlightedIndex;
      return (
        <View className="my-1">
          <MessageBubble
            onReply={handleReply}
            chatId={chatId}
            {...(item as ActualMessage)}
            isHighlighted={isHighlighted}
            updateRef={swipeableRowRef}
            currentUser={currentUser}
          />
        </View>
      );
    }
    return null;
  };
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      console.warn('Scroll to index failed:', info);
      const { index, highestMeasuredFrameIndex, averageItemLength } = info;

      if (highestMeasuredFrameIndex !== -1) {
        flatListRef.current?.scrollToIndex({
          index: highestMeasuredFrameIndex,
          animated: false,
        });
      } else {
        const offset = index * averageItemLength;
        flatListRef.current?.scrollToOffset({
          offset,
          animated: false,
        });
      }
    },
    [flatListRef]
  );

  const keyExtractor = useCallback((item: ProcessedMessage) => item.id, []);

  return (
    <FlatList
      testID="flat-list"
      ref={flatListRef}
      className="bg-body-light dark:bg-body-dark "
      contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 8 }}
      data={processedMessages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListFooterComponent={chatPartner?.isTyping.isTyping ? <ActiveTypingBubble /> : null}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      onStartReached={() => {
        if (hasMoreMessages) {
          loadOlderMessages();
        }
      }}
      onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      onStartReachedThreshold={0.2}
      inverted
    />
  );
};

export default MessageList;
