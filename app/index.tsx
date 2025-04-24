import { Redirect } from 'expo-router';

import Onboarding from '~/screens/OnboardingScreen';
import { auth } from '~/lib/firebase-config';

export default function Home() {
  const { currentUser } = auth;
  if (currentUser) {
    return <Redirect href="/(tabs)/chats" />;
  }
  return <Onboarding />;
}
