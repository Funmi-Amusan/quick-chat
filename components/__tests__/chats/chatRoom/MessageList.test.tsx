import { fireEvent, render } from '@testing-library/react-native';
import { User } from 'firebase/auth';
import React from 'react';
import { FlatList } from 'react-native';

import MessageList from '~/components/chats/chatroom/MessageList';
import { ProcessedMessage } from '~/lib/types';

const mockCurrentUser: User = {
  uid: 'testUid',
  email: 'test@example.com',
  displayName: 'Test User',
} as User;

const mockProcessedMessages: ProcessedMessage[] = [
  {
    type: 'header',
    id: 'header1',
    date: new Date('2024-01-01').toISOString(),
  },
  {
    type: 'message',
    id: 'message1',
    content: 'Test message',
    timestamp: new Date('2024-01-01').getTime(),
    senderId: 'testUid',
    read: true,
    reaction: '',
    replyMessage: null,
  },
];

const mockFlatListRef = {
  current: {
    scrollToEnd: jest.fn(),
    scrollToIndex: jest.fn(),
    scrollToOffset: jest.fn(),
  },
};

describe('MessageList', () => {
  test('renders date header and message correctly', () => {
    const { getByText } = render(
      <MessageList
        processedMessages={mockProcessedMessages}
        currentUser={mockCurrentUser}
        chatId="testChat"
        handleReply={() => {}}
        loadOlderMessages={() => {}}
        hasMoreMessages={false}
        loadingOlder={false}
        flatListRef={mockFlatListRef as unknown as React.RefObject<FlatList>}
        highlightedIndex={-1}
      />
    );

    expect(getByText('Test message')).toBeTruthy();
  });

//   test('loads older messages when scrolling near top', () => {
//     const mockLoadOlderMessages = jest.fn();
//     const { getByTestId, debug } = render(
//       <MessageList
//         processedMessages={mockProcessedMessages}
//         currentUser={mockCurrentUser}
//         chatId="testChat"
//         handleReply={() => {}}
//         loadOlderMessages={mockLoadOlderMessages}
//         hasMoreMessages
//         loadingOlder
//         flatListRef={mockFlatListRef as unknown as React.RefObject<FlatList>}
//         highlightedIndex={-1}
//       />
//     );

//     const flatList = getByTestId('flat-list');
//     fireEvent.scroll(flatList, {
//       nativeEvent: {
//         contentOffset: { y: 0 },
//         contentSize: { height: 500, width: 100 },
//         layoutMeasurement: { height: 100, width: 100 },
//       },
//     });
//     expect(mockLoadOlderMessages).toHaveBeenCalled();
//   });

  test('renders typing bubble when chat partner is typing', () => {
    const { getByTestId } = render(
      <MessageList
        processedMessages={mockProcessedMessages}
        currentUser={mockCurrentUser}
        chatId="testChat"
        handleReply={() => {}}
        loadOlderMessages={() => {}}
        hasMoreMessages={false}
        loadingOlder={false}
        chatPartner={{
          id: 'partner1',
          username: 'Partner',
          isActive: true,
          isLoggedIn: true,
          lastActive: new Date().getTime(),
          isTyping: { isTyping: true },
        }}
        flatListRef={mockFlatListRef as unknown as React.RefObject<FlatList>}
        highlightedIndex={-1}
      />
    );

    expect(getByTestId('typing-bubble')).toBeTruthy();
  });

  test('highlights correct message when highlightedIndex matches', () => {
    const { getByTestId } = render(
      <MessageList
        processedMessages={mockProcessedMessages}
        currentUser={mockCurrentUser}
        chatId="testChat"
        handleReply={() => {}}
        loadOlderMessages={() => {}}
        hasMoreMessages={false}
        loadingOlder={false}
        flatListRef={mockFlatListRef as unknown as React.RefObject<FlatList>}
        highlightedIndex={1}
      />
    );

    expect(getByTestId('highlighted-message')).toBeTruthy();
  });

//   test('handles scroll to index failure gracefully', () => {
//     const { getByTestId } = render(
//       <MessageList
//         processedMessages={mockProcessedMessages}
//         currentUser={mockCurrentUser}
//         chatId="testChat"
//         handleReply={() => {}}
//         loadOlderMessages={() => {}}
//         hasMoreMessages={false}
//         loadingOlder={false}
//         flatListRef={mockFlatListRef as unknown as React.RefObject<FlatList>}
//         highlightedIndex={-1}
//       />
//     );

//     const flatList = getByTestId('flat-list');
//     fireEvent(flatList, 'scrollToIndexFailed', {
//       index: 5,
//       highestMeasuredFrameIndex: 3,
//       averageItemLength: 100,
//     });

//     expect(mockFlatListRef.current.scrollToIndex).toHaveBeenCalledWith({
//       index: 3,
//       animated: false,
//     });
//   });
});
