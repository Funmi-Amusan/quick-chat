import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import ChatHeader from '~/components/chats/chatroom/chatHeader/ChatHeader';

jest.mock('expo-router', () => {
  // --- Re-create the stable mock functions for router methods for this file ---
  // We define them again here so they are scoped to this mock factory
  const mockBack = jest.fn();
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockSetParams = jest.fn();
  // Add other router methods you need to mock in this test file

  // --- Mock the useRouter hook for this test file ---
  // It returns the object with stable mock function instances defined above
  const useRouter = () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
    setParams: mockSetParams,
    // ... return other mock methods
  });

  // *** Attach the mock function instances to the mock useRouter function itself for easy access ***
  useRouter.mockBack = mockBack;
  useRouter.mockPush = mockPush;
  useRouter.mockReplace = mockReplace;
  useRouter.mockSetParams = mockSetParams;
  // Attach other mock functions here

  // --- Provide a mock implementation for the <Link> component for this test file ---
  const Link = (props: any) => {
    const { children, href, asChild, ...restProps } = props; // Include asChild if you use it
    // Render a simple TouchableOpacity or View that passes through props and href
    // Use a testID to find it in tests and data-href for debugging
    return React.createElement(
      TouchableOpacity, // Using TouchableOpacity might be closer to Link's behavior
      {
        ...restProps, // Spread other props like style, accessibilityLabel, onPress etc.
        'data-href': href, // Useful for debugging
        testID: props.testID || `LinkMock-${href}`, // Use href in the testID for uniqueness if testID is not provided
        // Note: If your component attaches an onPress to Link and you want to test that,
        // the fireEvent.press on this TouchableOpacity mock will trigger it.
      },
      children // Render the children inside the mock Link
    );
  };

  // Mock other expo-router exports if needed in this specific test file
  const useSegments = () => [];
  const useLocalSearchParams = () => ({});

  // --- Return all the mocked exports needed for this test file ---
  return {
    // Return the mock useRouter function (with attached mocks)
    useRouter,

    // Return the mock Link component
    Link,

    // Include other mocks needed in this specific test file
    useSegments,
    useLocalSearchParams,
    // ... other mocked exports
  };
});

test('displays chatList item correctly', async () => {
  const replyPreviewComponent = render(
    <ChatHeader
      chatPartner={undefined}
      setSearchString={(e) => {}}
      searchString=""
      isLoading={false}
    />
  );

  expect(replyPreviewComponent.toJSON()).toMatchSnapshot();
});
test('renders search input when search is active', () => {
  const { getByTestId, getByPlaceholderText } = render(
    <ChatHeader
      chatPartner={{
        username: 'TestUser',
        isActive: true,
        isLoggedIn: true,
        id: '123',
        isTyping: { isTyping: false },
        lastActive: new Date().getTime(),
      }}
      setSearchString={() => {}}
      searchString=""
      isLoading={false}
    />
  );

  const searchButton = getByTestId('search-icon');
  fireEvent.press(searchButton);

  expect(getByPlaceholderText('Search Chats')).toBeTruthy();
});

test('renders loading skeleton when isLoading is true', () => {
  const { getByTestId } = render(
    <ChatHeader chatPartner={undefined} setSearchString={() => {}} searchString="" isLoading />
  );

  expect(getByTestId('chat-header-skeleton')).toBeTruthy();
});

test('displays active status correctly when user is online', () => {
  const { getByText } = render(
    <ChatHeader
      chatPartner={{
        username: 'TestUser',
        isActive: true,
        isLoggedIn: true,
        id: '123',
        isTyping: { isTyping: false },
        lastActive: new Date().getTime(),
      }}
      setSearchString={() => {}}
      searchString=""
      isLoading={false}
    />
  );

  expect(getByText('Active now')).toBeTruthy();
});

test('displays offline status with last active time', () => {
  const lastActive = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  const { getByText } = render(
    <ChatHeader
      chatPartner={{
        username: 'TestUser',
        isActive: false,
        isLoggedIn: true,
        id: '123',
        isTyping: { isTyping: false },
        lastActive: new Date().getTime(),
      }}
      setSearchString={() => {}}
      searchString=""
      isLoading={false}
    />
  );

  expect(getByText(/Left Chatroom/)).toBeTruthy();
});

test('displays offline status when lastActive is not available', () => {
  const { getByText } = render(
    <ChatHeader
      chatPartner={{
        username: 'TestUser',
        isActive: false,
        isLoggedIn: true,
        id: '123',
        isTyping: { isTyping: false },
        lastActive: null,
      }}
      setSearchString={() => {}}
      searchString=""
      isLoading={false}
    />
  );

  expect(getByText('Offline')).toBeTruthy();
});

// test('calls router.back when back button is pressed', () => {
//   // const mockRouter = jest.spyOn(router, 'back');
//   const { getByTestId} = render(
//     <ChatHeader
//       chatPartner={{
//         username: 'TestUser',
//         isActive: true,
//         isLoggedIn: true,
//         id: '123',
//         isTyping: { isTyping: false },
//         lastActive: new Date().getTime(),
//       }}
//       setSearchString={() => {}}
//       searchString=""
//       isLoading={false}
//     />
//   );

//   const backButton = getByTestId('back-icon');
//   fireEvent.press(backButton);
// debug()
//   // expect(mockRouter).toHaveBeenCalled();
// });
