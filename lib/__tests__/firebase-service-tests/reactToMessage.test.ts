import { set } from 'firebase/database';

import * as Database from '../../firebase-sevice';

jest.mock('firebase/database');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('react-native-toast-message');

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('reactToMessage', () => {
    it('should set reaction for a message', async () => {
      await Database.reactToMessage('message-1', '👍', 'chat-1');

      expect(set).toHaveBeenCalledWith(expect.anything(), '👍');
    });
  });
});
