import { AppPressable as Pressable } from './pressable';
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { colors, styles } from './ui';
type Action = {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void;
};
type Show = (title: string, message?: string, actions?: Action[]) => void;
type Popup = { title: string; message?: string; actions: Action[] };
const PopupContext = createContext<Show | null>(null);
export function usePopup() {
  const show = useContext(PopupContext);
  if (!show) throw new Error('PopupProvider is required');
  return show;
}
export function usePopupController(inline = false) {
  const [current, setCurrent] = useState<Popup | null>(null);
  const active = useRef(false);
  const show = useCallback<Show>((title, message, actions) => {
    if (active.current) return;
    active.current = true;
    setCurrent({
      title,
      message,
      actions: actions?.length ? actions : [{ text: 'OK' }],
    });
  }, []);
  const finish = (action?: Action) => {
    if (!active.current) return;
    active.current = false;
    setCurrent(null);
    action?.onPress?.();
  };
  const cancel = () =>
    finish(current?.actions.find(action => action.style === 'cancel'));
  const danger = current?.actions.some(
    action => action.style === 'destructive',
  );
  const Icon = danger ? TriangleAlert : ShieldCheck;
  const content = current && (
    <SafeAreaView
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: '#10253699',
          justifyContent: 'center',
          padding: 24,
          zIndex: 100,
        },
      ]}
      accessibilityViewIsModal
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          padding: 24,
          gap: 16,
          width: '100%',
          maxWidth: 440,
          maxHeight: '90%',
          alignSelf: 'center',
          elevation: 12,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: danger ? '#FFF0ED' : colors.pale,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            size={28}
            strokeWidth={1.8}
            color={danger ? colors.red : colors.primary}
          />
        </View>
        <Text
          accessibilityRole="header"
          style={[styles.heading, { fontSize: 22 }]}
        >
          {current.title}
        </Text>
        {!!current.message && (
          <ScrollView style={{ flexShrink: 1 }}>
            <Text style={[styles.text, { color: colors.muted }]}>
              {current.message}
            </Text>
          </ScrollView>
        )}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            paddingTop: 8,
          }}
        >
          {current.actions.map((action, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={action.text}
              onPress={() => finish(action)}
              style={({ pressed }) => ({
                flexGrow: 1,
                flexBasis: 110,
                minHeight: 50,
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  action.style === 'cancel'
                    ? '#F0F4F8'
                    : action.style === 'destructive'
                    ? colors.red
                    : colors.primary,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text
                style={{
                  fontWeight: '700',
                  fontSize: 14,
                  textAlign: 'center',
                  color: action.style === 'cancel' ? colors.ink : '#FFFFFF',
                }}
              >
                {action.text}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
  const popup = inline ? (
    content
  ) : (
    <Modal
      transparent
      visible={!!current}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancel}
    >
      {content}
    </Modal>
  );
  return { show, popup, cancel, isOpen: !!current };
}
export function PopupProvider({ children }: { children: React.ReactNode }) {
  const { show, popup } = usePopupController();
  return (
    <PopupContext.Provider value={show}>
      {children}
      {popup}
    </PopupContext.Provider>
  );
}
