import { render } from '@testing-library/react-native';

import ChatHeaderSkeleton from '~/components/chats/chatroom/chatHeader/ChatHeaderSkeleton';

test('displays chatList item correctly', async () => {
  const replyPreviewComponent = render(<ChatHeaderSkeleton />);

  expect(replyPreviewComponent.toJSON()).toMatchSnapshot();
});
