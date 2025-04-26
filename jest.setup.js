jest.mock('expo-font', () => {
  const module = {
    ...jest.requireActual('expo-font'),
    isLoaded: jest.fn(() => true), // Mock isLoaded to always return true
    // You might need to mock other functions like loadAsync if your code uses them
    // loadAsync: jest.fn(() => Promise.resolve()),
  };
  return module;
});

jest.mock('@react-navigation/native', () => {
  // --- Step 1: Get the actual exports from @react-navigation/native ---
  // This allows expo-router (and other libs) to import the functions they need
  const actualNav = jest.requireActual('@react-navigation/native');

  // --- Step 2: Return an object that spreads the actual exports ---
  return {
    ...actualNav, // <-- This is the crucial part: include all actual exports

    // --- Step 3: Override specific hooks or components you need to mock ---
    // Mock the useTheme hook to return a simple theme object
    useTheme: () => ({
      dark: false, // Or true
      colors: {
        primary: 'blue',
        background: 'white',
        card: 'white',
        text: 'black',
        border: 'grey',
        notification: 'red',
        // Add any other colors your component specifically uses
      },
    }),

    // If your component *directly* uses other @react-navigation/native hooks
    // (NOT hooks from expo-router like useRouter), you can override them here too.
    // If you only use hooks from 'expo-router', you likely don't need these overrides here.
    // useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    // useRoute: () => ({ params: {} }),

    // If your test renders actual React Navigation components, you might need to mock them here
    // (but typically mocking hooks is enough for unit tests)
    // NavigationContainer: ({ children }) => children,
    // ThemeProvider: ({ children }) => children,
  };
});

jest.mock('@firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  // Mock the methods that getReactNativePersistence likely uses internally
  // Returning resolved promises with null/empty values is usually sufficient
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
  console.log('Mocking firebase/database'); // Optional log to confirm mock is loaded

  // Mock the top-level getDatabase function
  const mockGetDatabase = jest.fn(() => {
    console.log('Mocked getDatabase called'); // Optional log
    // Return a mock database instance. In RTDB, the instance itself is rarely used directly
    // beyond getting refs, so this can be a simple object.
    const mockDatabase = {
      // Add any methods your code calls directly on the database instance if any
      // getApp: jest.fn(() => ({ name: 'mock-app' })), // Example: If you call db.getApp()
    };
    return mockDatabase;
  });

  // Mock the ref function - used to create database references
  const mockRef = jest.fn((db, path) => {
    console.log('Mocked ref called with path:', path); // Optional log
    // Return a mock database reference object
    const mockReference = {
      key: path ? path.split('/').pop() : null, // Simulate the 'key' property of a ref
      // --- Add mock methods available on a Database Reference ---
      // These need to return mock values or other mock objects (like query objects)

      // Mock methods used to build queries (chainable)
      orderByChild: jest.fn((child) => {
        console.log('Mocked orderByChild called', child);
        return mockQuery;
      }), // Returns a mock Query
      equalTo: jest.fn((value) => {
        console.log('Mocked equalTo called', value);
        return mockQuery;
      }), // Returns a mock Query
      limitToLast: jest.fn((limit) => {
        console.log('Mocked limitToLast called', limit);
        return mockQuery;
      }), // Returns a mock Query
      // Add other query building methods your code uses (orderByKey, orderByValue, startAt, endAt, limitToFirst)

      // Mock methods to interact with data directly on the ref
      get: jest.fn(() => {
        console.log('Mocked ref.get called');
        // Simulate returning a snapshot. You'll control the snapshot's data in tests.
        return Promise.resolve({
          exists: jest.fn(() => false), // Default to no data
          val: jest.fn(() => null), // Default value is null
          key: mockReference.key,
          forEach: jest.fn((callback) => {
            /* Simulate iteration if data exists */
          }),
          // Add other snapshot methods like hasChild, numChildren
        });
      }),
      set: jest.fn(() => Promise.resolve()), // Mock setting data
      update: jest.fn(() => Promise.resolve()), // Mock updating data
      remove: jest.fn(() => Promise.resolve()), // Mock removing data
      push: jest.fn(() => ({ key: 'mock-pushed-key', set: jest.fn(() => Promise.resolve()) })), // Mock pushing data - push returns a new ref

      // Mock methods for data listeners
      onValue: jest.fn((callback) => {
        console.log('Mocked ref.onValue attached');
        // You will need to control *when* the callback is called in your individual tests
        // to simulate data changes.
        return jest.fn(); // Return a mock unsubscribe function
      }),
      off: jest.fn(), // Mock detaching listeners

      // Add any other methods your code uses on refs
    };
    return mockReference; // Return the mock reference object
  });

  // Mock methods available on Query objects (returned by orderBy/equalTo/limit etc.)
  // These often have similar methods to refs (get, onValue, once)
  const mockQuery = {
    get: jest.fn(() => {
      console.log('Mocked query.get called');
      return Promise.resolve({
        exists: jest.fn(() => false),
        val: jest.fn(() => null),
        // ... snapshot methods
      });
    }),
    onValue: jest.fn((callback) => {
      console.log('Mocked query.onValue attached');
      // Control this callback in tests
      return jest.fn(); // Return mock unsubscribe
    }),
    off: jest.fn(),
    // Add other query methods your code uses
    once: jest.fn(() => {
      console.log('Mocked query.once called');
      return Promise.resolve({
        exists: jest.fn(() => false),
        val: jest.fn(() => null),
        // ... snapshot methods
      });
    }),
    // If you chain query methods like .orderByChild().equalTo(), the mock query needs to return itself or another mock query
    orderByChild: jest.fn((child) => {
      console.log('Mocked query.orderByChild called', child);
      return mockQuery;
    }),
    equalTo: jest.fn((value) => {
      console.log('Mocked query.equalTo called', value);
      return mockQuery;
    }),
    limitToLast: jest.fn((limit) => {
      console.log('Mocked query.limitToLast called', limit);
      return mockQuery;
    }),
  };

  // --- Return all the exports that your code imports from 'firebase/database' ---
  // You MUST include ALL functions/exports that your firebase-service.ts or other files import from 'firebase/database'
  return {
    // Functions you call directly:
    getDatabase: mockGetDatabase,
    ref: mockRef,
    // Add other top-level functions like set, push, update, remove, onValue, off, get
    set: jest.fn(() => Promise.resolve()),
    push: jest.fn(() => ({ key: 'mock-pushed-key', set: jest.fn(() => Promise.resolve()) })), // push returns a ref
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    onValue: jest.fn((ref, callback) => {
      console.log('Mocked top-level onValue called');
      return jest.fn();
    }),
    off: jest.fn(),
    get: jest.fn((ref) => {
      console.log('Mocked top-level get called');
      return Promise.resolve({ exists: jest.fn(() => false), val: jest.fn(() => null) });
    }),
    // If you use the top-level query function:
    // query: jest.fn((ref, ...queryConstraints) => mockQuery),

    // If you import query constraints directly (less common for RTDB web/RN SDK):
    // orderByChild: jest.fn((child) => ({ /* constraint object */ })),
    // equalTo: jest.fn((value) => ({ /* constraint object */ })),
    // limitToLast: jest.fn((limit) => ({ /* constraint object */ })),

    // Add any other exports your code imports from 'firebase/database'
  };
});

