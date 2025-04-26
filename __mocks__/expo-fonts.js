// __mocks__/expo-font.js

// Mock the functions that @expo/vector-icons or your code might use
const mockExpoFont = {
  // Mock the useLoadFonts hook to immediately return loaded: true
  useLoadFonts: jest.fn(() => [true, null]),

  // Mock the loadAsync function to return a resolved promise
  loadAsync: jest.fn(() => Promise.resolve()),

  // Mock the isLoaded function to return true
  isLoaded: jest.fn(() => true),

  // If your code imports other specific things from expo-font, add them here
  // For example, if you import { FontDisplay } from 'expo-font', add:
  // FontDisplay: { READY: 'ready' }, // Or other necessary mock values
};

// Export the mocked functions/values
module.exports = mockExpoFont;

// If you use specific named imports like `import { isLoaded } from 'expo-font';`
// You might need named exports depending on your Babel/TS config and Jest setup.
// The above `module.exports` works well with `require('expo-font')` or default imports.
// For named imports like `import { isLoaded } from 'expo-font'`, you might need:
// export const useLoadFonts = mockExpoFont.useLoadFonts;
// export const loadAsync = mockExpoFont.loadAsync;
// export const isLoaded = mockExpoFont.isLoaded;
// export default mockExpoFont; // If needed
