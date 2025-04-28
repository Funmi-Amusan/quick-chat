import { signOut } from 'firebase/auth';

import { auth } from '../../firebase-config';
import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
