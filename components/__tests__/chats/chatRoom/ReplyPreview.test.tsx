import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import ReplyPreview from '~/components/chats/chatRoom/ReplyPreview';
import { ReplyMessageInfo } from '~/lib/types';

test('displays ReplyPreview component correctly', async () => {
  const replyMessage: ReplyMessageInfo = {
    id: 'string',
    content: 'string',
    senderId: 'string',
    imageUrl: null,
  };

  const replyPreviewComponent = render(
    <ReplyPreview replyMessage={replyMessage} setReplyMessage={() => {}} />
  );

  expect(replyPreviewComponent.toJSON()).toMatchSnapshot();
});
