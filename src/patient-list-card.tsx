import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import {
  ChevronRight,
  Phone,
  CalendarPlus,
  ReceiptText,
} from 'lucide-react-native';
import { AppPressable } from './pressable';
import { IconButton } from './icon-button';
import { colors } from './ui';
import { usePopup } from './popup';
import { Data, label } from './domain';
import type { Navigate } from './screens';

export function PatientListCard({
  patient: p,
  go,
}: {
  patient: Data;
  go: Navigate;
}) {
  const showPopup = usePopup();
  const initials = String(p.name || 'P')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  const demographics = [
    p.age != null ? `${p.age} years` : '',
    p.gender ? label(p.gender.toLowerCase()) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={s.card}>
      <AppPressable
        accessibilityRole="button"
        accessibilityLabel={`View patient ${p.name}`}
        onPress={() => go({ name: 'patient', id: p._id })}
        style={({ pressed }) => [
          s.profile,
          pressed && { backgroundColor: '#F0F8F8' },
        ]}
      >
        <View style={s.avatar}>
          <Text style={s.initials}>{initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <Text style={s.name}>{p.name || 'Patient'}</Text>
          <Text style={s.identifier}>{p.patientId || 'Patient record'}</Text>
          {!!demographics && <Text style={s.caption}>{demographics}</Text>}
        </View>
        <ChevronRight size={19} color={colors.muted} />
      </AppPressable>
      <View style={s.footer}>
        <View style={s.contact}>
          <Phone size={14} color={colors.muted} />
          <Text selectable style={s.phone}>
            {p.mobile || 'No phone number'}
          </Text>
        </View>
        <View style={s.actions}>
          {!!p.mobile && (
            <IconButton
              title="Call patient"
              icon={Phone}
              onPress={() => {
                void Linking.openURL(
                  `tel:${String(p.mobile).replace(/[^+\d]/g, '')}`,
                ).catch(() =>
                  showPopup('Unable to call', 'No phone app is available.'),
                );
              }}
            />
          )}
          <IconButton
            title="New visit"
            icon={CalendarPlus}
            onPress={() => go({ name: 'form', kind: 'visit', id: p._id })}
          />
          <IconButton
            title="Registration receipt"
            icon={ReceiptText}
            onPress={() => go({ name: 'receipt', kind: 'patient', id: p._id })}
          />
        </View>
      </View>
    </View>
  );
}
export function PatientSelectionCard({
  patient: p,
  onSelect,
}: {
  patient: Data;
  onSelect: () => void;
}) {
  const initials = String(p.name || 'P')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  const demographics = [
    p.age != null ? `${p.age} years` : '',
    p.gender ? label(p.gender.toLowerCase()) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <AppPressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${p.name}, ${p.patientId || ''}, ${
        p.mobile || 'no phone number'
      }`}
      accessibilityHint="Continue with this patient"
      onPress={onSelect}
      style={({ pressed }) => [
        s.card,
        s.selection,
        pressed && {
          backgroundColor: '#F0F8F8',
          borderColor: colors.primary,
          transform: [{ scale: 0.99 }],
        },
      ]}
    >
      <View style={s.avatar}>
        <Text style={s.initials}>{initials}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <Text style={s.name}>{p.name || 'Patient'}</Text>
        <Text style={s.identifier}>{p.patientId || 'Patient record'}</Text>
        {!!demographics && <Text style={s.caption}>{demographics}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Phone size={13} color={colors.muted} />
          <Text style={s.phone}>{p.mobile || 'No phone number'}</Text>
        </View>
      </View>
      <View style={s.selectionArrow}>
        <ChevronRight size={18} color={colors.primary} />
      </View>
    </AppPressable>
  );
}
const s = StyleSheet.create({
  selection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    minHeight: 94,
  },
  selectionArrow: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.pale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    minHeight: 88,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 16, fontWeight: '700', color: colors.primary },
  name: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: colors.ink },
  identifier: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  footer: {
    marginHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F5',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 115,
  },
  phone: { fontSize: 12, lineHeight: 18, color: colors.muted, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
