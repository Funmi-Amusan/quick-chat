import { useMutation } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-native';

import useSendMessage from '../useSendMessage';

import * as Database from '~/lib/firebase-sevice';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));

describe('useSendMessage', () => {
  const mockSetImageUri = jest.fn();
  const mockMutate = jest.fn();
  const mockUser = { uid: 'test-user' };
  const mockChatId = 'test-chat';

  beforeEach(() => {
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });
    jest.spyOn(Database, 'resetTypingStatus').mockImplementation();
    jest.spyOn(Database, 'sendMessage').mockImplementation();
    jest.spyOn(Database, 'sendImageMessage').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useSendMessage(mockChatId, mockUser, mockSetImageUri, null)
    );

    expect(result.current.inputText).toBe('');
    expect(result.current.replyMessage).toBeNull();
    expect(result.current.isSendingMessage).toBeFalsy();
    expect(result.current.sendMessageError).toBeNull();
  });

  it('should update input text', () => {
    const { result } = renderHook(() =>
      useSendMessage(mockChatId, mockUser, mockSetImageUri, null)
    );

    act(() => {
      result.current.setInputText('Hello');
    });

    expect(result.current.inputText).toBe('Hello');
  });

  it('should not send message when input is empty and no image', async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockChatId, mockUser, mockSetImageUri, null)
    );

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should send message with image even if text is empty', async () => {
    const imageUri = 'test-image-uri';
    const { result } = renderHook(() =>
      useSendMessage(mockChatId, mockUser, mockSetImageUri, imageUri)
    );

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(mockMutate).toHaveBeenCalledWith({
      text: '',
      imageUriToSend: imageUri,
    });
  });

  it('should handle reply message', () => {
    const { result } = renderHook(() =>
      useSendMessage(mockChatId, mockUser, mockSetImageUri, null)
    );

    const replyInfo = { messageId: '123', text: 'Original message' };

    act(() => {
      result.current.setReplyMessage(replyInfo);
    });

    expect(result.current.replyMessage).toEqual(replyInfo);
  });

  it('should clear typing timeout on send message', async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockChatId, mockUser, mockSetImageUri, null)
    );

    act(() => {
      result.current.setInputText('Hello');
      result.current.typingTimeoutRef.current = setTimeout(() => {}, 1000);
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(result.current.typingTimeoutRef.current).toBeNull();
    expect(Database.resetTypingStatus).toHaveBeenCalledWith(mockUser.uid, mockChatId);
  });

  it('should not attempt to send message when user or chatId is null', async () => {
    const { result } = renderHook(() => useSendMessage(null, null, mockSetImageUri, null));

    act(() => {
      result.current.setInputText('Hello');
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