jest.mock('firebase/auth', () => {
  // Create mock functions for the specific auth exports/methods your code uses
  const mockGetReactNativePersistence = jest.fn(() => {
    // This function's return value is used internally by Firebase,
    // so a simple mock that doesn't throw is often enough.
    console.log('Mocked getReactNativePersistence called'); // Optional log
    return { type: 'mockPersistence' }; // Return a dummy object
  });

  const mockInitializeAuth = jest.fn(() => {
    // Mock initializeAuth to return a dummy auth object
    console.log('Mocked initializeAuth called'); // Optional log
    const mockAuth = {
      // Add mock implementations for auth methods your components use
      signInWithEmailAndPassword: jest.fn(() =>
        Promise.resolve({ user: { uid: 'mock-uid', email: 'test@test.com' } })
      ),
      signOut: jest.fn(() => Promise.resolve()),
      // Mock onAuthStateChanged - needs care depending on test scenarios
      onAuthStateChanged: jest.fn((auth, callback) => {
        // In tests, you often manually call this callback to simulate state changes
        // callback(null); // Example: Simulate initial logged out state
        // callback({ uid: 'mock-uid', email: 'test@test.com' }); // Example: Simulate logged in state
        // Return a mock unsubscribe function
        return jest.fn();
      }),
      // Mock currentUser property
      currentUser: null, // Default state, update in tests if needed

      // Add other auth methods/properties your code uses (createUserWithEmailAndPassword, sendPasswordResetEmail, etc.)
    };
    return mockAuth;
  });

  // Add a mock for getAuth if you use it directly somewhere else
  const mockGetAuth = jest.fn(() => {
    console.log('Mocked getAuth called'); // Optional log
    // Return the same dummy auth object created by initializeAuth, or a similar one
    return {
      signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
      signOut: jest.fn(() => Promise.resolve()),
      onAuthStateChanged: jest.fn((auth, callback) => jest.fn()),
      currentUser: null,
      // ... other auth methods
    };
  });

  // Return all the exports that your code imports from 'firebase/auth'
  return {
    // Export the functions used in your firebase-config.ts
    getReactNativePersistence: mockGetReactNativePersistence,
    initializeAuth: mockInitializeAuth,

    // Export other functions/hooks your components import directly
    getAuth: mockGetAuth,
    signInWithEmailAndPassword: jest.fn(), // Export the fns again for direct imports if needed
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    // ... add other exports
    // Mock error codes if you handle them:
    // AuthErrorCode: { EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use' },
  };
});

jest.mock('firebase/app', () => {
  const mockInitializeApp = jest.fn(() => {
    // Mock initializeApp to return a dummy app object
    console.log('Mocked initializeApp called'); // Optional log
    const mockApp = {
      name: 'mock-app',
      options: {},
      // Add other app properties/methods if your code uses them
      // delete: jest.fn(() => Promise.resolve()),
    };
    return mockApp;
  });

  // Add a mock for getApps if you use it
  const mockGetApps = jest.fn(() => []); // Default to no apps initialized

  // Add a mock for getApp if you use it
  const mockGetApp = jest.fn((name) => {
    console.log('Mocked getApp called', name); // Optional log
    // Return the mock app object, or throw if app not found, depending on test needs
    return mockInitializeApp(); // Return the dummy app
  });

  // Return all the exports that your code imports from 'firebase/app'
  return {
    initializeApp: mockInitializeApp,
    getApps: mockGetApps,
    getApp: mockGetApp,
    // Add other exports if your code imports them directly from 'firebase/app'
    // deleteApp: jest.fn(),
  };
});


jest.mock('expo-router', () => {
  const actualExpoRouter = jest.requireActual('expo-router');
  return {
    ...actualExpoRouter,
    useRouter: () => ({
      back: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
    }),
  };
});

