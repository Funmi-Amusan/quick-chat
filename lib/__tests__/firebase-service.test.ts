import { renderHook } from '@testing-library/react-native';
import {
  ref,
  get,
  push,
  update,
  set,
  serverTimestamp,
  onDisconnect,
  limitToLast,
  query,
  orderByChild,
} from 'firebase/database';
import { getStorage, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { auth } from '../firebase-config';
import * as Database from '../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should successfully send a message', async () => {
      const chatId = 'test-chat';
      const userId = 'test-user';
      const content = 'Hello world';

      await Database.sendMessage(chatId, userId, content);

      expect(push).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          content: 'Hello world',
          senderId: userId,
          read: false,
          replyMessage: null,
        })
      );

      expect(update).toHaveBeenCalledTimes(2);
    });

    it('should handle reply messages', async () => {
      const replyMessage = {
        id: 'reply-id',
        content: 'Original message',
        senderId: 'sender-1',
      };

      await Database.sendMessage('chat-1', 'user-1', 'Reply content', replyMessage);

      expect(push).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          replyMessage,
        })
      );
    });
  });

  describe('reactToMessage', () => {
    it('should set reaction for a message', async () => {
      await Database.reactToMessage('message-1', '👍', 'chat-1');

      expect(set).toHaveBeenCalledWith(expect.anything(), '👍');
    });
  });

  describe('fetchChatPartnerInfo', () => {
    it('should throw error when chat metadata not found', async () => {
      (get as jest.Mock).mockImplementationOnce(() => ({
        exists: () => false,
      }));

      await expect(Database.fetchChatPartnerInfo('invalid-chat', 'user-1')).rejects.toThrow(
        'Chat metadata not found.'
      );
    });

    it('should return partner info when found', async () => {
      const mockChatData = {
        exists: () => true,
        val: () => ({
          participants: {
            'user-1_name': {},
            'user-2_name': {},
          },
        }),
      };

      const mockUserData = {
        exists: () => true,
        val: () => ({
          username: 'TestUser',
          isLoggedIn: true,
        }),
      };

      const mockStatusData = {
        exists: () => true,
        val: () => ({
          isActive: true,
          isTyping: false,
          lastActive: 123456,
        }),
      };

      (get as jest.Mock)
        .mockImplementationOnce(() => mockChatData)
        .mockImplementationOnce(() => mockUserData)
        .mockImplementationOnce(() => mockStatusData);

      const result = await Database.fetchChatPartnerInfo('chat-1', 'user-1');

      expect(result).toEqual({
        id: 'user-2',
        username: 'TestUser',
        isActive: true,
        isTyping: false,
        lastActive: 123456,
        isLoggedIn: true,
      });
    });
  });

  describe('updateUserPresence', () => {
    it('should update presence status in both locations', () => {
      Database.updateUserPresence('user-1', 'chat-1', true);

      expect(update).toHaveBeenCalledTimes(2);
      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isActive: true,
          lastActive: { '.sv': 'timestamp' },
        })
      );
    });
  });

  describe('fetchInitialMessages', () => {
    const mockChatId = 'test-chat-id';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch messages with default batch size', async () => {
      const mockMessages = {
        msg1: {
          content: 'Hello',
          senderId: 'user1',
          timestamp: 123456789,
        },
        msg2: {
          content: 'Hi',
          senderId: 'user2',
          timestamp: 123456790,
        },
      };

      (get as jest.Mock).mockResolvedValueOnce({
        val: () => mockMessages,
      });

      const result = await Database.fetchInitialMessages(mockChatId);

      expect(ref).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(orderByChild).toHaveBeenCalledWith('timestamp');
      expect(limitToLast).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'msg1',
        content: 'Hello',
        imageUrl: null,
        senderId: 'user1',
        timestamp: 123456789,
        read: false,
        reaction: undefined,
        replyMessage: null,
      });
    });

    it('should fetch messages with custom batch size', async () => {
      (get as jest.Mock).mockResolvedValueOnce({
        val: () => null,
      });

      const result = await Database.fetchInitialMessages(mockChatId, 25);

      expect(limitToLast).toHaveBeenCalledWith(25);
      expect(result).toEqual([]);
    });

    it('should handle messages with optional fields', async () => {
      const mockMessages = {
        msg1: {
          content: 'Hello',
          senderId: 'user1',
          timestamp: 123456789,
          imageUrl: 'image.jpg',
          read: true,
          reactions: { user1: '👍' },
          replyMessage: { id: 'reply1', content: 'Original' },
        },
      };

      (get as jest.Mock).mockResolvedValueOnce({
        val: () => mockMessages,
      });

      const result = await Database.fetchInitialMessages(mockChatId);

      expect(result[0]).toEqual({
        id: 'msg1',
        content: 'Hello',
        imageUrl: 'image.jpg',
        senderId: 'user1',
        timestamp: 123456789,
        read: true,
        reaction: { user1: '👍' },
        replyMessage: { id: 'reply1', content: 'Original' },
      });
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Fetch failed');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.fetchInitialMessages(mockChatId)).rejects.toThrow('Fetch failed');
    });
  });

  //   describe('setupPresenceDisconnectHandlers', () => {
  //     it('should set up disconnect handlers', () => {
  //       Database.setupPresenceDisconnectHandlers('user-1', 'chat-1');

  //       expect(onDisconnect).toHaveBeenCalledTimes(2);
  //       expect(update).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           isActive: false,
  //           lastActive: expect.any(Function),
  //         })
  //       );
  //     });
  //   });
});
