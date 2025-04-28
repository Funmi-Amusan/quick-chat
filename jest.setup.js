jest.mock('expo-font', () => {
  const module = {
    ...jest.requireActual('expo-font'),
    isLoaded: jest.fn(() => true),
  };
  return module;
});

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useTheme: () => ({
      dark: false,
      colors: {
        primary: 'blue',
        background: 'white',
        card: 'white',
        text: 'black',
        border: 'grey',
        notification: 'red',
      },
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  multiMerge: jest.fn(() => Promise.resolve()),
}));

jest.mock('firebase/database', () => {
  const mockGetDatabase = jest.fn(() => {
    const mockDatabase = {};
    return mockDatabase;
  });

  const mockRef = jest.fn((db, path) => {
    const mockReference = {
      key: path ? path.split('/').pop() : null,
      orderByChild: jest.fn((child) => {
        return mockQuery;
      }),
      equalTo: jest.fn((value) => {
        return mockQuery;
      }),
      limitToLast: jest.fn((limit) => {
        return mockQuery;
      }),
      get: jest.fn(() => {
        return Promise.resolve({
          exists: jest.fn(() => false),
          val: jest.fn(() => null),
          key: mockReference.key,
          forEach: jest.fn((callback) => {}),
        });
      }),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
      push: jest.fn(() => ({ key: 'mock-pushed-key', set: jest.fn(() => Promise.resolve()) })),
      onValue: jest.fn((callback) => {
        return jest.fn();
      }),
      off: jest.fn(),
    };
    return mockReference;
  });

  const mockQuery = {
    get: jest.fn(() => {
      return Promise.resolve({
        exists: jest.fn(() => false),
        val: jest.fn(() => null),
      });
    }),
    onValue: jest.fn((callback) => {
      return jest.fn();
    }),
    off: jest.fn(),
    once: jest.fn(() => {
      return Promise.resolve({
        exists: jest.fn(() => false),
        val: jest.fn(() => null),
      });
    }),
    orderByChild: jest.fn((child) => {
      return mockQuery;
    }),
    equalTo: jest.fn((value) => {
      return mockQuery;
    }),
    limitToLast: jest.fn((limit) => {
      return mockQuery;
    }),
    endBefore: jest.fn(() => {
      return mockQuery;
    }),
    startAfter: jest.fn(() => {
      return mockQuery;
    })
  };

  const mockServerTimestamp = jest.fn(() => {
    return { '.sv': 'timestamp' };
  });

  const mockOnDisconnect = jest.fn((ref) => {
    return {
      update: jest.fn(() => Promise.resolve()),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
    };
  });

  return {
    getDatabase: mockGetDatabase,
    ref: mockRef,
    set: jest.fn(() => Promise.resolve()),
    push: jest.fn(() => ({ key: 'mock-pushed-key', set: jest.fn(() => Promise.resolve()) })),
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    onValue: jest.fn((ref, callback) => {
      return jest.fn();
    }),
    query: jest.fn((ref) => {
      return mockQuery;
    }),
    serverTimestamp: mockServerTimestamp,
    onDisconnect: mockOnDisconnect,
    off: jest.fn(),
    orderByChild: jest.fn((child) => {
      return mockQuery;
    }),
    limitToLast: jest.fn((limit) => {
      return mockQuery;
    }),
    endBefore: jest.fn((value) => {
      return mockQuery;
    }),
    startAfter: jest.fn((value) => {
      return mockQuery;
    }),
    get: jest.fn((ref) => {
      return Promise.resolve({ exists: jest.fn(() => false), val: jest.fn(() => null) });
    }),
  };
});

jest.mock('firebase/auth', () => {
  const mockGetReactNativePersistence = jest.fn(() => {
    return { type: 'mockPersistence' };
  });

  const mockInitializeAuth = jest.fn(() => {
    const mockAuth = {
      signInWithEmailAndPassword: jest.fn(() =>
        Promise.resolve({ user: { uid: 'mock-uid', email: 'test@test.com' } })
      ),
      signOut: jest.fn(() => Promise.resolve()),
      onAuthStateChanged: jest.fn((auth, callback) => {
        return jest.fn();
      }),
      currentUser: null,
    };
    return mockAuth;
  });

  const mockGetAuth = jest.fn(() => {
    return {
      signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
      signOut: jest.fn(() => Promise.resolve()),
      onAuthStateChanged: jest.fn((auth, callback) => jest.fn()),
      currentUser: null,
    };
  });

  return {
    getReactNativePersistence: mockGetReactNativePersistence,
    initializeAuth: mockInitializeAuth,
    createUserWithEmailAndPassword:  jest.fn(),
    getAuth: mockGetAuth,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };
});

jest.mock('firebase/app', () => {
  const mockInitializeApp = jest.fn(() => {
    const mockApp = {
      name: 'mock-app',
      options: {},
    };
    return mockApp;
  });

  const mockGetApps = jest.fn(() => []);
  const mockGetApp = jest.fn((name) => {
    return mockInitializeApp();
  });

  return {
    initializeApp: mockInitializeApp,
    getApps: mockGetApps,
    getApp: mockGetApp,
  };
});
