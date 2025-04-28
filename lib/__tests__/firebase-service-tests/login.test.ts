import { signInWithEmailAndPassword } from 'firebase/auth';
import Toast from 'react-native-toast-message';

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
});
