import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PopupProvider, usePopup } from '../src/popup';

test('custom confirmation cancels safely and runs a destructive action only once', () => {
  let show: ReturnType<typeof usePopup>;
  let tree: renderer.ReactTestRenderer;
  const remove = jest.fn();
  function Harness() {
    show = usePopup();
    return null;
  }
  act(() => {
    tree = renderer.create(
      <SafeAreaProvider>
        <PopupProvider>
          <Harness />
        </PopupProvider>
      </SafeAreaProvider>,
    );
  });
  const open = () =>
    act(() =>
      show('Delete patient?', 'History will be retained.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: remove },
      ]),
    );
  const button = (label: string) =>
    tree!.root.findAll(
      node =>
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function',
    )[0];
  open();
  expect(remove).not.toHaveBeenCalled();
  act(() => button('Cancel').props.onPress());
  expect(remove).not.toHaveBeenCalled();
  expect(tree!.root.findByType(Modal).props.visible).toBe(false);
  open();
  const confirm = button('Delete').props.onPress;
  act(() => {
    confirm();
    confirm();
  });
  expect(remove).toHaveBeenCalledTimes(1);
  open();
  act(() => tree!.root.findByType(Modal).props.onRequestClose());
  expect(remove).toHaveBeenCalledTimes(1);
  expect(tree!.root.findByType(Modal).props.visible).toBe(false);
  act(() => tree!.unmount());
});
