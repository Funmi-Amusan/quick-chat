import { render} from '@testing-library/react-native';

import ChatItem from '~/components/chats/chatslist/chatsItem/ChatItem';

test('displays chatList item correctly', async () => {
  const mockLastMessage = {
    content: 'Bye',
    senderId: 'Sender 1',
    timestamp: 11111111,
  };
  const replyPreviewComponent = render(
    <ChatItem id="1" partner="Partner" lastMessage={mockLastMessage} partnerId="1" updatedAt={0} />
  );

  expect(replyPreviewComponent.toJSON()).toMatchSnapshot();
});
