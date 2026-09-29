import React from 'react';
import { Pressable } from 'react-native';
import type { PressableProps } from 'react-native';

// One touch-feedback treatment for buttons, icon controls and navigation.
export function AppPressable({ style, disabled, ...props }: PressableProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={state => [
        typeof style === 'function' ? style(state) : style,
        { opacity: disabled ? 0.45 : state.pressed ? 0.78 : 1 },
      ]}
    />
  );
}
