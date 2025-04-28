import { push, update } from 'firebase/database';

import * as Database from '../../firebase-sevice';

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
});
