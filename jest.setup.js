// jest.setup.js

// Mock expo-font
jest.mock("expo-font", () => {
    const module = {
      ...jest.requireActual("expo-font"),
      isLoaded: jest.fn(() => true), // Mock isLoaded to always return true
      // You might need to mock other functions like loadAsync if your code uses them
      // loadAsync: jest.fn(() => Promise.resolve()),
    };
    return module;
  });
  
  // You can add other global test setups here later if needed