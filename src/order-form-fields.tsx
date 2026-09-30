import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Banknote, CalendarDays, Eye, Glasses } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, Field } from './ui';
import { Data, money } from './domain';

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.header}>
        <View style={s.icon}>
          <Icon size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text accessibilityRole="header" style={s.heading}>
            {title}
          </Text>
          <Text style={s.caption}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}
function FieldGrid({ children }: { children: React.ReactNode }) {
  const { width, fontScale } = useWindowDimensions();
  return (
    <View style={s.grid}>
      {React.Children.map(children, child => (
        <View
          style={{
            flexGrow: 1,
            flexBasis: width < 360 || fontScale > 1.2 ? '100%' : '45%',
            minWidth: 0,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
export function OrderFormFields({
  data,
  change,
}: {
  data: Data;
  change: (key: string, value: any) => void;
}) {
  const total =
    Number(data.framePrice || 0) +
    Number(data.lensPrice || 0) +
    Number(data.otherCharges || 0) -
    Number(data.discount || 0);
  return (
    <>
      <Section
        title="Frame & lenses"
        subtitle="Choose the frame and lens details"
        icon={Glasses}
      >
        <Field
          title="Frame name"
          value={data.frameName}
          onChange={v => change('frameName', v)}
        />
        <Field
          title="Lens type"
          value={data.lensType}
          onChange={v => change('lensType', v)}
        />
      </Section>
      <Section
        title="Lens prescription"
        subtitle="Review the powers for each eye"
        icon={Eye}
      >
        {(['rightEye', 'leftEye'] as const).map(side => (
          <View key={side} style={s.eye}>
            <View style={s.eyeHeading}>
              <Text style={s.eyeName}>
                {side === 'rightEye' ? 'Right eye' : 'Left eye'}
              </Text>
              <Text style={s.badge}>{side === 'rightEye' ? 'OD' : 'OS'}</Text>
            </View>
            <FieldGrid>
              {(
                [
                  ['sph', 'SPH'],
                  ['cyl', 'CYL'],
                  ['axis', 'Axis (0–180°)'],
                  ['add', 'ADD'],
                ] as const
              ).map(([key, title]) => (
                <Field
                  key={key}
                  title={title}
                  numeric
                  value={data[side]?.[key]}
                  onChange={v => change(side, { ...data[side], [key]: v })}
                />
              ))}
            </FieldGrid>
            <Field
              title="Visual acuity"
              value={data[side]?.va}
              onChange={v => change(side, { ...data[side], va: v })}
            />
          </View>
        ))}
        <Field
          title="Pupillary distance · PD (mm)"
          numeric
          value={data.pd}
          onChange={v => change('pd', v)}
        />
      </Section>
      <Section
        title="Pricing"
        subtitle="Amounts in Indian rupees"
        icon={Banknote}
      >
        <FieldGrid>
          {(
            [
              ['framePrice', 'Frame price (₹)'],
              ['lensPrice', 'Lens price (₹)'],
              ['otherCharges', 'Other charges (₹)'],
              ['discount', 'Discount (₹)'],
            ] as const
          ).map(([key, title]) => (
            <Field
              key={key}
              title={title}
              numeric
              value={data[key]}
              onChange={v => change(key, v)}
            />
          ))}
        </FieldGrid>
        <View style={s.total}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.heading}>Order total</Text>
            <Text style={s.caption}>Frame + lenses + charges − discount</Text>
          </View>
          <Text style={s.amount}>
            {Number.isFinite(total) ? money(total) : '—'}
          </Text>
        </View>
      </Section>
      <Section
        title="Delivery & notes"
        subtitle="Schedule collection and add any instructions"
        icon={CalendarDays}
      >
        <Field
          title="Delivery date (YYYY-MM-DD)"
          value={data.deliveryDate}
          onChange={v => change('deliveryDate', v)}
        />
        <Field
          title="Order notes"
          multiline
          value={data.notes}
          onChange={v => change('notes', v)}
        />
      </Section>
    </>
  );
}
const s = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F5',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pale,
  },
  heading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  eye: {
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F5',
  },
  eyeHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.pale,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  total: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: colors.pale,
    borderRadius: 12,
  },
  amount: { fontSize: 23, fontWeight: '700', color: colors.primary },
});
