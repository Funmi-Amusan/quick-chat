import { push, serverTimestamp } from 'firebase/database';
import { uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
