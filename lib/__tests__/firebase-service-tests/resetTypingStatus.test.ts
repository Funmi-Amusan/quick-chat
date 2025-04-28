import { ref, update, getDatabase } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
