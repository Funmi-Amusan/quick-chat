import { renderHook } from '@testing-library/react-native';

import useChatPresence from '../useChatRoomPresence';

import * as Database from '~/lib/firebase-sevice';


describe('useChatPresence', () => {
  let mockUpdateUserPresence: jest.SpyInstance;
  let mockSetupPresenceDisconnectHandlers: jest.SpyInstance;

  beforeEach(() => {
    mockUpdateUserPresence = jest.spyOn(Database, 'updateUserPresence');
    mockSetupPresenceDisconnectHandlers = jest.spyOn(Database, 'setupPresenceDisconnectHandlers');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not call any presence functions when currentUser is null', () => {
    const { unmount } = renderHook(() => useChatPresence(null, 'chat-123'));

    expect(mockUpdateUserPresence).not.toHaveBeenCalled();
    expect(mockSetupPresenceDisconnectHandlers).not.toHaveBeenCalled();

    unmount();
  });

  it('should not call any presence functions when chatId is empty', () => {
    const mockUser = { uid: 'user-123' };
    const { unmount } = renderHook(() => useChatPresence(mockUser, ''));

    expect(mockUpdateUserPresence).not.toHaveBeenCalled();
    expect(mockSetupPresenceDisconnectHandlers).not.toHaveBeenCalled();

    unmount();
  });

  it('should update presence and setup disconnect handlers when mounted with valid params', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';

    const { unmount } = renderHook(() => useChatPresence(mockUser, chatId));

    expect(mockUpdateUserPresence).toHaveBeenCalledWith(mockUser.uid, chatId, true);
    expect(mockSetupPresenceDisconnectHandlers).toHaveBeenCalledWith(mockUser.uid, chatId);

    unmount();
  });

  it('should update presence to false when unmounted', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';

    const { unmount } = renderHook(() => useChatPresence(mockUser, chatId));
    mockUpdateUserPresence.mockClear();

    unmount();

    expect(mockUpdateUserPresence).toHaveBeenCalledWith(mockUser.uid, chatId, false);
  });

  it('should re-run effect when chatId changes', () => {
    const mockUser = { uid: 'user-123' };
    const { rerender } = renderHook(({ chatId }) => useChatPresence(mockUser, chatId), {
      initialProps: { chatId: 'chat-1' },
    });

    expect(mockUpdateUserPresence).toHaveBeenCalledWith(mockUser.uid, 'chat-1', true);

    rerender({ chatId: 'chat-2' });

    expect(mockUpdateUserPresence).toHaveBeenCalledWith(mockUser.uid, 'chat-1', false);
    expect(mockUpdateUserPresence).toHaveBeenCalledWith(mockUser.uid, 'chat-2', true);
  });
});
