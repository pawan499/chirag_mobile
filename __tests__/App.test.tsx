import React from 'react';
import renderer, { act } from 'react-test-renderer';
import App from '../App';

test('launches the native login without requiring a backend connection', async () => {
  let tree: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<App />);
  });
  const output = JSON.stringify(tree!.toJSON());
  expect(output).toContain('Welcome back');
  expect(output).not.toContain('Connection settings');
  expect(output).toContain('Sign in');
  expect(output).not.toContain('API base URL');
  await act(async () => {
    tree!.unmount();
  });
});
