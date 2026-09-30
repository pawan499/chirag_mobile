import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Data, date, label, money } from './domain';
import { colors } from './ui';
import { Details, EyeMeasurements } from './patient-details';
import { OrderStatus } from './order-ui';
import { paymentTime } from './payment-time';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <Text accessibilityRole="header" style={s.heading}>
        {title}
      </Text>
      {children}
    </View>
  );
}
export function ReceiptView({ receipt: r }: { receipt: Data }) {
  const settings = r.settings || {};
  const patient = r.patient || {};
  const { investigation, ...personal } = patient;
  const order = r.order;
  const payment = r.payment;
  const title =
    r.kind === 'patient'
      ? 'Registration receipt'
      : r.kind === 'visit'
      ? 'Bill & prescription'
      : r.kind === 'order'
      ? 'Spectacle receipt'
      : 'Payment receipt';
  const orderFields = order
    ? Object.fromEntries(
        Object.entries(order).filter(
          ([key]) =>
            ![
              'rightEye',
              'leftEye',
              'pd',
              'framePrice',
              'lensPrice',
              'otherCharges',
              'discount',
              'totalAmount',
              'advanceAmount',
              'remainingAmount',
              'status',
            ].includes(key),
        ),
      )
    : {};
  const paymentFields = payment
    ? Object.fromEntries(
        Object.entries(payment).filter(
          ([key]) =>
            ![
              'amount',
              'paymentDate',
              'editedAt',
              'editHistory',
              'visit',
              'spectacleOrder',
            ].includes(key),
        ),
      )
    : {};
  return (
    <View style={s.paper}>
      <View style={s.clinic}>
        <Image
          source={require('../assets/brand-icon.png')}
          accessibilityLabel="Chirag logo"
          style={s.logo}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.shop}>
            {settings.shopName || 'Chirag Eye Care & Optics'}
          </Text>
          {!!settings.doctorName && (
            <Text style={s.text}>{settings.doctorName}</Text>
          )}
          {!!settings.address && (
            <Text style={s.muted}>{settings.address}</Text>
          )}
          {!!(settings.mobile || settings.email) && (
            <Text selectable style={s.muted}>
              {[settings.mobile, settings.email].filter(Boolean).join(' · ')}
            </Text>
          )}
          {!!settings.registrationNumber && (
            <Text style={s.muted}>Reg. {settings.registrationNumber}</Text>
          )}
        </View>
      </View>
      <View style={s.banner}>
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        <View style={s.row}>
          <Text selectable style={s.number}>
            {r.number}
          </Text>
          <Text style={s.muted}>{date(r.date)}</Text>
        </View>
        {r.cancelled && (
          <Text accessibilityRole="alert" style={s.cancelled}>
            CANCELLED ORDER
          </Text>
        )}
      </View>
      {r.kind !== 'patient' && (
        <View style={s.totals}>
          {(
            [
              ['Bill total', r.total],
              ['Paid', r.paid],
              ['Balance due', r.due],
            ] as const
          ).map(([name, value]) => (
            <View key={name} style={s.totalCell}>
              <Text style={s.muted}>{name}</Text>
              <Text
                selectable
                style={[
                  s.amount,
                  name === 'Balance due' && { color: colors.primary },
                ]}
              >
                {money(value)}
              </Text>
            </View>
          ))}
        </View>
      )}
      <Section title="Patient details">
        <Details data={personal} />
      </Section>
      {r.kind === 'patient' && (
        <Section title="Registration investigation">
          {investigation ? (
            <EyeMeasurements data={investigation} />
          ) : (
            <Text style={s.muted}>No investigation recorded.</Text>
          )}
        </Section>
      )}
      {r.visit && (
        <Section title="Examination & prescription">
          <Details data={r.visit} />
        </Section>
      )}
      {order && (
        <>
          <Section title="Spectacle order">
            <OrderStatus status={order.status} />
            <Details data={orderFields} />
          </Section>
          {(order.rightEye || order.leftEye || order.pd != null) && (
            <Section title="Lens prescription">
              <EyeMeasurements
                data={{
                  rightEye: order.rightEye,
                  leftEye: order.leftEye,
                  pd: order.pd,
                }}
              />
            </Section>
          )}
          <Section title="Price breakdown">
            {(
              [
                ['Frame', order.framePrice],
                ['Lenses', order.lensPrice],
                ['Other charges', order.otherCharges],
                ['Discount', order.discount],
                ['Total', order.totalAmount],
                ['Advance received', order.advanceAmount],
              ] as const
            ).map(([name, value]) => (
              <View key={name} style={s.row}>
                <Text style={s.muted}>{name}</Text>
                <Text selectable style={s.text}>
                  {money(value)}
                </Text>
              </View>
            ))}
          </Section>
        </>
      )}
      {payment && (
        <Section title="Payment received">
          <View style={s.paymentHighlight}>
            <Text selectable style={s.received}>
              {money(payment.amount)}
            </Text>
            <Text style={s.muted}>
              {label(payment.paymentMethod || '')} · {date(payment.paymentDate)}
            </Text>
          </View>
          {!!r.billNumber && (
            <Text style={s.text}>Against bill · {r.billNumber}</Text>
          )}
          <Details data={paymentFields} />
          {!!payment.editedAt && (
            <View style={s.audit}>
              <Text style={s.text}>
                Edited · {paymentTime(payment.editedAt)} IST
              </Text>
              {payment.editHistory?.map((edit: Data, index: number) => (
                <View key={index} style={{ gap: 4 }}>
                  <Text style={s.muted}>{paymentTime(edit.editedAt)} IST</Text>
                  <Text selectable style={s.text}>
                    {edit.note}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Section>
      )}
      {r.kind !== 'patient' && (
        <Section title="Payment history">
          {r.payments?.length ? (
            r.payments.map((p: Data, index: number) => (
              <View key={p._id || p.paymentId || index} style={s.history}>
                <View style={s.row}>
                  <Text selectable style={s.number}>
                    {p.paymentId}
                  </Text>
                  <Text selectable style={s.text}>
                    {money(p.amount)}
                  </Text>
                </View>
                <Text style={s.muted}>
                  {date(p.paymentDate)} · {label(p.paymentMethod || '')}
                </Text>
                {!!p.referenceNumber && (
                  <Text selectable style={s.muted}>
                    Ref. {p.referenceNumber}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={s.muted}>No payments recorded.</Text>
          )}
        </Section>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  paper: {
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 20,
  },
  clinic: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  shop: {
    fontSize: 17,
    lineHeight: 23,
    color: colors.primary,
    fontWeight: '700',
  },
  text: { fontSize: 14, lineHeight: 21, color: colors.ink },
  muted: { fontSize: 12, lineHeight: 18, color: colors.muted },
  banner: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.pale,
    gap: 9,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  number: { fontSize: 13, fontWeight: '600', color: colors.ink },
  cancelled: { color: colors.red, fontWeight: '700', fontSize: 12 },
  totals: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  totalCell: { flex: 1, minWidth: 90, gap: 5 },
  amount: { fontSize: 19, fontWeight: '700', color: colors.ink },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 16,
    gap: 12,
  },
  heading: { fontSize: 15, fontWeight: '700', color: colors.ink },
  history: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F7F9FB',
    gap: 6,
  },
  paymentHighlight: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.pale,
    gap: 5,
  },
  received: { fontSize: 24, fontWeight: '700', color: colors.primary },
  audit: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    gap: 10,
  },
});
