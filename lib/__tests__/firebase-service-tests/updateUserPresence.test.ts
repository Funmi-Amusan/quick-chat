import { update } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
