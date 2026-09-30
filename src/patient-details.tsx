import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ClipboardList, UserRound } from 'lucide-react-native';
import { Data, date, label, money } from './domain';
import { colors } from './ui';

const hidden = new Set([
  '_id',
  '__v',
  'patient',
  'createdBy',
  'updatedBy',
  'isActive',
  'createdAt',
  'updatedAt',
  'medicine',
]);
const names: Record<string, string> = {
  name: 'Full name',
  mobile: 'Phone number',
  dateOfBirth: 'Date of birth',
  investigation: 'Registration investigation',
  eyeExamination: 'Eye measurements',
  sph: 'SPH',
  cyl: 'CYL',
  add: 'ADD',
  axis: 'Axis (°)',
  iop: 'IOP (mmHg)',
  pd: 'PD (mm)',
  va: 'Visual acuity',
  rightEye: 'Right eye · OD',
  leftEye: 'Left eye · OS',
  medicineName: 'Medicine',
  medicineTotal: 'Medicines',
  total: 'Total amount',
};
const present = (value: any): boolean =>
  value != null &&
  value !== '' &&
  (Array.isArray(value)
    ? value.some(present)
    : typeof value === 'object'
    ? Object.entries(value).some(([key, v]) => !hidden.has(key) && present(v))
    : true);
const title = (key: string) => names[key] || label(key);
function display(key: string, value: any, currency = false): string {
  if (!present(value)) return '—';
  if (currency || ['unitPrice', 'totalPrice'].includes(key))
    return money(value);
  if (['dateOfBirth', 'visitDate', 'followUpDate'].includes(key))
    return date(value);
  if (key === 'age') return `${value} years`;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (['gender', 'status'].includes(key))
    return label(String(value).toLowerCase());
  return String(value);
}

export function EyeMeasurements({ data }: { data: Data }) {
  const { fontScale } = useWindowDimensions();
  const keys = Array.from(
    new Set([
      'sph',
      'cyl',
      'axis',
      'add',
      'iop',
      'va',
      'unaidedVision',
      'correctedVision',
      'pinholeVision',
      'nearVision',
      ...Object.keys(data.rightEye || {}),
      ...Object.keys(data.leftEye || {}),
    ]),
  ).filter(
    key =>
      !hidden.has(key) &&
      (present(data.rightEye?.[key]) || present(data.leftEye?.[key])),
  );
  const rest = Object.fromEntries(
    Object.entries(data).filter(
      ([key]) => !['rightEye', 'leftEye'].includes(key),
    ),
  );
  return (
    <View style={s.group}>
      {keys.length > 0 && (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          <View style={{ minWidth: 280 * Math.max(1, fontScale), flexGrow: 1 }}>
            <View style={[s.eyeRow, s.tableHeader]}>
              <Text style={[s.eyeLabel, s.columnHeading]}>Measurement</Text>
              <Text style={[s.eyeValue, s.columnHeading]}>Right · OD</Text>
              <Text style={[s.eyeValue, s.columnHeading]}>Left · OS</Text>
            </View>
            {keys.map((key, index) => (
              <View
                key={key}
                style={[s.eyeRow, index % 2 === 0 && s.alternate]}
              >
                <Text style={s.eyeLabel}>{title(key)}</Text>
                <Text selectable style={s.eyeValue}>
                  {display(key, data.rightEye?.[key])}
                </Text>
                <Text selectable style={s.eyeValue}>
                  {display(key, data.leftEye?.[key])}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <Details data={rest} />
    </View>
  );
}

export function Details({
  data,
  currency = false,
}: {
  data: Data;
  currency?: boolean;
}) {
  const { width, fontScale } = useWindowDimensions();
  const entries = Object.entries(data).filter(
    ([key, value]) => !hidden.has(key) && present(value),
  );
  const scalar = entries.filter(([, value]) => typeof value !== 'object');
  const nested = entries.filter(([, value]) => typeof value === 'object');
  return (
    <View style={s.group}>
      {scalar.length > 0 && (
        <View style={s.grid}>
          {scalar.map(([key, value]) => {
            const wide =
              width < 360 ||
              fontScale > 1.2 ||
              [
                'name',
                'address',
                'allergies',
                'medicalNotes',
                'complaint',
                'doctorNotes',
                'remarks',
                'instructions',
                'medicineName',
              ].includes(key);
            return (
              <View
                key={key}
                style={[
                  s.cell,
                  { flexBasis: wide ? '100%' : '46%' },
                  key === 'allergies' && s.allergy,
                ]}
              >
                <Text style={s.label}>{title(key)}</Text>
                <Text selectable style={[s.value, key === 'total' && s.total]}>
                  {display(key, value, currency)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      {nested.map(([key, value]) => (
        <View key={key} style={s.section}>
          <Text style={s.sectionTitle}>{title(key)}</Text>
          {['investigation', 'eyeExamination'].includes(key) ? (
            <EyeMeasurements data={value} />
          ) : Array.isArray(value) ? (
            <View style={s.group}>
              {value.filter(present).map((item, index) =>
                typeof item === 'object' ? (
                  <View key={index} style={s.item}>
                    <Details data={item} />
                  </View>
                ) : (
                  <Text key={index} selectable style={s.value}>
                    • {String(item)}
                  </Text>
                ),
              )}
            </View>
          ) : (
            <Details data={value} currency={key === 'charges'} />
          )}
        </View>
      ))}
    </View>
  );
}

export function PatientDetailsCard({
  data,
  examination = false,
}: {
  data: Data;
  examination?: boolean;
}) {
  const Icon = examination ? ClipboardList : UserRound;
  const body = examination
    ? Object.fromEntries(
        Object.entries(data).filter(
          ([key]) => !['visitId', 'visitDate'].includes(key),
        ),
      )
    : data;
  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.icon}>
          <Icon size={20} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text accessibilityRole="header" style={s.heading}>
            {examination ? 'Latest examination' : 'Patient information'}
          </Text>
          <Text style={s.subtitle}>
            {examination
              ? [data.visitId, data.visitDate && date(data.visitDate)]
                  .filter(Boolean)
                  .join(' · ') || 'Visit details'
              : 'Personal & medical details'}
          </Text>
        </View>
      </View>
      {present(body) ? (
        <Details data={body} />
      ) : (
        <Text style={s.label}>No details recorded.</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F5',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { fontSize: 17, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 12, lineHeight: 18, color: colors.muted },
  group: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    flexGrow: 1,
    minWidth: 0,
    backgroundColor: '#F7F9FB',
    borderRadius: 10,
    padding: 12,
    gap: 5,
  },
  label: { fontSize: 12, lineHeight: 17, color: colors.muted },
  value: { fontSize: 14, lineHeight: 21, color: colors.ink, fontWeight: '500' },
  total: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  allergy: { backgroundColor: '#FFF4ED' },
  section: {
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F5',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  item: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
  },
  eyeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 11,
    gap: 8,
  },
  tableHeader: { backgroundColor: colors.pale, borderRadius: 8 },
  alternate: { backgroundColor: '#F7F9FB' },
  columnHeading: { fontWeight: '700', color: colors.primary },
  eyeLabel: { flex: 1.4, fontSize: 12, lineHeight: 18, color: colors.muted },
  eyeValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
    textAlign: 'center',
    fontWeight: '600',
  },
});
