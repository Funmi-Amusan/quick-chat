import { render } from '@testing-library/react-native';

import ActiveTypingBubble from '~/components/chats/chatRoom/ActiveTypingBubble';

describe('ActiveTypingBubble', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('initializes with correct opacity values', () => {
    const { getByTestId } = render(<ActiveTypingBubble />);
    const bubble = getByTestId('typing-bubble');
    const dots = bubble.findAllByProps({ className: 'h-2 w-2 rounded-full bg-gray-500' });

    expect(dots[0].props.style.opacity).toBe(0.3);
    expect(dots[1].props.style.opacity).toBe(0.3);
    expect(dots[2].props.style.opacity).toBe(0.3);
  });

  test('animates dots in sequence', () => {
    const { getByTestId } = render(<ActiveTypingBubble />);
    const bubble = getByTestId('typing-bubble');
    const dots = bubble.findAllByProps({ className: 'h-2 w-2 rounded-full bg-gray-500' });

    // First dot animation
    jest.advanceTimersByTime(0);
    expect(dots[0].props.style.opacity).toBe(0.3);
    expect(dots[1].props.style.opacity).toBe(0.3);
    expect(dots[2].props.style.opacity).toBe(0.3);

    // Second dot animation
    jest.advanceTimersByTime(150);
    expect(dots[1].props.style.opacity).toBe(0.3);

    // Third dot animation
    jest.advanceTimersByTime(150);
    expect(dots[2].props.style.opacity).toBe(0.3);

    // Reset animation
    jest.advanceTimersByTime(350);
    expect(dots[0].props.style.opacity).toBe(0.3);
    expect(dots[1].props.style.opacity).toBe(0.3);
    expect(dots[2].props.style.opacity).toBe(0.3);
  });

  test('completes full animation cycle', () => {
    const { getByTestId } = render(<ActiveTypingBubble />);
    const bubble = getByTestId('typing-bubble');

    jest.advanceTimersByTime(1200);
    expect(bubble).toBeTruthy();
  });

  test('cleans up interval on unmount', () => {
    const { unmount } = render(<ActiveTypingBubble />);
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
