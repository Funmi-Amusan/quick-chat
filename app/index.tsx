import { Redirect } from 'expo-router';

import Onboarding from '~/components/authentication/onboarding/Onboarding';
import { auth } from '~/lib/firebase-config';

export default function Home() {
  const { currentUser } = auth;
  if (currentUser) {
    return <Redirect href="/(tabs)/chats" />;
  }
  return <Onboarding />;
}
