module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Layout-specific native styles and explicit fire-and-forget async handlers.
    'react-native/no-inline-styles': 'off',
    'no-void': 'off',
    'react-native/no-raw-text': ['error', {skip: ['Title', 'Heading']}],
  },
};
