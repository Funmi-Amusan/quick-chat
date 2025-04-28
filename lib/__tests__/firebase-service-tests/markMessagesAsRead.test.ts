import { ref, update } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
