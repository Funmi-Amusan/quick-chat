import { ref, get, getDatabase } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
