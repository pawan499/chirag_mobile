import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
} from 'react-native';
import type { ScrollViewProps } from 'react-native';

const FocusContext = createContext<
  (input: TextInput | null, isFocused?: boolean) => void
>(() => {});
export const useKeyboardFocus = () => useContext(FocusContext);

// Used by forms and list headers, including screens in native Modal windows.
export const KeyboardScrollView = forwardRef<ScrollView, ScrollViewProps>(
  function KeyboardScrollContainer(
    {
      children,
      onLayout,
      onScroll,
      onContentSizeChange,
      contentContainerStyle,
      ...props
    },
    forwardedRef,
  ) {
    const [keyboardPadding, setKeyboardPadding] = useState(0);
    const mounted = useRef(true);
    const scroll = useRef<ScrollView | null>(null);
    const focused = useRef<TextInput | null>(null);
    const offset = useRef(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reveal = useCallback(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const input = focused.current;
        if (!Keyboard.isVisible() || !mounted.current) return;
        scroll.current
          ?.getNativeScrollRef()
          ?.measureInWindow((_x, top, _width, height) => {
            if (!mounted.current || !Keyboard.isVisible()) return;
            // Android measureInWindow excludes the status bar, whereas the
            // keyboard event reports screen coordinates.
            const keyboardTop =
              (Keyboard.metrics()?.screenY ?? Infinity) -
              (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);
            // Android may overlay the window instead of resizing it. Supply
            // the missing scroll range; adjustResize already supplies it when
            // the measured viewport ends above the keyboard.
            if (Platform.OS === 'android') {
              setKeyboardPadding(Math.max(0, top + height - keyboardTop));
            }
            if (!input) return;
            input.measureInWindow((_ix, inputTop, _iw, inputHeight) => {
              if (
                !mounted.current ||
                !Keyboard.isVisible() ||
                focused.current !== input
              )
                return;
              const bottom = Math.min(top + height, keyboardTop) - 16;
              const delta =
                inputTop < top + 16
                  ? inputTop - top - 16
                  : Math.max(
                      0,
                      inputTop +
                        Math.min(inputHeight, bottom - top - 16) -
                        bottom,
                    );
              if (delta)
                scroll.current?.scrollTo({
                  y: Math.max(0, offset.current + delta),
                  animated: true,
                });
            });
          });
      }, 100);
    }, []);
    useEffect(() => {
      mounted.current = true;
      const hide = Keyboard.addListener('keyboardDidHide', () => {
        if (timer.current) clearTimeout(timer.current);
        setKeyboardPadding(0);
      });
      const show = Keyboard.addListener('keyboardDidShow', reveal);
      const change = Keyboard.addListener('keyboardDidChangeFrame', reveal);
      return () => {
        mounted.current = false;
        hide.remove();
        show.remove();
        change.remove();
        if (timer.current) clearTimeout(timer.current);
      };
    }, [reveal]);
    const focus = useCallback(
      (input: TextInput | null, isFocused = true) => {
        // A previous field can blur after the next field has already focused.
        if (!isFocused) {
          if (focused.current === input) focused.current = null;
          return;
        }
        focused.current = input;
        if (input) reveal();
      },
      [reveal],
    );
    const setScrollRef = useCallback(
      (node: ScrollView | null) => {
        scroll.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    return (
      <FocusContext.Provider value={focus}>
        <ScrollView
          {...props}
          ref={setScrollRef}
          contentContainerStyle={[
            contentContainerStyle,
            keyboardPadding > 0 && {
              paddingBottom:
                keyboardPadding +
                Number(
                  StyleSheet.flatten(contentContainerStyle)?.paddingBottom ??
                    StyleSheet.flatten(contentContainerStyle)
                      ?.paddingVertical ??
                    StyleSheet.flatten(contentContainerStyle)?.padding ??
                    0,
                ),
            },
          ]}
          onContentSizeChange={(width, height) => {
            onContentSizeChange?.(width, height);
            // Retry after the extra bottom space has actually been laid out.
            reveal();
          }}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          // Keep native inputs attached when the form scrolls past them.
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          onScroll={event => {
            offset.current = event.nativeEvent.contentOffset.y;
            onScroll?.(event);
          }}
          onLayout={event => {
            onLayout?.(event);
            reveal();
          }}
        >
          {children}
        </ScrollView>
      </FocusContext.Provider>
    );
  },
);
