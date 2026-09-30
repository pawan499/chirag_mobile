import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Glasses,
  Plus,
  TrendingUp,
  UsersRound,
  Wallet,
} from 'lucide-react-native';
import { AppPressable } from './pressable';
import { colors } from './ui';
import { Data, date, label, money, today } from './domain';
import { orderStatusName } from './order-ui';
import type { Navigate } from './screens';

function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.between}>
      <Text accessibilityRole="header" style={s.heading}>
        {title}
      </Text>
      {action && (
        <AppPressable
          accessibilityRole="button"
          onPress={onPress}
          style={s.link}
        >
          <Text style={s.linkText}>{action}</Text>
          <ArrowUpRight size={15} color={colors.primary} />
        </AppPressable>
      )}
    </View>
  );
}
export function DashboardView({
  data: d,
  user,
  go,
  trend,
}: {
  data?: Data;
  user: string;
  go: Navigate;
  trend: React.ReactNode;
}) {
  const summary = d?.summary || {};
  return (
    <>
      <View style={{ gap: 5 }}>
        <Text style={s.eyebrow}>YOUR CLINIC, AT A GLANCE</Text>
        <Text accessibilityRole="header" style={s.greeting}>
          Hello, {user.trim().split(/\s+/)[0] || 'Doctor'}
        </Text>
        <View style={s.row}>
          <CalendarDays size={14} color={colors.muted} />
          <Text style={s.caption}>
            {date(today())} · Let's make today a clearer day.
          </Text>
        </View>
      </View>
      <View style={s.hero}>
        <View pointerEvents="none" accessible={false} style={s.orbit} />
        <View style={s.between}>
          <Text style={s.heroLabel}>Today's collection</Text>
          <View style={s.heroIcon}>
            <Wallet size={20} color="#C4ECE8" />
          </View>
        </View>
        <Text selectable style={s.heroAmount}>
          {money(summary.todayCollection)}
        </Text>
        <View style={s.row}>
          <UsersRound size={16} color="#BBDDD9" />
          <Text style={s.heroSub}>
            {summary.todayPatients || 0} patients seen today
          </Text>
        </View>
        <AppPressable
          accessibilityRole="button"
          accessibilityLabel="Register patient"
          onPress={() => go({ name: 'form', kind: 'patient' })}
          style={({ pressed }) => [s.register, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Plus size={18} color="#fff" />
          <Text style={s.registerText}>Register patient</Text>
          <ArrowUpRight size={18} color="#fff" />
        </AppPressable>
      </View>
      <View style={s.grid}>
        {[
          ['This week', summary.weeklyCollection],
          ['This month', summary.monthlyCollection],
        ].map(([name, amount]) => (
          <View key={name} style={s.stat}>
            <TrendingUp size={17} color={colors.primary} />
            <Text style={s.caption}>{name}</Text>
            <Text selectable style={s.statValue}>
              {money(amount)}
            </Text>
          </View>
        ))}
      </View>
      <AppPressable
        accessibilityRole="button"
        accessibilityLabel={`Outstanding dues ${money(
          summary.pendingDue,
        )}. Open payments`}
        onPress={() => go({ name: 'payments' })}
        style={s.dues}
      >
        <View style={s.warmIcon}>
          <Banknote size={20} color="#9A6B20" />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.caption}>Outstanding dues</Text>
          <Text style={s.dueAmount}>{money(summary.pendingDue)}</Text>
        </View>
        <ChevronRight size={18} color="#9A6B20" />
      </AppPressable>
      <View style={{ gap: 10 }}>
        <SectionTitle title="Quick access" />
        <View style={s.grid}>
          {(
            [
              ['Patients', 'patients', UsersRound, 'Patient records'],
              ['Visits', 'visits', ClipboardList, 'Examinations'],
              ['Orders', 'spectacles', Glasses, 'Frames & lenses'],
              ['Payments', 'payments', Wallet, 'Receipts & dues'],
            ] as const
          ).map(([name, route, Icon, sub]) => (
            <AppPressable
              key={route}
              accessibilityRole="button"
              accessibilityLabel={name}
              onPress={() => go({ name: route })}
              style={({ pressed }) => [
                s.quick,
                pressed && {
                  backgroundColor: colors.pale,
                  transform: [{ scale: 0.98 }],
                },
              ]}
            >
              <View style={s.between}>
                <View style={s.actionIcon}>
                  <Icon size={20} color={colors.primary} />
                </View>
                <ArrowUpRight size={15} color={colors.muted} />
              </View>
              <Text style={s.quickName}>{name}</Text>
              <Text style={s.caption}>{sub}</Text>
            </AppPressable>
          ))}
        </View>
      </View>
      <View style={s.panel}>
        <SectionTitle
          title="Today's payments"
          action="Reports"
          onPress={() => go({ name: 'reports' })}
        />
        {Object.keys(d?.daily.paymentMethods || {}).length ? (
          Object.entries(d!.daily.paymentMethods).map(([method, amount]) => (
            <View key={method} style={s.methodRow}>
              <View style={s.row}>
                <View style={s.dot} />
                <Text style={s.text}>{label(method)}</Text>
              </View>
              <Text selectable style={s.value}>
                {money(Number(amount))}
              </Text>
            </View>
          ))
        ) : (
          <Text style={s.caption}>No payments recorded today.</Text>
        )}
      </View>
      <View style={s.panel}>
        <SectionTitle title="Collections this week" />
        {trend}
      </View>
      <View style={s.panel}>
        <SectionTitle
          title="Spectacle orders"
          action="View all"
          onPress={() => go({ name: 'spectacles' })}
        />
        <View style={s.grid}>
          {Object.entries(summary.spectacleOrders || {}).map(
            ([status, count]) => (
              <AppPressable
                key={status}
                accessibilityRole="button"
                accessibilityLabel={`${orderStatusName(
                  status,
                )} orders: ${count}`}
                onPress={() => go({ name: 'spectacles', kind: status })}
                style={s.order}
              >
                <Text style={s.caption}>{orderStatusName(status)}</Text>
                <View style={s.between}>
                  <Text style={s.statValue}>{String(count)}</Text>
                  <ChevronRight size={16} color={colors.muted} />
                </View>
              </AppPressable>
            ),
          )}
        </View>
        {!Object.keys(summary.spectacleOrders || {}).length && (
          <Text style={s.caption}>No spectacle orders yet.</Text>
        )}
      </View>
      <View style={s.panel}>
        <SectionTitle
          title="Recent visits"
          action="View all"
          onPress={() => go({ name: 'visits' })}
        />
        {d?.visits?.length ? (
          d.visits.map((visit: Data) => (
            <AppPressable
              key={visit._id}
              accessibilityRole="button"
              accessibilityLabel={`Examination and prescription for ${
                visit.patient?.name || 'patient'
              }, ${visit.visitId}`}
              onPress={() =>
                go({ name: 'receipt', kind: 'visit', id: visit._id })
              }
              style={s.visit}
            >
              <View style={s.actionIcon}>
                <ClipboardList size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text style={s.quickName}>
                  {visit.patient?.name || 'Patient'}
                </Text>
                <Text style={s.caption}>
                  {visit.visitId} · {date(visit.visitDate)}
                </Text>
                <Text style={s.caption}>
                  {visit.complaint || 'Eye examination'}
                </Text>
                <Text style={s.value}>{money(visit.charges?.total)}</Text>
              </View>
              <ChevronRight size={16} color={colors.muted} />
            </AppPressable>
          ))
        ) : (
          <Text style={s.caption}>
            Your latest consultations will appear here.
          </Text>
        )}
      </View>
    </>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.ink,
  },
  caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  hero: {
    backgroundColor: '#123F47',
    borderRadius: 22,
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  orbit: {
    position: 'absolute',
    right: -65,
    top: -75,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 35,
    borderColor: '#1B5057',
  },
  heroLabel: { fontSize: 14, color: '#D1E9E6', fontWeight: '500' },
  heroIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#265A61',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAmount: { color: '#fff', fontSize: 36, fontWeight: '700' },
  heroSub: { color: '#BBDDD9', fontSize: 12, lineHeight: 18 },
  register: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#078995',
    borderRadius: 12,
    minHeight: 44,
    padding: 11,
    marginTop: 4,
  },
  registerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 120,
    padding: 15,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fff',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.ink },
  dues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EFE3CA',
    backgroundColor: '#FFFAF0',
  },
  warmIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F9EED6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueAmount: { fontSize: 18, color: '#855B1C', fontWeight: '700' },
  heading: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  quick: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 120,
    padding: 14,
    gap: 7,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    color: colors.ink,
  },
  panel: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F6',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  text: { fontSize: 13, color: colors.ink },
  value: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  order: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 100,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F7F9FB',
    gap: 6,
  },
  visit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F5',
  },
});
