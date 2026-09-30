import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Modal, TextInput } from 'react-native';
import { Choice, Field, MenuItem } from '../src/ui';

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

test('disabled date fields cannot open the calendar', () => {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <Field
        title="Payment date (YYYY-MM-DD)"
        value="2026-09-30"
        onChange={jest.fn()}
        editable={false}
      />,
    );
  });
  const calendarButton = tree!.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Choose Payment date (YYYY-MM-DD)' &&
      typeof node.props.onPress === 'function',
  )[0];
  expect(calendarButton.props.disabled).toBe(true);
  expect(tree!.root.findByType(TextInput).props.placeholder).toBe('YYYY-MM-DD');
  act(() => tree!.unmount());
});

test('selection sheet returns the stored option value and closes after choosing', () => {
  let tree: renderer.ReactTestRenderer;
  const onChange = jest.fn();
  act(() => {
    tree = renderer.create(
      <Choice
        title="Payment method"
        value="UPI"
        options={[
          { value: 'UPI', name: 'UPI' },
          { value: 'CASH', name: 'Cash' },
        ]}
        onChange={onChange}
      />,
    );
  });
  const trigger = tree!.root.findAll(
    node =>
      node.props.accessibilityLabel === 'Payment method: UPI' &&
      typeof node.props.onPress === 'function',
  )[0];
  act(() => trigger.props.onPress());
  expect(tree!.root.findByType(Modal).props.visible).toBe(true);
  const cash = tree!.root
    .findAllByType(MenuItem)
    .find(node => node.props.title === 'Cash')!;
  act(() => cash.props.onPress());
  expect(onChange).toHaveBeenCalledWith('CASH');
  expect(tree!.root.findByType(Modal).props.visible).toBe(false);
  act(() => tree!.unmount());
});
