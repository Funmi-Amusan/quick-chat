import { fireEvent, render } from '@testing-library/react-native';

import ChatTextInput from '~/components/chats/chatRoom/chatTextInput/ChatTextInput';

describe('ChatTextInput', () => {
  const mockOnChangeText = jest.fn();
  const mockOnSendPress = jest.fn();
  const mockOnFocus = jest.fn();
  const mockOnBlur = jest.fn();
  const mockOnImagePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default placeholder text', () => {
    const { getByPlaceholderText } = render(
      <ChatTextInput value="" onChangeText={mockOnChangeText} onSendPress={mockOnSendPress} />
    );
    expect(getByPlaceholderText('Reply')).toBeTruthy();
  });

  test('renders with custom placeholder text', () => {
    const { getByPlaceholderText } = render(
      <ChatTextInput
        value=""
        onChangeText={mockOnChangeText}
        onSendPress={mockOnSendPress}
        placeholder="Custom placeholder"
      />
    );
    expect(getByPlaceholderText('Custom placeholder')).toBeTruthy();
  });

  test('handles text input changes', () => {
    const { getByPlaceholderText } = render(
      <ChatTextInput value="" onChangeText={mockOnChangeText} onSendPress={mockOnSendPress} />
    );

    const input = getByPlaceholderText('Reply');
    fireEvent.changeText(input, 'Hello world');
    expect(mockOnChangeText).toHaveBeenCalledWith('Hello world');
  });

  test('triggers onFocus callback when input is focused', () => {
    const { getByPlaceholderText } = render(
      <ChatTextInput
        value=""
        onChangeText={mockOnChangeText}
        onSendPress={mockOnSendPress}
        onFocus={mockOnFocus}
      />
    );

    const input = getByPlaceholderText('Reply');
    fireEvent(input, 'focus');
    expect(mockOnFocus).toHaveBeenCalled();
  });

  // test('triggers onBlur callback when input loses focus', () => {
  //   const { getByPlaceholderText } = render(
  //     <ChatTextInput
  //       value=""
  //       onChangeText={mockOnChangeText}
  //       onSendPress={mockOnSendPress}
  //       onBlur={mockOnBlur}
  //     />
  //   );

  //   const input = getByPlaceholderText('Reply');
  //   fireEvent(input, 'blur');
  //   expect(mockOnBlur).toHaveBeenCalled();
  // });

  test('hides camera icon when showCameraIcon is false', () => {
    const { queryByTestId } = render(
      <ChatTextInput
        value=""
        onChangeText={mockOnChangeText}
        onSendPress={mockOnSendPress}
        showCameraIcon={false}
      />
    );

    expect(queryByTestId('camera-icon')).toBeNull();
  });

  test('disables camera button when isUploading is true', () => {
    const { getByTestId } = render(
      <ChatTextInput
        value=""
        onChangeText={mockOnChangeText}
        onSendPress={mockOnSendPress}
        onImagePress={mockOnImagePress}
        isUploading
      />
    );

    const cameraButton = getByTestId('camera-button');
    fireEvent.press(cameraButton);
    expect(mockOnImagePress).not.toHaveBeenCalled();
  });

  test('triggers send button press', () => {
    const { getByTestId } = render(
      <ChatTextInput
        value="Test message"
        onChangeText={mockOnChangeText}
        onSendPress={mockOnSendPress}
      />
    );

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);
    expect(mockOnSendPress).toHaveBeenCalled();
  });

  test('automatically focuses input when setFocus prop is provided', () => {
    const mockSetFocus = jest.fn();
    render(
      <ChatTextInput
        value=""
        onChangeText={mockOnChangeText}
        onSendPress={mockOnSendPress}
        setFocus={mockSetFocus}
      />
    );

    expect(mockSetFocus).toHaveBeenCalled();
  });
});
