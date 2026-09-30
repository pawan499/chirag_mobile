import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  ClipboardList,
  Eye,
  LockKeyhole,
  Pill,
  SlidersHorizontal,
  UserRound,
  Wallet,
} from 'lucide-react-native';
import { colors } from './ui';

export function FormSection({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const Icon = /password|sign|welcome/i.test(title || '')
    ? LockKeyhole
    : /patient|personal|contact/i.test(title || '')
    ? UserRound
    : /eye|vision|examination/i.test(title || '')
    ? Eye
    : /medicine|prescription/i.test(title || '')
    ? Pill
    : /bill|payment|pricing|fee/i.test(title || '')
    ? Wallet
    : /clinic|settings/i.test(title || '')
    ? SlidersHorizontal
    : ClipboardList;
  return (
    <View style={s.card}>
      {!!title && (
        <View style={s.header}>
          <View style={s.icon}>
            <Icon size={19} strokeWidth={1.8} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text accessibilityRole="header" style={s.title}>
              {title}
            </Text>
            {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          </View>
        </View>
      )}
      {children}
    </View>
  );
}
export function FormGrid({ children }: { children: React.ReactNode }) {
  const { width, fontScale } = useWindowDimensions();
  return (
    <View style={s.grid}>
      {React.Children.map(
        children,
        child =>
          child && (
            <View
              style={{
                flexGrow: 1,
                flexBasis: width < 380 || fontScale > 1.2 ? '100%' : '45%',
                minWidth: 0,
              }}
            >
              {child}
            </View>
          ),
      )}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    gap: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DFE8EC',
    shadowColor: '#163B50',
    shadowOpacity: 0.025,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F5',
    paddingBottom: 14,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 12, lineHeight: 18, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
});
