import { ref, onValue } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
