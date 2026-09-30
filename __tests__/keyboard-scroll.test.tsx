import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Keyboard, ScrollView, StyleSheet, TextInput } from 'react-native';
import { KeyboardScrollView, useKeyboardFocus } from '../src/keyboard-scroll';

const mockScrollTo = jest.fn();
let mockViewportHeight = 700;
const mockNativeScroll = {
  measureInWindow: (callback: Function) =>
    callback(0, 0, 360, mockViewportHeight),
};
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const ReactModule = require('react');
  return {
    Keyboard: RN.Keyboard,
    StyleSheet: RN.StyleSheet,
    TextInput: RN.TextInput,
    Platform: { ...RN.Platform, OS: 'android' },
    StatusBar: { ...RN.StatusBar, currentHeight: 24 },
    ScrollView: ReactModule.forwardRef((props: any, ref: any) => {
      ReactModule.useImperativeHandle(ref, () => ({
        getNativeScrollRef: () => mockNativeScroll,
        scrollTo: mockScrollTo,
      }));
      return ReactModule.createElement(RN.View, props, props.children);
    }),
  };
});

let focus: ReturnType<typeof useKeyboardFocus>;
function InputHarness() {
  focus = useKeyboardFocus();
  return null;
}
const inputAt = (y: number) =>
  ({
    measureInWindow: (callback: Function) => callback(0, y, 300, 54),
  } as unknown as TextInput);

let tree: renderer.ReactTestRenderer;
let visible = true;
const listeners: Record<string, Function> = {};
beforeEach(() => {
  jest.useFakeTimers();
  mockScrollTo.mockClear();
  mockViewportHeight = 700;
  visible = true;
  jest.spyOn(Keyboard, 'isVisible').mockImplementation(() => visible);
  jest.spyOn(Keyboard, 'metrics').mockImplementation(() =>
    visible
      ? {
          screenX: 0,
          screenY: 500,
          width: 360,
          height: 300,
        }
      : undefined,
  );
  const addListener = Keyboard.addListener.bind(Keyboard);
  jest.spyOn(Keyboard, 'addListener').mockImplementation((event, callback) => {
    listeners[event] = callback;
    return addListener(event, callback);
  });
  act(() => {
    tree = renderer.create(
      <KeyboardScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <InputHarness />
      </KeyboardScrollView>,
    );
  });
});
afterEach(() => {
  act(() => tree.unmount());
  jest.restoreAllMocks();
  jest.useRealTimers();
});
const flush = () => act(() => jest.advanceTimersByTime(100));
const padding = () =>
  StyleSheet.flatten(
    tree.root.findByType(ScrollView).props.contentContainerStyle,
  ).paddingBottom;

test('overlay keyboard gets scroll space and screen coordinates are adjusted for the status bar', () => {
  act(() => focus(inputAt(450)));
  flush();
  expect(padding()).toBe(264); // 700 - (500 - 24) + existing 40
  expect(mockScrollTo).toHaveBeenLastCalledWith({ y: 44, animated: true });
  mockScrollTo.mockClear();
  act(() =>
    tree.root.findByType(ScrollView).props.onContentSizeChange(360, 1000),
  );
  flush();
  expect(mockScrollTo).toHaveBeenCalled();
});

test('already resized Android viewport does not get a second keyboard inset', () => {
  mockViewportHeight = 476;
  act(() => focus(inputAt(450)));
  flush();
  expect(padding()).toBe(40);
  expect(mockScrollTo).toHaveBeenLastCalledWith({ y: 44, animated: true });
});

test('changing focus with keyboard open reveals the new field and leaves visible fields alone', () => {
  act(() => focus(inputAt(100)));
  flush();
  expect(mockScrollTo).not.toHaveBeenCalled();
  act(() => focus(inputAt(600)));
  flush();
  expect(mockScrollTo).toHaveBeenLastCalledWith({ y: 194, animated: true });
});

test('keyboard dismissal removes extra space and cancels pending scrolling', () => {
  act(() => focus(inputAt(450)));
  flush();
  mockScrollTo.mockClear();
  act(() => {
    focus(inputAt(600));
    visible = false;
    listeners.keyboardDidHide();
  });
  flush();
  expect(padding()).toBe(40);
  expect(mockScrollTo).not.toHaveBeenCalled();
});

test('late blur from the old field does not cancel revealing the next field', () => {
  const previous = inputAt(100);
  const next = inputAt(600);
  act(() => focus(previous));
  flush();
  act(() => {
    focus(next);
    focus(previous, false);
  });
  flush();
  expect(mockScrollTo).toHaveBeenLastCalledWith({ y: 194, animated: true });
  expect(padding()).toBe(264);
});

test('taps and dragging preserve the keyboard and scrolling keeps native inputs attached', () => {
  const props = tree.root.findByType(ScrollView).props;
  expect(props.keyboardShouldPersistTaps).toBe('always');
  expect(props.keyboardDismissMode).toBe('none');
  expect(props.removeClippedSubviews).toBe(false);
});
