import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { Field } from '../src/ui';

test('password eye toggle reveals and hides the value without changing it', () => {
  let tree: renderer.ReactTestRenderer;
  const onChange = jest.fn();
  act(() => {
    tree = renderer.create(
      <Field
        title="Password"
        secureTextEntry
        value="clinic-secret"
        onChange={onChange}
      />,
    );
  });
  const input = () => tree!.root.findByType(TextInput);
  const toggle = () =>
    tree!.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    )[0];
  expect(input().props.secureTextEntry).toBe(true);
  expect(toggle().props.accessibilityLabel).toBe('Show password');
  act(() => toggle().props.onPress());
  expect(input().props.secureTextEntry).toBe(false);
  expect(input().props.value).toBe('clinic-secret');
  expect(toggle().props.accessibilityLabel).toBe('Hide password');
  act(() => toggle().props.onPress());
  expect(input().props.secureTextEntry).toBe(true);
  expect(onChange).not.toHaveBeenCalled();
  act(() => tree!.unmount());
});
