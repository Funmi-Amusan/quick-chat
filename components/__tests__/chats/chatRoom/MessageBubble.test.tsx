import { fireEvent, render } from '@testing-library/react-native';
import { User } from 'firebase/auth';

import MessageBubble from '~/components/chats/chatRoom/messageBubble/MessageBubble';

describe('MessageBubble', () => {
  const mockMessage = {
    content: 'Test message',
    timestamp: Date.now(),
    read: false,
    id: 'test-id',
    chatId: 'test-chat',
    reaction: null,
    senderId: 'testUid',
    imageUrl: null,
    isHighlighted: false,
  };

  const mockCurrentUser = {
    uid: 'testUid',
    email: 'test@example.com',
  } as User;

  // test('handles emoji reaction selection', () => {
  //   const { getByText } = render(
  //     <MessageBubble
  //       {...mockMessage}
  //       currentUser={mockCurrentUser}
  //       updateRef={{ current: null }}
  //       onReply={() => {}}
  //     />
  //   );

  //   fireEvent.press(getByText('Test message'));
  //   const emojiButton = getByText('👍');
  //   fireEvent.press(emojiButton);
  // });

  test('displays image preview when image URL is provided', () => {
    const messageWithImage = {
      ...mockMessage,
      imageUrl: 'https://unsplash.com/photos/a-knife-cuts-a-cake-decorated-with-cherries-pNQNBzMe1DI',
    };

    const { getByTestId } = render(
      <MessageBubble
        {...messageWithImage}
        currentUser={mockCurrentUser}
        updateRef={{ current: null }}
        onReply={() => {}}
      />
    );

    const image = getByTestId('img');
    expect(image).toBeTruthy();
  });

  test('displays reply message content when provided', () => {
    const messageWithReply = {
      ...mockMessage,
      replyMessage: {
        id: 'reply-id',
        content: 'Reply content',
        senderId: 'sender-id',
        imageUrl: null,
      },
    };

    const { getByText } = render(
      <MessageBubble
        {...messageWithReply}
        currentUser={mockCurrentUser}
        updateRef={{ current: null }}
        onReply={() => {}}
      />
    );

    expect(getByText('Reply content')).toBeTruthy();
  });

  test('displays read status correctly for self messages', () => {
    const readMessage = {
      ...mockMessage,
      read: true,
    };

    const { getByTestId } = render(
      <MessageBubble
        {...readMessage}
        currentUser={mockCurrentUser}
        updateRef={{ current: null }}
        onReply={() => {}}
      />
    );

    const eyeIcon = getByTestId('readIcon');
    expect(eyeIcon).toBeTruthy();
  });

  test('handles swipe to reply gesture', () => {
    const mockOnReply = jest.fn();
    const { getByTestId } = render(
      <MessageBubble
        {...mockMessage}
        currentUser={mockCurrentUser}
        updateRef={{ current: null }}
        onReply={mockOnReply}
      />
    );

    const swipeableContainer = getByTestId('swipeable-container');
    fireEvent(swipeableContainer, 'swipeableOpen');
    expect(mockOnReply).toHaveBeenCalledWith({
      id: 'test-id',
      content: 'Test message',
      senderId: 'testUid',
      imageUrl: null,
    });
  });

  test('displays reaction bubble when reaction is present', () => {
    const messageWithReaction = {
      ...mockMessage,
      reaction: '❤️',
    };

    const { getByText } = render(
      <MessageBubble
        {...messageWithReaction}
        currentUser={mockCurrentUser}
        updateRef={{ current: null }}
        onReply={() => {}}
      />
    );

    expect(getByText('❤️')).toBeTruthy();
  });
});
