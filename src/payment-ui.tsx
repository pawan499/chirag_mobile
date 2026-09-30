import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
  ReceiptText,
  History,
} from 'lucide-react-native';
import { Data, idOf, money } from './domain';
import { colors } from './ui';
import { IconButton } from './icon-button';
import { PaymentEditor, paymentTime } from './payment-editor';
import { AppPressable } from './pressable';
import type { Navigate } from './screens';

export function PaymentSummary({ data }: { data: Data }) {
  return (
    <View style={s.summary}>
      <View style={s.row}>
        <View style={s.icon}>
          <Wallet size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.caption}>Today's collection</Text>
          <Text selectable style={s.large}>
            {money(data.daily.totalCollection)}
          </Text>
        </View>
      </View>
      <View style={s.metrics}>
        {[
          ['Cash received today', data.daily.paymentMethods?.CASH || 0],
          ['Outstanding bills', data.summary.pendingDue],
        ].map(([name, value]) => (
          <View key={name} style={s.metric}>
            <Text style={s.caption}>{name}</Text>
            <Text selectable style={s.metricValue}>
              {money(value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
export function PaymentFilters({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={s.row}>
      {['ALL', 'CASH', 'UPI', 'CARD', 'OTHER'].map(method => (
        <AppPressable
          key={method}
          accessibilityRole="button"
          accessibilityLabel={`Payment method: ${
            method === 'ALL' ? 'All' : method
          }`}
          accessibilityState={{ selected: value === method }}
          onPress={() => onChange(method)}
          style={[
            s.filter,
            value === method && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: value === method ? '#fff' : colors.muted,
            }}
          >
            {method === 'ALL'
              ? 'All methods'
              : method === 'CASH'
              ? 'Cash'
              : method === 'CARD'
              ? 'Card'
              : method === 'OTHER'
              ? 'Other'
              : method}
          </Text>
        </AppPressable>
      ))}
    </View>
  );
}
export function PaymentListCard({
  payment: p,
  go,
}: {
  payment: Data;
  go: Navigate;
}) {
  const Icon =
    p.paymentMethod === 'CASH'
      ? Banknote
      : p.paymentMethod === 'CARD'
      ? CreditCard
      : p.paymentMethod === 'UPI'
      ? Smartphone
      : Wallet;
  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.icon}>
          <Icon size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.name}>{p.patient?.name || 'Patient'}</Text>
          <Text selectable style={s.caption}>
            {p.paymentId}
          </Text>
        </View>
        <View style={s.badge}>
          <Text style={s.method}>{p.paymentMethod}</Text>
        </View>
      </View>
      <View style={s.amountRow}>
        <Text selectable style={s.amount}>
          {money(p.amount)}
        </Text>
        <Text style={s.caption}>{paymentTime(p.paymentDate)} IST</Text>
      </View>
      {!!p.referenceNumber && (
        <View style={s.reference}>
          <Text style={s.caption}>Transaction reference</Text>
          <Text selectable style={s.text}>
            {p.referenceNumber}
          </Text>
        </View>
      )}
      {!!p.notes && (
        <Text selectable style={s.text}>
          {p.notes}
        </Text>
      )}
      <View style={[s.row, s.actions]}>
        <PaymentEditor
          compact
          showHistory={false}
          payment={p}
          onSaved={() => go({ name: 'payments' })}
        />
        <IconButton
          title="Payment receipt"
          icon={ReceiptText}
          onPress={() => go({ name: 'receipt', kind: 'payment', id: p._id })}
        />
        {!!idOf(p.patient) && (
          <IconButton
            title="Patient history"
            icon={History}
            onPress={() => go({ name: 'patient', id: idOf(p.patient) })}
          />
        )}
      </View>
      {(p.editedAt || p.editHistory?.length > 0) && (
        <View style={s.audit}>
          {!!p.editedAt && (
            <Text style={s.caption}>
              Edited · {paymentTime(p.editedAt)} IST
            </Text>
          )}
          {p.editHistory?.map((edit: Data, index: number) => (
            <View key={index} style={{ gap: 3 }}>
              <Text style={s.caption}>{paymentTime(edit.editedAt)} IST</Text>
              <Text selectable style={s.text}>
                {edit.note}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  summary: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D4E9E8',
    backgroundColor: '#F0F8F7',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.pale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  large: { fontSize: 28, fontWeight: '700', color: colors.primary },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  metricValue: { fontSize: 17, fontWeight: '700', color: colors.ink },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  name: { fontSize: 16, fontWeight: '700', lineHeight: 23, color: colors.ink },
  badge: {
    backgroundColor: colors.pale,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  method: { fontSize: 11, fontWeight: '700', color: colors.primary },
  amount: { fontSize: 25, fontWeight: '700', color: colors.primary },
  amountRow: { gap: 5 },
  reference: {
    backgroundColor: '#F7F9FB',
    padding: 11,
    borderRadius: 10,
    gap: 4,
  },
  text: { fontSize: 13, lineHeight: 20, color: colors.ink },
  actions: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDF2F5' },
  audit: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 10,
    gap: 8,
  },
});
