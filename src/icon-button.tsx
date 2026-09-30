import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, useWindowDimensions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AppPressable } from './pressable';
import { colors } from './ui';

export function IconButton({
  title,
  icon: Icon,
  onPress,
  danger = false,
  selected = false,
  tab = false,
}: {
  title: string;
  icon: LucideIcon;
  onPress: () => void;
  danger?: boolean;
  selected?: boolean;
  tab?: boolean;
}) {
  const anchor = useRef<View>(null);
  const { width } = useWindowDimensions();
  const [tooltipLeft, setTooltipLeft] = useState(-8);
  const showTooltip = () => {
    anchor.current?.measureInWindow(x => {
      setTooltipLeft(Math.max(8, Math.min(x - 34, width - 120)) - x);
    });
    setTooltip(true);
  };
  const [tooltip, setTooltip] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const longPressed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const animate = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 3,
    }).start();
  return (
    <View
      ref={anchor}
      collapsable={false}
      style={{ zIndex: tooltip ? 20 : 0, alignSelf: 'flex-start' }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <AppPressable
          accessibilityRole={tab ? 'tab' : 'button'}
          accessibilityLabel={title}
          accessibilityHint="Long press to show the action name"
          accessibilityState={tab ? { selected } : undefined}
          onHoverIn={() => {
            setHovered(true);
            showTooltip();
            animate(1.04);
          }}
          onHoverOut={() => {
            setHovered(false);
            setTooltip(false);
            animate(1);
          }}
          onFocus={showTooltip}
          onBlur={() => setTooltip(false)}
          onPressIn={() => {
            longPressed.current = false;
            animate(0.94);
          }}
          onPressOut={() => animate(1)}
          delayLongPress={350}
          onLongPress={() => {
            longPressed.current = true;
            showTooltip();
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setTooltip(false), 1800);
          }}
          onPress={() => {
            if (longPressed.current) return;
            setTooltip(false);
            onPress();
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: danger
              ? hovered
                ? '#FFE0DB'
                : '#FFF3F0'
              : selected
              ? colors.primary
              : hovered
              ? '#D8EFF0'
              : '#F0F7F8',
            borderColor: danger
              ? '#F4D4CE'
              : selected || hovered
              ? colors.primary
              : '#DEEBED',
          }}
        >
          <Icon
            size={20}
            strokeWidth={1.8}
            color={danger ? colors.red : selected ? '#fff' : colors.primary}
          />
        </AppPressable>
      </Animated.View>
      {tooltip && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 50,
            left: tooltipLeft,
            width: 112,
            backgroundColor: colors.ink,
            paddingHorizontal: 9,
            paddingVertical: 7,
            borderRadius: 8,
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}
