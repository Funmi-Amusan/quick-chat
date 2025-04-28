
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  ref,
  get,
  push,
  update,
  set,
  serverTimestamp,
  limitToLast,
  query,
  orderByChild,
  endBefore,
  onValue,
  startAfter,
  getDatabase,
} from 'firebase/database';
import { uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Toast from 'react-native-toast-message';

import { auth } from '../firebase-config';
import * as Database from '../firebase-sevice';
import { register } from '../firebase-sevice';

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

  describe('fetchOlderMessages', () => {
    const mockChatId = 'test-chat-123';
    const mockTimestamp = 1234567890;
    const mockBatchSize = 30;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch older messages successfully', async () => {
      const mockMessages = {
        'msg-1': {
          content: 'Hello',
          senderId: 'user-1',
          timestamp: 1234567800,
          read: true,
          imageUrl: 'image.jpg',
          reactions: { 'user-1': '👍' },
          replyMessage: { id: 'msg-0', content: 'Hi' },
        },
      };

      (get as jest.Mock).mockResolvedValueOnce({
        val: () => mockMessages,
      });

      const result = await Database.fetchOlderMessages(mockChatId, mockTimestamp, mockBatchSize);

      expect(ref).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
      expect(orderByChild).toHaveBeenCalledWith('timestamp');
      expect(endBefore).toHaveBeenCalledWith(mockTimestamp);
      expect(limitToLast).toHaveBeenCalledWith(mockBatchSize);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'msg-1',
        content: 'Hello',
        senderId: 'user-1',
        timestamp: 1234567800,
        read: true,
        imageUrl: 'image.jpg',
        reaction: { 'user-1': '👍' },
        replyMessage: { id: 'msg-0', content: 'Hi' },
      });
    });

    it('should return empty array when no messages found', async () => {
      (get as jest.Mock).mockResolvedValueOnce({
        val: () => null,
      });

      const result = await Database.fetchOlderMessages(mockChatId, mockTimestamp);

      expect(result).toEqual([]);
    });

    it('should use default batch size when not provided', async () => {
      (get as jest.Mock).mockResolvedValueOnce({
        val: () => null,
      });

      await Database.fetchOlderMessages(mockChatId, mockTimestamp);

      expect(limitToLast).toHaveBeenCalledWith(50);
    });

    it('should handle messages without optional fields', async () => {
      const mockMessages = {
        'msg-1': {
          content: 'Hello',
          senderId: 'user-1',
          timestamp: 1234567800,
        },
      };

      (get as jest.Mock).mockResolvedValueOnce({
        val: () => mockMessages,
      });

      const result = await Database.fetchOlderMessages(mockChatId, mockTimestamp);

      expect(result[0]).toEqual({
        id: 'msg-1',
        content: 'Hello',
        senderId: 'user-1',
        timestamp: 1234567800,
        read: false,
        imageUrl: null,
        reaction: undefined,
        replyMessage: null,
      });
    });

    it('should throw error when database query fails', async () => {
      const mockError = new Error('Database error');
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.fetchOlderMessages(mockChatId, mockTimestamp)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('markMessagesAsRead', () => {
    const mockRef = jest.fn();
    const mockUpdate = jest.fn();

    beforeEach(() => {
      (ref as jest.Mock).mockReturnValue(mockRef);
      (update as jest.Mock).mockReturnValue(mockUpdate);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not update anything when there are no unread messages', () => {
      const messages = [
        { id: '1', senderId: 'user1', read: true },
        { id: '2', senderId: 'currentUser', read: false },
      ];

      Database.markMessagesAsRead('chat123', 'currentUser', messages);

      expect(update).not.toHaveBeenCalled();
    });

    it('should update read status for unread messages from other users', () => {
      const messages = [
        { id: '1', senderId: 'user1', read: false },
        { id: '2', senderId: 'user2', read: false },
        { id: '3', senderId: 'currentUser', read: false },
      ];

      Database.markMessagesAsRead('chat123', 'currentUser', messages);

      expect(update).toHaveBeenCalledWith(mockRef, {
        'chats/chat123/messages/1/read': true,
        'chats/chat123/messages/2/read': true,
      });
    });

    it('should handle empty messages array', () => {
      Database.markMessagesAsRead('chat123', 'currentUser', []);

      expect(update).not.toHaveBeenCalled();
    });

    it('should only update unread messages', () => {
      const messages = [
        { id: '1', senderId: 'user1', read: true },
        { id: '2', senderId: 'user1', read: false },
        { id: '3', senderId: 'user2', read: true },
        { id: '4', senderId: 'user2', read: false },
      ];

      Database.markMessagesAsRead('chat123', 'currentUser', messages);

      expect(update).toHaveBeenCalledWith(mockRef, {
        'chats/chat123/messages/2/read': true,
        'chats/chat123/messages/4/read': true,
      });
    });

    it('should handle messages with missing read property', () => {
      const messages = [
        { id: '1', senderId: 'user1' },
        { id: '2', senderId: 'user2', read: false },
      ];

      Database.markMessagesAsRead('chat123', 'currentUser', messages as any);

      expect(update).toHaveBeenCalledWith(mockRef, {
        'chats/chat123/messages/1/read': true,
        'chats/chat123/messages/2/read': true,
      });
    });
  });

  describe('listenForNewMessages', () => {
    const mockChatId = 'test-chat-id';
    const mockLatestTimestamp = 1234567890;
    const mockOnNewMessage = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should set up message listener with correct query parameters', () => {
      const mockRef = 'messagesRef';
      const mockQuery = 'queryRef';
      (ref as jest.Mock).mockReturnValue(mockRef);
      (query as jest.Mock).mockReturnValue(mockQuery);
      (onValue as jest.Mock).mockReturnValue(() => {});

      Database.listenForNewMessages(mockChatId, mockLatestTimestamp, mockOnNewMessage, mockOnError);

      expect(ref).toHaveBeenCalledWith(expect.anything(), `chats/${mockChatId}/messages`);
      expect(query).toHaveBeenCalledWith(
        mockRef,
        orderByChild('timestamp'),
        startAfter(mockLatestTimestamp)
      );
      expect(onValue).toHaveBeenCalledWith(mockQuery, expect.any(Function), expect.any(Function));
    });

    it('should process new messages and call onNewMessage for each message', () => {
      const mockSnapshot = {
        val: () => ({
          message1: {
            content: 'Hello',
            senderId: 'user1',
            timestamp: 1000,
            read: false,
          },
          message2: {
            content: 'World',
            senderId: 'user2',
            timestamp: 2000,
            imageUrl: 'image.jpg',
            reactions: { user1: '👍' },
          },
        }),
      };

      (onValue as jest.Mock).mockImplementation((query, callback) => {
        callback(mockSnapshot);
        return () => {};
      });

      Database.listenForNewMessages(mockChatId, mockLatestTimestamp, mockOnNewMessage, mockOnError);

      expect(mockOnNewMessage).toHaveBeenCalledTimes(2);
      expect(mockOnNewMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'message1',
          content: 'Hello',
          senderId: 'user1',
          timestamp: 1000,
          read: false,
          imageUrl: null,
          replyMessage: null,
        })
      );
    });

    it('should handle empty message data', () => {
      const mockSnapshot = {
        val: () => null,
      };

      (onValue as jest.Mock).mockImplementation((query, callback) => {
        callback(mockSnapshot);
        return () => {};
      });

      Database.listenForNewMessages(mockChatId, mockLatestTimestamp, mockOnNewMessage, mockOnError);

      expect(mockOnNewMessage).not.toHaveBeenCalled();
    });

    it('should call onError when listener encounters an error', () => {
      const mockError = new Error('Database error');

      (onValue as jest.Mock).mockImplementation((query, callback, errorCallback) => {
        errorCallback(mockError);
        return () => {};
      });

      Database.listenForNewMessages(mockChatId, mockLatestTimestamp, mockOnNewMessage, mockOnError);

      expect(mockOnError).toHaveBeenCalledWith('Database error');
    });

    it('should return unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (onValue as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = Database.listenForNewMessages(
        mockChatId,
        mockLatestTimestamp,
        mockOnNewMessage,
        mockOnError
      );

      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('listenToUserStatus', () => {
    const mockCallback = jest.fn();
    const mockUnsubscribe = jest.fn();
    const userId = 'test-user-123';

    beforeEach(() => {
      jest.clearAllMocks();
      (onValue as jest.Mock).mockReturnValue(mockUnsubscribe);
    });

    it('should setup listener with correct reference path', () => {
      Database.listenToUserStatus(userId, mockCallback);
      expect(ref).toHaveBeenCalledWith(expect.anything(), `/status/${userId}`);
    });

    it('should call callback with user status when snapshot exists', () => {
      const mockStatus = { online: true, last_seen: 123456789 };
      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          val: () => mockStatus,
        });
        return mockUnsubscribe;
      });

      Database.listenToUserStatus(userId, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(mockStatus);
    });

    it('should call callback with null when snapshot does not exist', () => {
      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          exists: () => false,
          val: () => null,
        });
        return mockUnsubscribe;
      });

      Database.listenToUserStatus(userId, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it('should call callback with null when error occurs', () => {
      (onValue as jest.Mock).mockImplementation((ref, callback, errorCallback) => {
        errorCallback(new Error('Database error'));
        return mockUnsubscribe;
      });

      Database.listenToUserStatus(userId, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it('should return unsubscribe function', () => {
      const unsubscribe = Database.listenToUserStatus(userId, mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle empty userId', () => {
      Database.listenToUserStatus('', mockCallback);
      expect(ref).toHaveBeenCalledWith(expect.anything(), '/status/');
    });
  });

  describe('fetchAllUsers', () => {
    const mockRef = {} as any;
    const currentUserId = 'current-user-123';
    const db = getDatabase();
    beforeEach(() => {
      (ref as jest.Mock).mockReturnValue(mockRef);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return empty array when no users exist', async () => {
      (get as jest.Mock).mockResolvedValue({
        exists: () => false,
        val: () => null,
      });

      const result = await Database.fetchAllUsers(currentUserId);
      expect(result).toEqual([]);
      expect(ref).toHaveBeenCalledWith(db, 'users');
    });

    it('should return formatted users excluding current user', async () => {
      const mockUsers = {
        'user-1': { name: 'User 1', email: 'user1@test.com' },
        'user-2': { name: 'User 2', email: 'user2@test.com' },
        [currentUserId]: { name: 'Current User', email: 'current@test.com' },
      };

      (get as jest.Mock).mockResolvedValue({
        exists: () => true,
        val: () => mockUsers,
      });

      const result = await Database.fetchAllUsers(currentUserId);

      expect(result).toHaveLength(2);
      expect(result.find((user) => user.id === currentUserId)).toBeUndefined();
      expect(result[0].id).toBe('user-1');
      expect(result[1].id).toBe('user-2');
    });

    it('should throw error when database operation fails', async () => {
      const errorMessage = 'Database error';
      (get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(Database.fetchAllUsers(currentUserId)).rejects.toThrow('Database error');
    });

    it('should handle empty user data correctly', async () => {
      (get as jest.Mock).mockResolvedValue({
        exists: () => true,
        val: () => ({}),
      });

      const result = await Database.fetchAllUsers(currentUserId);
      expect(result).toEqual([]);
    });
  });

  describe('createChat', () => {
    const mockCurrentUserId = 'user1';
    const mockCurrentUserName = 'User One';
    const mockOtherUserId = 'user2';
    const mockOtherUserName = 'User Two';
    const expectedChatId = 'user1_user2';

    beforeEach(() => {
      jest.clearAllMocks();
      (serverTimestamp as jest.Mock).mockReturnValue('timestamp');
    });

    it('should return existing chatId if chat already exists', async () => {
      (get as jest.Mock).mockImplementationOnce(() => ({
        exists: () => true,
      }));

      const result = await Database.createChat(
        mockCurrentUserId,
        mockCurrentUserName,
        mockOtherUserId,
        mockOtherUserName
      );

      expect(result).toBe(expectedChatId);
    });

    it('should return existing chatId if chat summary exists', async () => {
      (get as jest.Mock)
        .mockImplementationOnce(() => ({
          exists: () => false,
        }))
        .mockImplementationOnce(() => ({
          exists: () => true,
        }));

      const result = await Database.createChat(
        mockCurrentUserId,
        mockCurrentUserName,
        mockOtherUserId,
        mockOtherUserName
      );

      expect(result).toBe(expectedChatId);
    });

    it('should create new chat with correct data structure', async () => {
      (get as jest.Mock).mockImplementation(() => ({
        exists: () => false,
      }));
      (update as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await Database.createChat(
        mockCurrentUserId,
        mockCurrentUserName,
        mockOtherUserId,
        mockOtherUserName
      );

      expect(update).toHaveBeenCalledWith(expect.any(Object), {
        [`/chats/${expectedChatId}`]: {
          participants: {
            [`${mockCurrentUserId}_${mockCurrentUserName}`]: {
              updatedAt: 'timestamp',
            },
            [`${mockOtherUserId}_${mockOtherUserName}`]: {
              updatedAt: 'timestamp',
            },
          },
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
          lastMessage: null,
          participantNames: {
            [mockCurrentUserId]: mockCurrentUserName,
            [mockOtherUserId]: mockOtherUserName,
          },
        },
        [`/chatsSummary/${expectedChatId}`]: {
          updatedAt: 'timestamp',
          lastMessage: null,
          participantNames: {
            [mockCurrentUserId]: mockCurrentUserName,
            [mockOtherUserId]: mockOtherUserName,
          },
        },
        [`/users/${mockCurrentUserId}/chatsSummary/${expectedChatId}`]: true,
        [`/users/${mockOtherUserId}/chatsSummary/${expectedChatId}`]: true,
      });
      expect(result).toBe(expectedChatId);
    });

    it('should throw error when update fails', async () => {
      (get as jest.Mock).mockImplementation(() => ({
        exists: () => false,
      }));
      const errorMessage = 'Update failed';
      (update as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        Database.createChat(
          mockCurrentUserId,
          mockCurrentUserName,
          mockOtherUserId,
          mockOtherUserName
        )
      ).rejects.toThrow(errorMessage);
    });

    it('should sort userIds correctly for chatId generation', async () => {
      (get as jest.Mock).mockImplementation(() => ({
        exists: () => false,
      }));
      (update as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await Database.createChat(
        'user2',
        mockOtherUserName,
        'user1',
        mockCurrentUserName
      );

      expect(result).toBe('user1_user2');
    });
  });

  describe('listenToUserChats', () => {
    const mockUserId = 'test-user-123';
    const mockCallback = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle empty chat data', () => {
      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          val: () => null,
        });
        return jest.fn();
      });

      Database.listenToUserChats(mockUserId, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should process valid chat data correctly', async () => {
      const mockChatData = {
        'chat-1': true,
        'chat-2': true,
      };

      const mockChatSummaries = {
        'chat-1': {
          lastMessage: 'Hello',
          participantNames: {
            'test-user-123': 'TestUser',
            'partner-123': 'Partner1',
          },
          updatedAt: 123456789,
        },
        'chat-2': {
          lastMessage: 'Hi there',
          participantNames: {
            'test-user-123': 'TestUser',
            'partner-456': 'Partner2',
          },
          updatedAt: 123456790,
        },
      };

      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          val: () => mockChatData,
        });
        return jest.fn();
      });

      (get as jest.Mock).mockImplementation((ref) => {
        const chatId = ref.toString().split('/').pop();
        return Promise.resolve({
          exists: () => true,
          val: () => mockChatSummaries[chatId],
        });
      });

      Database.listenToUserChats(mockUserId, mockCallback);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle chat data not found', async () => {
      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          val: () => ({ 'chat-1': true }),
        });
        return jest.fn();
      });

      (get as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          exists: () => false,
          val: () => null,
        })
      );

      Database.listenToUserChats(mockUserId, mockCallback);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should handle errors in chat data fetching', async () => {
      const mockError = new Error('Database error');

      (onValue as jest.Mock).mockImplementation((ref, callback, errorCallback) => {
        errorCallback(mockError);
        return jest.fn();
      });

      Database.listenToUserChats(mockUserId, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([], mockError);
    });

    it('should handle anonymous partners', async () => {
      (onValue as jest.Mock).mockImplementation((ref, callback) => {
        callback({
          val: () => ({ 'chat-1': true }),
        });
        return jest.fn();
      });

      (get as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({
            lastMessage: 'Hello',
            participantNames: {
              'test-user-123': 'TestUser',
            },
            updatedAt: 123456789,
          }),
        })
      );

      Database.listenToUserChats(mockUserId, mockCallback);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockCallback).toHaveBeenCalledWith([
        {
          id: 'chat-1',
          lastMessage: 'Hello',
          partner: 'Anonymous',
          partnerId: '',
          updatedAt: 123456789,
        },
      ]);
    });
  });

  describe('reactToMessage', () => {
    let mockReactToMessage: jest.SpyInstance;

    beforeEach(() => {
      mockReactToMessage = jest.spyOn(Database, 'reactToMessage');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call reactToMessage with correct parameters', async () => {
      const messageId = 'message-123';
      const emoji = '👍';
      const chatId = 'chat-123';

      await Database.reactToMessage(messageId, emoji, chatId);

      expect(mockReactToMessage).toHaveBeenCalledWith(messageId, emoji, chatId);
    });

    it('should handle empty emoji reaction', async () => {
      const messageId = 'message-123';
      const emoji = '';
      const chatId = 'chat-123';

      await Database.reactToMessage(messageId, emoji, chatId);

      expect(mockReactToMessage).toHaveBeenCalledWith(messageId, emoji, chatId);
    });

    it('should handle special character emojis', async () => {
      const messageId = 'message-123';
      const emoji = '🎉🎊';
      const chatId = 'chat-123';

      await Database.reactToMessage(messageId, emoji, chatId);

      expect(mockReactToMessage).toHaveBeenCalledWith(messageId, emoji, chatId);
    });

    it('should handle invalid message ID', async () => {
      const messageId = '';
      const emoji = '👍';
      const chatId = 'chat-123';

      await expect(Database.reactToMessage(messageId, emoji, chatId)).resolves.toBeUndefined();
    });

    it('should handle invalid chat ID', async () => {
      const messageId = 'message-123';
      const emoji = '👍';
      const chatId = '';

      await expect(Database.reactToMessage(messageId, emoji, chatId)).resolves.toBeUndefined();
    });
  });

  describe('resetTypingStatus', () => {
    const db = getDatabase();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call ref with correct path', () => {
      const userId = 'user123';
      const chatId = 'chat456';

      Database.resetTypingStatus(userId, chatId);

      expect(ref).toHaveBeenCalledWith(db, `chats/${chatId}/participants/${userId}/isTyping`);
    });

    it('should update typing status to false', () => {
      const userId = 'user123';
      const chatId = 'chat456';
      const mockRef = {};
      (ref as jest.Mock).mockReturnValue(mockRef);

      Database.resetTypingStatus(userId, chatId);

      expect(update).toHaveBeenCalledWith(mockRef, { isTyping: false });
    });

    it('should handle empty strings for userId and chatId', () => {
      Database.resetTypingStatus('', '');

      expect(ref).toHaveBeenCalledWith(db, 'chats//participants//isTyping');
      expect(update).toHaveBeenCalled();
    });

    it('should work with special characters in ids', () => {
      const userId = 'user/123#$';
      const chatId = 'chat@456&';

      Database.resetTypingStatus(userId, chatId);

      expect(ref).toHaveBeenCalledWith(db, `chats/${chatId}/participants/${userId}/isTyping`);
    });
  });

  describe('sendImageMessage', () => {
    const mockImageUri = 'file://test/image.jpg';
    const mockChatId = 'chat-123';
    const mockSenderId = 'sender-123';
    const mockDownloadURL = 'https://firebasestorage.test/image.jpg';
    const mockBlob = new Blob([''], { type: 'image/jpeg' });

    beforeEach(() => {
      jest.clearAllMocks();
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });
      (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
      (uploadBytesResumable as jest.Mock).mockReturnValue({
        on: (
          event: string,
          progressCallback: Function,
          errorCallback: Function,
          completeCallback: Function
        ) => {
          progressCallback({ bytesTransferred: 100, totalBytes: 100 });
          completeCallback();
        },
        snapshot: {
          ref: {},
        },
      });
    });

    it('should successfully upload image and send message without text', async () => {
      const result = await Database.sendImageMessage(mockChatId, mockSenderId, mockImageUri);

      expect(result).toBe(true);
      expect(push).toHaveBeenCalledWith(expect.anything(), {
        content: '',
        imageUrl: mockDownloadURL,
        senderId: mockSenderId,
        timestamp: serverTimestamp(),
        read: {},
        replyTo: null,
      });
    });

    it('should handle message with text and reply information', async () => {
      const mockText = 'Test message';
      const mockReplyTo = {
        id: 'reply-123',
        content: 'Original message',
        senderId: 'original-sender',
      };

      await Database.sendImageMessage(
        mockChatId,
        mockSenderId,
        mockImageUri,
        mockText,
        mockReplyTo
      );

      expect(push).toHaveBeenCalledWith(expect.anything(), {
        content: mockText,
        imageUrl: mockDownloadURL,
        senderId: mockSenderId,
        timestamp: serverTimestamp(),
        read: {},
        replyTo: mockReplyTo,
      });
    });

    it('should handle upload failure', async () => {
      const mockError = new Error('Upload failed');
      (uploadBytesResumable as jest.Mock).mockReturnValue({
        on: (event: string, progressCallback: Function, errorCallback: Function) => {
          errorCallback(mockError);
        },
      });

      await expect(
        Database.sendImageMessage(mockChatId, mockSenderId, mockImageUri)
      ).rejects.toThrow('Upload failed');
    });

    it('should handle fetch failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(
        Database.sendImageMessage(mockChatId, mockSenderId, mockImageUri)
      ).rejects.toThrow('Fetch failed');
    });

    it('should update chat metadata with last message', async () => {
      const mockText = 'Test message';

      await Database.sendImageMessage(mockChatId, mockSenderId, mockImageUri, mockText);

      expect(push).toHaveBeenCalledWith(expect.anything(), {
        lastMessage: {
          content: mockText,
          senderId: mockSenderId,
          timestamp: serverTimestamp(),
          hasImage: true,
        },
        updatedAt: serverTimestamp(),
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call signOut with auth instance', async () => {
      await Database.logout();
      expect(signOut).toHaveBeenCalledWith(auth);
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    it('should throw error when signOut fails', async () => {
      const mockError = new Error('Network error');
      (signOut as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.logout()).rejects.toThrow('Network error');
      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('should handle different types of errors', async () => {
      const mockError = { code: 'auth/invalid-user' };
      (signOut as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.logout()).rejects.toEqual(mockError);
      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('should complete successfully when signOut resolves', async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(Database.logout()).resolves.toBeUndefined();
      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });

  describe('login', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockUser = { uid: 'test-uid', email: mockEmail };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully login user with valid credentials', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await Database.login(mockEmail, mockPassword);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, mockEmail, mockPassword);
      expect(result).toEqual({ user: mockUser });
      expect(Toast.show).not.toHaveBeenCalled();
    });

    it('should throw error and show toast for invalid credentials', async () => {
      const mockError = new Error('auth/invalid-credentials');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.login(mockEmail, mockPassword)).rejects.toThrow(mockError);

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Login failed',
        text2: 'Invalid email or password',
      });
    });

    it('should handle empty email and password', async () => {
      const mockError = new Error('auth/invalid-email');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.login('', '')).rejects.toThrow(mockError);

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Login failed',
        text2: 'Invalid email or password',
      });
    });

    it('should handle network errors', async () => {
      const mockError = new Error('auth/network-request-failed');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(Database.login(mockEmail, mockPassword)).rejects.toThrow(mockError);

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Login failed',
        text2: 'Invalid email or password',
      });
    });
  });

  // describe('register', () => {
  //   const mockUser = { uid: 'test-uid', email: 'test@example.com' };
  //   const mockUserCredential = { user: mockUser };

  //   beforeEach(() => {
  //     jest.clearAllMocks();
  //     (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
  //     (updateProfile as jest.Mock).mockResolvedValue(undefined);

  //   });

  //   it('should register user without name', async () => {
  //     const email = 'test@example.com';
  //     const password = 'password123';

  //     const result = await register(email, password);

  //     expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, email, password);
  //     expect(updateProfile).not.toHaveBeenCalled();
  //     expect(result).toEqual({ user: mockUser });
  //   });

  //   it('should register user with name', async () => {
  //     const email = 'test@example.com';
  //     const password = 'password123';
  //     const name = 'Test User';

  //     const result = await register(email, password, name);

  //     expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, email, password);
  //     expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: name });
  //     expect(result).toEqual({ user: mockUser });
  //   });

  //   it('should throw error when registration fails', async () => {
  //     const error = new Error('Registration failed');
  //     (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

  //     await expect(register('test@example.com', 'password123')).rejects.toThrow(error);
  //   });

  //   it('should throw error when profile update fails', async () => {
  //     const error = new Error('Profile update failed');
  //     (updateProfile as jest.Mock).mockRejectedValue(error);

  //     await expect(register('test@example.com', 'password123', 'Test User')).rejects.toThrow(error);
  //   });

  //   it('should handle empty email', async () => {
  //     await expect(register('', 'password123')).rejects.toThrow();
  //     expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, '', 'password123');
  //   });

  //   it('should handle empty password', async () => {
  //     await expect(register('test@example.com', '')).rejects.toThrow();
  //     expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', '');
  //   });
  // });

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
