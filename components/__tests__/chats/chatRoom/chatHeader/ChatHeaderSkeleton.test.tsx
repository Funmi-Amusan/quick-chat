import { render } from '@testing-library/react-native';

import ChatHeaderSkeleton from '~/components/chats/chatRoom/chatHeader/ChatHeaderSkeleton';

test('displays chatList item correctly', async () => {
  const replyPreviewComponent = render(<ChatHeaderSkeleton />);

  expect(replyPreviewComponent.toJSON()).toMatchSnapshot();
});
