import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CalendarDays,
  ChevronDown,
  Check,
  Glasses,
  History,
  ReceiptText,
  ArrowUpRight,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AppPressable } from './pressable';
import { IconButton } from './icon-button';
import { EyeMeasurements } from './patient-details';
import { Data, date, idOf, label, money, statuses } from './domain';
import { colors } from './ui';
import type { Navigate } from './screens';

const statusNames: Record<string, string> = {
  ALL: 'All orders',
  ORDERED: 'Ordered',
  IN_PROCESS: 'In progress',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};
export const orderStatusName = (status: string) =>
  statusNames[status] || label(status);
export function OrderStatus({ status }: { status: string }) {
  const cancelled = status === 'CANCELLED';
  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor: cancelled
            ? '#FFF0ED'
            : status === 'ORDERED'
            ? '#FFF5DE'
            : colors.pale,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: cancelled
            ? colors.red
            : status === 'ORDERED'
            ? '#8C6215'
            : colors.primary,
        }}
      >
        {orderStatusName(status)}
      </Text>
    </View>
  );
}
export function OrderAction({
  title,
  icon: Icon,
  onPress,
  disabled,
  danger,
  primary,
}: {
  title: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  primary?: boolean;
}) {
  return (
    <AppPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.action,
        {
          backgroundColor: danger
            ? '#FFF0ED'
            : primary
            ? colors.primary
            : colors.pale,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Icon
        size={18}
        color={danger ? colors.red : primary ? '#fff' : colors.primary}
      />
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          flexShrink: 1,
          color: danger ? colors.red : primary ? '#fff' : colors.primary,
        }}
      >
        {title}
      </Text>
    </AppPressable>
  );
}
export function OrderFilters({
  value,
  onChange,
  orders = [],
}: {
  value: string;
  onChange: (value: string) => void;
  orders?: Data[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.caption}>Order status</Text>
      <AppPressable
        accessibilityRole="button"
        accessibilityLabel={`Order status: ${orderStatusName(value)}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(current => !current)}
        style={[s.dropdownTrigger, open && { borderColor: colors.primary }]}
      >
        <Text style={[s.value, { flex: 1 }]}>{orderStatusName(value)}</Text>
        <ChevronDown
          size={18}
          color={colors.primary}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </AppPressable>
      {open && (
        <View style={s.dropdownMenu}>
          {['ALL', ...statuses].map(status => {
            const selected = status === value;
            const count =
              status === 'ALL'
                ? orders.length
                : orders.filter(order => order.status === status).length;
            return (
              <AppPressable
                key={status}
                accessibilityRole="button"
                accessibilityLabel={`${orderStatusName(
                  status,
                )}, ${count} orders`}
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(status);
                  setOpen(false);
                }}
                style={[
                  s.dropdownOption,
                  selected && { backgroundColor: colors.pale },
                ]}
              >
                <Text
                  style={[
                    s.value,
                    { flex: 1, color: selected ? colors.primary : colors.ink },
                  ]}
                >
                  {orderStatusName(status)}
                </Text>
                <Text style={s.caption}>{count}</Text>
                <View style={{ width: 18 }}>
                  {selected && <Check size={17} color={colors.primary} />}
                </View>
              </AppPressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
function Amounts({ order, due }: { order: Data; due: number }) {
  return (
    <View style={s.amounts}>
      {[
        ['Order total', order.totalAmount],
        ['Balance due', due],
      ].map(([name, amount]) => (
        <View key={String(name)} style={{ flex: 1, minWidth: 100, gap: 5 }}>
          <Text style={s.caption}>{name}</Text>
          <Text
            selectable
            style={[
              s.amount,
              name === 'Balance due' && { color: colors.primary },
            ]}
          >
            {money(Number(amount || 0))}
          </Text>
        </View>
      ))}
    </View>
  );
}
export function OrderListCard({ order, go }: { order: Data; go: Navigate }) {
  const open = () => go({ name: 'order', id: order._id, initial: order });
  const due = order.status === 'CANCELLED' ? 0 : order.remainingAmount;
  return (
    <View style={s.listCard}>
      <AppPressable
        accessibilityRole="button"
        accessibilityLabel={`View order ${order.orderId} for ${
          order.patient?.name || 'patient'
        }`}
        onPress={open}
        style={({ pressed }) => [
          s.listBody,
          pressed && { backgroundColor: '#F3F9F9' },
        ]}
      >
        <View style={[s.top, { justifyContent: 'space-between' }]}>
          <Text style={s.orderNumber}>{order.orderId}</Text>
          <OrderStatus status={order.status} />
        </View>
        <View style={s.top}>
          <View style={s.icon}>
            <Glasses size={21} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text style={s.heading}>{order.patient?.name || 'Patient'}</Text>
            <Text style={s.caption}>
              {order.frameName || 'Frame not specified'} ·{' '}
              {order.lensType || 'Lens not specified'}
            </Text>
          </View>
          <ArrowUpRight size={18} color={colors.primary} />
        </View>
        <View style={s.listMetrics}>
          <View style={{ flex: 1, minWidth: 100, gap: 3 }}>
            <Text style={s.caption}>Order total</Text>
            <Text style={s.listAmount}>{money(order.totalAmount)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 100, gap: 3 }}>
            <Text style={s.caption}>Balance due</Text>
            <Text
              style={[
                s.listAmount,
                { color: due > 0 ? '#9A6B20' : colors.primary },
              ]}
            >
              {money(due)}
            </Text>
          </View>
        </View>
      </AppPressable>
      <View style={s.listFooter}>
        <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 120, gap: 3 }}>
          <Text style={s.caption}>Delivery date</Text>
          <View style={s.row}>
            <CalendarDays size={14} color={colors.muted} />
            <Text style={s.value}>{date(order.deliveryDate)}</Text>
          </View>
        </View>
        <View style={s.row}>
          <IconButton
            title="Order receipt"
            icon={ReceiptText}
            onPress={() =>
              go({ name: 'receipt', kind: 'order', id: order._id })
            }
          />
          {!!idOf(order.patient) && (
            <IconButton
              title="Patient history"
              icon={History}
              onPress={() => go({ name: 'patient', id: idOf(order.patient) })}
            />
          )}
        </View>
      </View>
    </View>
  );
}
export function OrderDetails({ order, due }: { order: Data; due: number }) {
  const steps = ['ORDERED', 'IN_PROCESS', 'READY', 'DELIVERED'];
  const current = steps.indexOf(order.status);
  return (
    <>
      <View style={s.card}>
        <View style={s.top}>
          <Text style={[s.heading, { flex: 1 }]}>Order summary</Text>
          <OrderStatus status={order.status} />
        </View>
        <Amounts order={order} due={order.status === 'CANCELLED' ? 0 : due} />
        <View style={s.row}>
          <CalendarDays size={16} color={colors.muted} />
          <Text style={s.value}>Delivery · {date(order.deliveryDate)}</Text>
        </View>
        {current >= 0 && (
          <View style={s.row}>
            {steps.map((step, index) => (
              <View
                key={step}
                style={[
                  s.step,
                  index <= current && {
                    borderColor: '#B9DEDC',
                    backgroundColor: colors.pale,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: index <= current ? colors.primary : colors.muted,
                  }}
                >
                  {index + 1} · {orderStatusName(step)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Frame & lenses</Text>
        <View style={s.row}>
          {[
            ['Frame', order.frameName],
            ['Lens type', order.lensType],
          ].map(([name, value]) => (
            <View key={name} style={s.tile}>
              <Text style={s.caption}>{name}</Text>
              <Text selectable style={s.value}>
                {value || 'Not specified'}
              </Text>
            </View>
          ))}
        </View>
        {order.visit && (
          <Text style={s.caption}>
            Visit · {order.visit.visitId || idOf(order.visit)}
          </Text>
        )}
      </View>
      {(order.rightEye || order.leftEye || order.pd != null) && (
        <View style={s.card}>
          <Text style={s.heading}>Lens prescription</Text>
          <EyeMeasurements
            data={{
              rightEye: order.rightEye,
              leftEye: order.leftEye,
              pd: order.pd,
            }}
          />
        </View>
      )}
      <View style={s.card}>
        <Text style={s.heading}>Price breakdown</Text>
        {(
          [
            ['Frame', order.framePrice],
            ['Lenses', order.lensPrice],
            ['Other charges', order.otherCharges],
            ['Discount', order.discount],
            ['Order total', order.totalAmount],
            ['Advance received', order.advanceAmount],
          ] as const
        ).map(([name, amount]) => (
          <View key={name} style={s.priceRow}>
            <Text style={s.caption}>{name}</Text>
            <Text selectable style={s.value}>
              {money(amount)}
            </Text>
          </View>
        ))}
      </View>
      {!!order.notes && (
        <View style={s.card}>
          <Text style={s.heading}>Order notes</Text>
          <Text selectable style={s.value}>
            {order.notes}
          </Text>
        </View>
      )}
    </>
  );
}
const s = StyleSheet.create({
  listCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
  },
  listBody: { padding: 14, gap: 12, borderRadius: 16 },
  orderNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  listMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F5',
  },
  listAmount: { fontSize: 18, fontWeight: '700', color: colors.ink },
  listFooter: {
    marginHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F5',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 14,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  top: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    color: colors.ink,
  },
  caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  value: { fontSize: 14, lineHeight: 21, color: colors.ink, fontWeight: '500' },
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  amounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F7F9FB',
    padding: 12,
    borderRadius: 12,
  },
  amount: { fontSize: 21, fontWeight: '700', color: colors.ink },
  action: {
    minHeight: 44,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  dropdownTrigger: {
    minHeight: 46,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownMenu: {
    padding: 5,
    gap: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dropdownOption: {
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  step: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 100,
    backgroundColor: '#F7F9FB',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F6',
    paddingBottom: 9,
  },
});
