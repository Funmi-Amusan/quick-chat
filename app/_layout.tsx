import { SessionProvider } from 'context/authContext';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { persistor, store, useAppSelector } from '../store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import '../global.css';
import { NotificationProvider } from '~/context/NotificationContext';

export default function Root() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NotificationProvider>
          <SessionProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Slot />
            </GestureHandlerRootView>
          </SessionProvider>
        </NotificationProvider>
      </PersistGate>
    </Provider>
  );
}
