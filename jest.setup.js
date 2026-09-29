/* eslint-env jest */
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(true),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly'},
}));
jest.mock('react-native-print', () => ({print: jest.fn().mockResolvedValue(undefined)}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
