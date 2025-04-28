import { renderHook } from '@testing-library/react-native';

import useMarkMessagesAsRead from '../useMarkMessagesAsRead';

import * as Database from '~/lib/firebase-sevice';

describe('useMarkMessagesAsRead', () => {
  let mockMarkMessagesAsRead: jest.SpyInstance;

  beforeEach(() => {
    mockMarkMessagesAsRead = jest.spyOn(Database, 'markMessagesAsRead');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not call markMessagesAsRead when currentUser is null', () => {
    const messages = [{ id: '1', text: 'test' }];
    const { unmount } = renderHook(() => useMarkMessagesAsRead(null, 'chat-123', messages));

    expect(mockMarkMessagesAsRead).not.toHaveBeenCalled();

    unmount();
  });

  it('should not call markMessagesAsRead when chatId is empty', () => {
    const mockUser = { uid: 'user-123' };
    const messages = [{ id: '1', text: 'test' }];
    const { unmount } = renderHook(() => useMarkMessagesAsRead(mockUser, '', messages));

    expect(mockMarkMessagesAsRead).not.toHaveBeenCalled();

    unmount();
  });

  it('should not call markMessagesAsRead when messages array is empty', () => {
    const mockUser = { uid: 'user-123' };
    const { unmount } = renderHook(() => useMarkMessagesAsRead(mockUser, 'chat-123', []));

    expect(mockMarkMessagesAsRead).not.toHaveBeenCalled();

    unmount();
  });

  it('should call markMessagesAsRead with correct parameters when all inputs are valid', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';
    const messages = [
      { id: '1', text: 'test1' },
      { id: '2', text: 'test2' },
    ];

    const { unmount } = renderHook(() => useMarkMessagesAsRead(mockUser, chatId, messages));

    expect(mockMarkMessagesAsRead).toHaveBeenCalledWith(chatId, mockUser.uid, messages);

    unmount();
  });

  it('should re-run effect when messages array changes', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';
    const initialMessages = [{ id: '1', text: 'test1' }];
    const updatedMessages = [...initialMessages, { id: '2', text: 'test2' }];

    const { rerender } = renderHook(
      ({ messages }) => useMarkMessagesAsRead(mockUser, chatId, messages),
      {
        initialProps: { messages: initialMessages },
      }
    );

    expect(mockMarkMessagesAsRead).toHaveBeenCalledWith(chatId, mockUser.uid, initialMessages);

    rerender({ messages: updatedMessages });

    expect(mockMarkMessagesAsRead).toHaveBeenCalledWith(chatId, mockUser.uid, updatedMessages);
  });
});
