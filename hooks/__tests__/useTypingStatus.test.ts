import { renderHook } from '@testing-library/react-native';
import useTypingStatus from '../useTypingStatus';
import * as Database from '~/lib/firebase-sevice';

describe('useTypingStatus', () => {
  let mockSetTypingStatus: jest.SpyInstance;
  let mockResetTypingStatus: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    mockSetTypingStatus = jest.spyOn(Database, 'setTypingStatus');
    mockResetTypingStatus = jest.spyOn(Database, 'resetTypingStatus');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should not call any typing functions when currentUser is null', () => {
    const { unmount } = renderHook(() => useTypingStatus(null, 'chat-123', 'hello'));

    expect(mockSetTypingStatus).not.toHaveBeenCalled();
    expect(mockResetTypingStatus).not.toHaveBeenCalled();

    unmount();
  });

  it('should not call any typing functions when chatId is empty', () => {
    const mockUser = { uid: 'user-123' };
    const { unmount } = renderHook(() => useTypingStatus(mockUser, '', 'hello'));

    expect(mockSetTypingStatus).not.toHaveBeenCalled();
    expect(mockResetTypingStatus).not.toHaveBeenCalled();

    unmount();
  });

  it('should set typing status when input text is not empty', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';
    
    renderHook(() => useTypingStatus(mockUser, chatId, 'hello'));

    expect(mockSetTypingStatus).toHaveBeenCalledWith(mockUser.uid, chatId, true);
    expect(mockResetTypingStatus).not.toHaveBeenCalled();
  });

  it('should reset typing status after timeout', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';
    
    renderHook(() => useTypingStatus(mockUser, chatId, 'hello'));

    jest.advanceTimersByTime(5000);

    expect(mockResetTypingStatus).toHaveBeenCalledWith(mockUser.uid, chatId);
  });

  it('should reset typing status immediately when input becomes empty', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';
    
    const { rerender } = renderHook(
      ({ text }) => useTypingStatus(mockUser, chatId, text),
      { initialProps: { text: 'hello' } }
    );

    rerender({ text: '' });

    expect(mockResetTypingStatus).toHaveBeenCalledWith(mockUser.uid, chatId);
    expect(mockSetTypingStatus).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout and reset status on unmount while typing', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';
    
    const { unmount } = renderHook(() => useTypingStatus(mockUser, chatId, 'hello'));
    mockResetTypingStatus.mockClear();

    unmount();

    jest.advanceTimersByTime(5000);
    expect(mockResetTypingStatus).not.toHaveBeenCalled();
  });

  it('should reset previous timeout when input changes', () => {
    const mockUser = { uid: 'user-123' };
    const chatId = 'chat-123';
    
    const { rerender } = renderHook(
      ({ text }) => useTypingStatus(mockUser, chatId, text),
      { initialProps: { text: 'hello' } }
    );

    jest.advanceTimersByTime(3000);
    rerender({ text: 'hello world' });

    jest.advanceTimersByTime(3000);
    expect(mockResetTypingStatus).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    expect(mockResetTypingStatus).toHaveBeenCalledWith(mockUser.uid, chatId);
  });
});
