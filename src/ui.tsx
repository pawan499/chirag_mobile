import React, { useState } from 'react';
import {
  House,
  UsersRound,
  Glasses,
  Wallet,
  LayoutGrid,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Search,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Check,
  SlidersHorizontal,
  Pill,
  ClipboardList,
  ChartNoAxesCombined,
  Circle,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { label, today, validateDate } from './domain';
export const colors = {
  ink: '#172B3A',
  muted: '#647887',
  primary: '#087F8C',
  pale: '#EAF6F7',
  bg: '#F4F7FB',
  line: '#E4EBF1',
  red: '#B94040',
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#163B50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.7,
  },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink },
  text: { fontSize: 15, color: colors.ink, lineHeight: 23 },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  field: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 16,
  },
  button: {
    maxWidth: '100%',
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flexShrink: 1,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.pale,
  },
  error: {
    color: colors.red,
    backgroundColor: '#FFF0ED',
    padding: 14,
    borderRadius: 12,
    lineHeight: 21,
  },
});
export function Title({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text accessibilityRole="header" style={styles.title}>
        {children}
      </Text>
      {sub && <Text style={styles.muted}>{sub}</Text>}
    </View>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  secondary,
  danger,
  disabled,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && { backgroundColor: colors.pale },
        danger && { backgroundColor: '#FFF0ED' },
        {
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && { color: colors.primary },
          danger && { color: colors.red },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  title,
  value,
  onChange,
  numeric,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...props
}: {
  title: string;
  value?: any;
  onChange: (value: string) => void;
  numeric?: boolean;
} & Omit<TextInputProps, 'onChange' | 'value'>) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const dateInput = title.includes('YYYY-MM-DD');
  const LeadingIcon = secureTextEntry
    ? LockKeyhole
    : props.keyboardType === 'email-address'
    ? Mail
    : /search/i.test(title)
    ? Search
    : undefined;
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.muted, { fontWeight: '600', color: colors.ink }]}>
        {title}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: focused ? colors.primary : colors.line,
          borderRadius: 15,
          backgroundColor: focused ? '#FFFFFF' : '#F8FAFC',
        }}
      >
        {LeadingIcon && (
          <View style={{ paddingLeft: 14 }}>
            <LeadingIcon
              size={19}
              color={focused ? colors.primary : colors.muted}
              strokeWidth={1.8}
            />
          </View>
        )}
        <TextInput
          {...props}
          accessibilityLabel={title}
          placeholderTextColor="#94A3B1"
          style={[
            styles.field,
            {
              flex: 1,
              minWidth: 0,
              borderWidth: 0,
              backgroundColor: 'transparent',
            },
            props.multiline && { minHeight: 100, textAlignVertical: 'top' },
            style,
          ]}
          value={value == null ? '' : String(value)}
          onChangeText={onChange}
          keyboardType={
            numeric
              ? 'numbers-and-punctuation'
              : props.keyboardType || 'default'
          }
          secureTextEntry={!!secureTextEntry && !revealed}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            accessibilityState={{ checked: revealed }}
            onPress={() => setRevealed(v => !v)}
            hitSlop={4}
            style={{
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {revealed ? (
              <EyeOff size={21} color={colors.muted} />
            ) : (
              <Eye size={21} color={colors.muted} />
            )}
          </Pressable>
        )}
        {dateInput && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Choose ${title}`}
            onPress={() => setCalendarOpen(true)}
            style={{
              minWidth: 48,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CalendarDays size={21} color={colors.primary} />
          </Pressable>
        )}
      </View>
      {dateInput && (
        <Calendar
          visible={calendarOpen}
          value={String(value || '')}
          onClose={() => setCalendarOpen(false)}
          onSelect={v => {
            onChange(v);
            setCalendarOpen(false);
          }}
        />
      )}
    </View>
  );
}
function Calendar({
  visible,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (v: string) => void;
}) {
  const [month, setMonth] = useState(
    (validateDate(value) ? value : today()).slice(0, 7),
  );
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(year, monthNumber - 1, 1).getDay();
  const count = new Date(year, monthNumber, 0).getDate();
  const shift = (delta: number) => {
    const d = new Date(year, monthNumber - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#17363088',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Card>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Button secondary title="‹" onPress={() => shift(-1)} />
            <Heading>
              {new Date(year, monthNumber - 1, 1).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              })}
            </Heading>
            <Button secondary title="›" onPress={() => shift(1)} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text
                key={i}
                style={[
                  styles.muted,
                  { width: '14.2857%', textAlign: 'center' },
                ]}
              >
                {d}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: first + count }, (_, i) => {
              const day = i - first + 1;
              const key = `${month}-${String(day).padStart(2, '0')}`;
              return day < 1 ? (
                <View key={i} style={{ width: '14.2857%' }} />
              ) : (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={key}
                  accessibilityState={{ selected: key === value }}
                  onPress={() => onSelect(key)}
                  style={{
                    width: '14.2857%',
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 12,
                    backgroundColor:
                      key === value ? colors.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color: key === value ? '#fff' : colors.ink,
                      fontSize: 16,
                    }}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.row}>
            <Button secondary title="Today" onPress={() => onSelect(today())} />
            <Button secondary title="Clear" onPress={() => onSelect('')} />
            <Button title="Close" onPress={onClose} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
export function Choice({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value?: string;
  options: (string | { value: string; name: string })[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rows = options.map(o =>
    typeof o === 'string' ? { value: o, name: label(o) } : o,
  );
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.muted}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${
          rows.find(o => o.value === value)?.name || 'Select'
        }`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { flex: 1, color: value ? colors.ink : colors.muted },
          ]}
        >
          {rows.find(o => o.value === value)?.name || 'Select an option'}
        </Text>
        <ChevronDown size={20} color={colors.muted} />
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.page}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Title>{title}</Title>
            <Field title="Search options" value={search} onChange={setSearch} />
            {rows
              .filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
              .map(o => (
                <MenuItem
                  key={o.value}
                  selected={o.value === value}
                  title={o.name}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                    setSearch('');
                  }}
                />
              ))}
            <Button title="Close" onPress={() => setOpen(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  ) : null;
}
export function Loading() {
  return (
    <View style={{ padding: 40, gap: 12 }}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.muted, { textAlign: 'center' }]}>
        Loading your workspace…
      </Text>
    </View>
  );
}
export function Empty({ text = 'No records yet.' }: { text?: string }) {
  return (
    <Card>
      <Heading>Nothing here yet</Heading>
      <Text style={styles.muted}>{text}</Text>
    </Card>
  );
}

export function NavIcon({ name, color }: { name: string; color: string }) {
  const Icon =
    {
      dashboard: House,
      patients: UsersRound,
      spectacles: Glasses,
      payments: Wallet,
    }[name] || LayoutGrid;
  return <Icon size={23} color={color} strokeWidth={1.8} />;
}

export function MenuItem({
  title,
  onPress,
  selected,
  name,
}: {
  title: string;
  onPress: () => void;
  selected?: boolean;
  name?: string;
}) {
  const Icon =
    {
      visits: ClipboardList,
      medicines: Pill,
      reports: ChartNoAxesCombined,
      form: SlidersHorizontal,
      password: LockKeyhole,
    }[name || ''] || Circle;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: selected || pressed ? colors.pale : '#FFFFFF',
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.pale,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <Check size={19} color={colors.primary} />
        ) : (
          <Icon size={18} color={colors.primary} />
        )}
      </View>
      <Text style={[styles.text, { flex: 1, fontWeight: '600' }]}>{title}</Text>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}
