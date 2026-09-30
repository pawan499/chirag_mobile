import { FormSection } from './form-layout';
import { DashboardView } from './dashboard-view';
import { PatientListCard, PatientSelectionCard } from './patient-list-card';
import { PaymentListCard, PaymentSummary, PaymentFilters } from './payment-ui';
import { ReceiptView } from './receipt-view';
import {
  OrderListCard,
  OrderDetails,
  OrderFilters,
  OrderAction,
  orderStatusName,
} from './order-ui';
import { PatientDetailsCard } from './patient-details';
import { KeyboardScrollView } from './keyboard-scroll';
import {
  Trash2,
  Printer,
  Share2,
  Check,
  Pencil,
  Plus,
  X,
  Banknote,
  CalendarPlus,
  Glasses,
  UserPen,
  Phone,
  ReceiptText,
  UserRound,
  ClipboardList,
  Wallet,
  History,
  FileText,
  Eye,
} from 'lucide-react-native';
import { IconButton } from './icon-button';
import { usePopup } from './popup';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  RefreshControl,
  Share,
  Text,
  View,
} from 'react-native';
import RNPrint from 'react-native-print';
import { listAll, request } from './api';
import {
  Data,
  date,
  idOf,
  label,
  money,
  outstanding,
  today,
  validateDate,
} from './domain';
import {
  Button,
  Card,
  Choice,
  colors,
  Empty,
  ErrorBox,
  Field,
  Heading,
  Loading,
  styles,
  Title,
} from './ui';
import { FormKind, RecordForm } from './forms';
import { useResource } from './hooks';
import { receiptHtml } from './receipts';
export type Route = {
  name: string;
  id?: string;
  kind?: string;
  initial?: Data;
};
export type Navigate = (route: Route) => void;
type Resource<T> = ReturnType<typeof useResource<T>>;
export function Page({
  children,
  query,
  refreshable = true,
}: {
  refreshable?: boolean;
  children: React.ReactNode;
  query?: Resource<any>;
}) {
  return (
    <KeyboardScrollView
      keyboardShouldPersistTaps="always"
      contentContainerStyle={styles.content}
      refreshControl={
        query && refreshable ? (
          <RefreshControl
            refreshing={query.loading && !!query.data}
            onRefresh={() => void query.refresh()}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    >
      {query?.loading && !query.data ? (
        <Loading />
      ) : query?.error ? (
        <>
          <ErrorBox message={query.error} />
          <Button title="Try again" onPress={() => void query.refresh()} />
        </>
      ) : (
        children
      )}
    </KeyboardScrollView>
  );
}
export function Dashboard({ go, user }: { go: Navigate; user: string }) {
  const query = useResource(async () => {
    const [summary, visits, trend, daily] = await Promise.all([
      request<Data>('/dashboard/summary'),
      request<Data[]>('/visits?limit=5&page=1'),
      request<Data>('/reports/collection/weekly'),
      request<Data>(`/reports/collection/daily?date=${today()}`),
    ]);
    return { summary, visits, trend, daily };
  }, 'dashboard');
  const d = query.data;
  return (
    <Page query={query}>
      <DashboardView
        data={d}
        user={user}
        go={go}
        trend={<Trend rows={d?.trend.trend || []} />}
      />
    </Page>
  );
}
export function Trend({ rows }: { rows: Data[] }) {
  const max = Math.max(1, ...rows.map(r => r.collection));
  return (
    <View style={{ gap: 12 }}>
      {rows.length ? (
        rows.map(r => (
          <View key={r.date} style={{ gap: 5 }}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.muted}>{date(r.date)}</Text>
              <Text style={styles.text}>{money(r.collection)}</Text>
            </View>
            <View
              style={{
                height: 8,
                backgroundColor: colors.pale,
                borderRadius: 6,
              }}
            >
              <View
                style={{
                  height: 8,
                  width: `${Math.max(0, (r.collection / max) * 100)}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 6,
                }}
              />
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>No collections in this period.</Text>
      )}
    </View>
  );
}
function RecordAction({
  compact,
  title,
  onPress,
}: {
  compact: boolean;
  title: string;
  onPress: () => void;
}) {
  if (!compact) return <Button secondary title={title} onPress={onPress} />;
  const icon = title.includes('receipt')
    ? ReceiptText
    : title.includes('prescription')
    ? FileText
    : title.includes('order')
    ? Glasses
    : title.includes('history')
    ? History
    : Eye;
  return (
    <IconButton title={title.replace(' →', '')} icon={icon} onPress={onPress} />
  );
}
export function RecordCard({
  record: r,
  kind,
  go,
  compactActions = false,
}: {
  record: Data;
  kind: string;
  go: Navigate;
  compactActions?: boolean;
}) {
  if (kind === 'patients') return <PatientListCard patient={r} go={go} />;
  if (kind === 'payments') return <PaymentListCard payment={r} go={go} />;
  if (kind === 'spectacles') return <OrderListCard order={r} go={go} />;
  const patientId = kind === 'patients' ? r._id : idOf(r.patient);
  return (
    <Card>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <Heading>
            {kind === 'patients' || kind === 'medicines'
              ? r.name
              : r.patient?.name || 'Patient'}
          </Heading>
          <Text style={styles.muted}>
            {r.patientId ||
              r.visitId ||
              r.orderId ||
              r.paymentId ||
              r.genericName}
          </Text>
        </View>
        <View style={[styles.chip, { borderRadius: 40 }]}>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>
            {kind === 'patients'
              ? (r.name || 'P').slice(0, 2).toUpperCase()
              : kind === 'spectacles'
              ? '◎'
              : kind === 'payments'
              ? '₹'
              : kind === 'visits'
              ? '✚'
              : 'Rx'}
          </Text>
        </View>
      </View>
      {kind === 'visits' && (
        <>
          <Text style={styles.text}>
            {date(r.visitDate)} · {money(r.charges?.total)}
          </Text>
          <Text style={styles.muted}>{r.complaint || 'Eye examination'}</Text>
          <RecordAction
            compact={compactActions}
            title="Examination & prescription →"
            onPress={() => go({ name: 'receipt', kind: 'visit', id: r._id })}
          />
        </>
      )}
      {kind === 'medicines' && (
        <>
          <Text style={styles.text}>
            {money(r.defaultPrice)} / {r.unit || 'unit'}
          </Text>
          <Text style={styles.muted}>{r.description}</Text>
          <RecordAction
            compact={compactActions}
            title="Edit medicine"
            onPress={() => go({ name: 'form', kind: 'medicine', initial: r })}
          />
        </>
      )}
      {patientId && kind !== 'patients' && (
        <RecordAction
          compact={compactActions}
          title="Patient history"
          onPress={() => go({ name: 'patient', id: patientId })}
        />
      )}
    </Card>
  );
}
export function Records({
  kind,
  go,
  initialStatus = 'ALL',
}: {
  kind: string;
  go: Navigate;
  initialStatus?: string;
}) {
  const path = kind === 'spectacles' ? 'spectacle-orders' : kind;
  const query = useResource(() => listAll<Data>(`/${path}`), path);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [method, setMethod] = useState('ALL');
  const [visitDate, setVisitDate] = useState(kind === 'visits' ? today() : '');
  const totals = useResource(async () => {
    if (kind !== 'payments') return null;
    const [summary, daily] = await Promise.all([
      request<Data>('/dashboard/summary'),
      request<Data>(`/reports/collection/daily?date=${today()}`),
    ]);
    return { summary, daily };
  }, `totals-${kind}`);
  const rows = (query.data || []).filter(
    r =>
      [
        r.name,
        r.mobile,
        r.patientId,
        r.patient?.name,
        r.visitId,
        r.orderId,
        r.paymentId,
        r.genericName,
        r.frameName,
        r.lensType,
        r.referenceNumber,
        r.paymentMethod,
      ].some(v =>
        String(v || '')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ) &&
      (status === 'ALL' || r.status === status) &&
      (kind !== 'payments' || method === 'ALL' || r.paymentMethod === method) &&
      (!visitDate ||
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
          new Date(r.visitDate),
        ) === visitDate),
  );
  return (
    <FlatList
      renderScrollComponent={props => <KeyboardScrollView {...props} />}
      data={query.error ? [] : rows}
      keyExtractor={r => r._id}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={query.loading}
          onRefresh={() => {
            void query.refresh();
            void totals.refresh();
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 16 }}>
          {kind === 'spectacles' ? (
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <View style={{ flex: 1, minWidth: 160 }}>
                <Title
                  sub={`${query.data?.length || 0} orders · Frames & lenses`}
                >
                  Orders
                </Title>
              </View>
              <IconButton
                title="New spectacle order"
                icon={Plus}
                onPress={() => go({ name: 'select-patient', kind: 'order' })}
              />
            </View>
          ) : (
            <Title
              sub={
                kind === 'patients'
                  ? `${
                      query.data?.length || 0
                    } registered patients · Records & visit history`
                  : `${query.data?.length || 0} records in your clinic`
              }
            >
              {kind === 'spectacles' ? 'Spectacle orders' : label(kind)}
            </Title>
          )}
          {kind === 'payments' && (
            <>
              <ErrorBox message={totals.error} />
              {totals.data && <PaymentSummary data={totals.data} />}
            </>
          )}
          {kind === 'visits' && (
            <>
              <Field
                title="Visit date (YYYY-MM-DD, clear for all)"
                value={visitDate}
                onChange={setVisitDate}
              />
              <View style={styles.row}>
                <Button
                  secondary
                  title="Today"
                  onPress={() => setVisitDate(today())}
                />
                <Button
                  secondary
                  title="All visits"
                  onPress={() => setVisitDate('')}
                />
              </View>
            </>
          )}
          <Field
            title="Search"
            placeholder={
              kind === 'patients'
                ? 'Search name, phone or patient ID'
                : kind === 'payments'
                ? 'Patient, payment ID or reference'
                : kind === 'spectacles'
                ? 'Patient, order ID, frame or lens'
                : 'Name, phone, or record number'
            }
            value={search}
            onChange={setSearch}
          />
          {kind === 'spectacles' && (
            <View style={{ gap: 10 }}>
              <OrderFilters
                value={status}
                onChange={setStatus}
                orders={query.data || []}
              />
              <Text style={styles.muted}>
                {rows.length} {rows.length === 1 ? 'order' : 'orders'}
                {status !== 'ALL' ? ` · ${orderStatusName(status)}` : ''}
              </Text>
            </View>
          )}
          {kind === 'payments' && (
            <PaymentFilters value={method} onChange={setMethod} />
          )}
          {kind === 'patients' ? (
            <OrderAction
              title="Register patient"
              icon={Plus}
              primary
              onPress={() => go({ name: 'form', kind: 'patient' })}
            />
          ) : kind === 'payments' ? (
            <OrderAction
              title="Receive payment"
              icon={Banknote}
              primary
              onPress={() => go({ name: 'select-patient', kind: 'payment' })}
            />
          ) : kind === 'spectacles' ? null : (
            <Button
              title={
                kind === 'patients'
                  ? '+ Register patient'
                  : kind === 'medicines'
                  ? '+ Add medicine'
                  : kind === 'payments'
                  ? '+ Record payment'
                  : kind === 'visits'
                  ? '+ New visit'
                  : '+ New spectacle order'
              }
              onPress={() =>
                go(
                  kind === 'patients' || kind === 'medicines'
                    ? {
                        name: 'form',
                        kind: kind === 'patients' ? 'patient' : 'medicine',
                      }
                    : {
                        name: 'select-patient',
                        kind:
                          kind === 'payments'
                            ? 'payment'
                            : kind === 'visits'
                            ? 'visit'
                            : 'order',
                      },
                )
              }
            />
          )}
          {kind === 'patients' && !!query.data?.length && (
            <Text style={styles.muted}>
              {search ? `${rows.length} matching patients` : 'All patients'}
            </Text>
          )}
          {query.error && (
            <>
              <ErrorBox message={query.error} />
              <Button title="Retry" onPress={() => void query.refresh()} />
            </>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ marginBottom: 14 }}>
          <RecordCard record={item} kind={kind} go={go} />
        </View>
      )}
      ListEmptyComponent={
        query.loading ? (
          <Loading />
        ) : !query.error ? (
          <Empty
            text={
              search ||
              status !== 'ALL' ||
              (kind === 'payments' && method !== 'ALL')
                ? 'No records match your search or filters.'
                : 'Use the button above to add your first record.'
            }
          />
        ) : null
      }
    />
  );
}
export function PatientPicker({ go, kind }: { go: Navigate; kind: string }) {
  const query = useResource(() => listAll<Data>('/patients'), 'pick-patients');
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const patients = (query.data || []).filter(p =>
    [p.name, p.mobile, p.patientId].some(value =>
      String(value || '')
        .toLowerCase()
        .includes(term),
    ),
  );
  const purpose =
    kind === 'payment'
      ? 'Receive payment'
      : kind === 'order'
      ? 'New spectacle order'
      : 'New visit';
  const Icon =
    kind === 'payment' ? Banknote : kind === 'order' ? Glasses : CalendarPlus;
  return (
    <Page query={query}>
      <View style={{ gap: 14 }}>
        <Title sub="Search and tap a patient to continue">Select patient</Title>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.pale,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Icon size={19} color={colors.primary} />
          <Text
            style={{
              color: colors.primary,
              fontSize: 13,
              fontWeight: '600',
              flex: 1,
            }}
          >
            {purpose}
          </Text>
        </View>
        <Field
          title="Search patients"
          placeholder="Name, phone number or patient ID"
          value={search}
          onChange={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.muted}>
            {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
            {term ? ' found' : ' available'}
          </Text>
          {!!search && (
            <IconButton
              title="Clear search"
              icon={X}
              onPress={() => setSearch('')}
            />
          )}
        </View>
      </View>
      <View style={{ gap: 10 }}>
        {patients.map(p => (
          <PatientSelectionCard
            key={p._id}
            patient={p}
            onSelect={() =>
              go({
                name: kind === 'payment' ? 'payment' : 'form',
                kind,
                id: p._id,
              })
            }
          />
        ))}
        {!patients.length && (
          <Empty
            text={
              query.data?.length
                ? 'No matching patients. Try another name, phone number or patient ID.'
                : 'No patients registered yet.'
            }
          />
        )}
        {query.data?.length === 0 && (
          <OrderAction
            title="Register patient"
            icon={Plus}
            primary
            onPress={() => go({ name: 'form', kind: 'patient' })}
          />
        )}
      </View>
    </Page>
  );
}
export function DetailFields({ data }: { data?: Data }) {
  if (!data) return null;
  return (
    <View style={{ gap: 8 }}>
      {Object.entries(data)
        .filter(
          ([k, v]) =>
            ![
              '_id',
              '__v',
              'patient',
              'createdBy',
              'updatedBy',
              'isActive',
              'createdAt',
              'updatedAt',
              'medicine',
            ].includes(k) &&
            v != null &&
            v !== '' &&
            !(Array.isArray(v) && !v.length),
        )
        .map(([key, value]) =>
          value && typeof value === 'object' ? (
            <View
              key={key}
              style={{
                paddingLeft: 10,
                borderLeftWidth: 2,
                borderColor: colors.line,
                gap: 8,
              }}
            >
              <Text style={[styles.muted, { fontWeight: '700' }]}>
                {label(key)}
              </Text>
              {Array.isArray(value) ? (
                value.map((v, i) =>
                  typeof v === 'object' ? (
                    <DetailFields key={i} data={v} />
                  ) : (
                    <Text key={i} style={styles.text}>
                      {String(v)}
                    </Text>
                  ),
                )
              ) : (
                <DetailFields data={value} />
              )}
            </View>
          ) : (
            <View key={key} style={{ gap: 2 }}>
              <Text style={styles.muted}>{label(key)}</Text>
              <Text selectable style={styles.text}>
                {typeof value === 'boolean'
                  ? value
                    ? 'Yes'
                    : 'No'
                  : String(value)}
              </Text>
            </View>
          ),
        )}
    </View>
  );
}
export function PatientScreen({ id, go }: { id: string; go: Navigate }) {
  const showPopup = usePopup();
  const query = useResource(async () => {
    const [details, visits, orders, payments, timeline] = await Promise.all([
      request<Data>(`/patients/${id}/details`),
      listAll<Data>(`/visits?patient=${id}`),
      listAll<Data>(`/spectacle-orders?patient=${id}`),
      listAll<Data>(`/patients/${id}/payments`),
      request<Data[]>(`/patients/${id}/timeline`),
    ]);
    return { details, visits, orders, payments, timeline };
  }, id);
  const [tab, setTab] = useState('Overview');
  const d = query.data;
  const p = d?.details.patient;
  return (
    <Page query={query}>
      {p && (
        <>
          <Title
            sub={`${p.patientId} · ${p.age ?? '—'} years · ${label(
              p.gender || '',
            )}`}
          >
            {p.name}
          </Title>
          <Card>
            <View style={styles.row}>
              <View style={{ flexGrow: 1, flexBasis: 160 }}>
                <Text style={styles.muted}>Outstanding balance</Text>
                <Text style={[styles.title, { color: colors.primary }]}>
                  {money(d?.details.paymentSummary.due)}
                </Text>
              </View>
              <IconButton
                icon={Banknote}
                title="Receive payment"
                onPress={() => go({ name: 'payment', id })}
              />
            </View>
            <Text style={styles.muted}>
              Billed {money(d?.details.paymentSummary.totalBilled)} · Paid{' '}
              {money(d?.details.paymentSummary.totalPaid)}
            </Text>
          </Card>
          <View style={styles.row}>
            <IconButton
              icon={CalendarPlus}
              title="New visit"
              onPress={() => go({ name: 'form', kind: 'visit', id })}
            />
            <IconButton
              icon={Glasses}
              title="Spectacle order"
              onPress={() => go({ name: 'form', kind: 'order', id })}
            />
            <IconButton
              icon={UserPen}
              title="Edit patient"
              onPress={() => go({ name: 'form', kind: 'patient', initial: p })}
            />
            <IconButton
              icon={Trash2}
              title="Delete patient"
              danger
              onPress={() =>
                showPopup(
                  'Delete patient?',
                  `${p.name} will be removed from the active list. All patient details, bills and payment history will be preserved for future recovery.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        void request(`/patients/${id}`, 'DELETE')
                          .then(() => go({ name: 'patients' }))
                          .catch(e =>
                            showPopup('Could not delete patient', e.message),
                          );
                      },
                    },
                  ],
                )
              }
            />
            {p.mobile && (
              <IconButton
                icon={Phone}
                title="Call patient"
                onPress={() => {
                  void Linking.openURL(
                    `tel:${p.mobile.replace(/[^+\d]/g, '')}`,
                  ).catch(() =>
                    showPopup('Unable to call', 'No phone app is available.'),
                  );
                }}
              />
            )}
            <IconButton
              icon={ReceiptText}
              title="Registration receipt"
              onPress={() => go({ name: 'receipt', kind: 'patient', id })}
            />
          </View>
          <View style={[styles.row, { gap: 8, paddingVertical: 6 }]}>
            {(
              [
                ['Overview', UserRound],
                ['Visits', ClipboardList],
                ['Orders', Glasses],
                ['Payments', Wallet],
                ['Timeline', History],
              ] as const
            ).map(([name, icon]) => (
              <IconButton
                key={name}
                title={name}
                icon={icon}
                tab
                selected={tab === name}
                onPress={() => setTab(name)}
              />
            ))}
          </View>
          <Heading>{tab}</Heading>
          {tab === 'Overview' && (
            <>
              <PatientDetailsCard data={p} />
              {d?.details.latestVisit && (
                <PatientDetailsCard data={d.details.latestVisit} examination />
              )}
            </>
          )}
          {(['Visits', 'Orders', 'Payments'] as const).includes(tab as any) &&
            (
              (tab === 'Visits'
                ? d?.visits
                : tab === 'Orders'
                ? d?.orders
                : d?.payments) || []
            ).map(r => (
              <RecordCard
                key={r._id}
                compactActions
                record={r}
                kind={tab === 'Orders' ? 'spectacles' : tab.toLowerCase()}
                go={go}
              />
            ))}
          {tab !== 'Overview' &&
            tab !== 'Timeline' &&
            !(
              tab === 'Visits'
                ? d?.visits
                : tab === 'Orders'
                ? d?.orders
                : d?.payments
            )?.length && <Empty />}
          {tab === 'Timeline' &&
            (d?.timeline.length ? (
              d.timeline.map((event, i) => (
                <Card key={`${event.type}-${i}`}>
                  <Heading>
                    {label(event.type)} · {date(event.date)}
                  </Heading>
                  <DetailFields data={event.data} />
                </Card>
              ))
            ) : (
              <Empty />
            ))}
        </>
      )}
    </Page>
  );
}
export function FormScreen({
  route,
  go,
  dirty,
}: {
  route: Route;
  go: Navigate;
  dirty: () => void;
}) {
  const showPopup = usePopup();
  const kind = route.kind as FormKind;
  const query = useResource(async () => {
    if (kind === 'settings')
      return {
        initial: await request<Data>('/settings'),
        medicines: [] as Data[],
        patient: null as Data | null,
      };
    if ((kind === 'visit' || kind === 'order') && route.id) {
      const [detail, settings, medicines] = await Promise.all([
        request<Data>(`/patients/${route.id}/details`),
        request<Data>('/settings'),
        kind === 'visit' ? listAll<Data>('/medicines') : Promise.resolve([]),
      ]);
      const eye =
        detail.latestEyeExamination || detail.patient.investigation || {};
      return {
        initial:
          route.initial ||
          (kind === 'visit'
            ? {
                charges: {
                  consultation: settings.defaultConsultationFee || 0,
                  other: 0,
                  discount: 0,
                },
              }
            : {
                rightEye: eye.rightEye,
                leftEye: eye.leftEye,
                pd: eye.pd,
                ...(detail.latestVisit
                  ? { visit: detail.latestVisit._id }
                  : {}),
              }),
        medicines,
        patient: detail.patient,
      };
    }
    return {
      initial: route.initial || {},
      medicines: [] as Data[],
      patient: null as Data | null,
    };
  }, `${kind}-${route.id || route.initial?._id || 'new'}`);
  return (
    <Page query={query} refreshable={false}>
      <Title sub={query.data?.patient?.name}>
        {kind === 'settings'
          ? 'Clinic settings'
          : `${route.initial?._id ? 'Edit' : 'New'} ${
              kind === 'order' ? 'spectacle order' : kind
            }`}
      </Title>
      {query.data?.patient?.allergies && (
        <ErrorBox
          message={`Recorded allergies: ${query.data.patient.allergies}`}
        />
      )}
      {kind === 'order' && (
        <Text style={styles.muted}>
          Latest eye readings are prefilled. Check the final prescription before
          saving.
        </Text>
      )}
      {query.data && (
        <RecordForm
          kind={kind}
          initial={query.data.initial}
          patientId={route.id}
          medicines={query.data.medicines}
          onDirty={dirty}
          onSaved={record => {
            showPopup('Saved', `${label(kind)} saved successfully.`);
            go(
              kind === 'patient'
                ? { name: 'patient', id: record._id }
                : kind === 'visit' || kind === 'order'
                ? { name: 'receipt', kind, id: record._id }
                : { name: kind === 'medicine' ? 'medicines' : 'more' },
            );
          }}
        />
      )}
    </Page>
  );
}
export function PaymentScreen({
  id,
  go,
  dirty,
}: {
  id: string;
  go: Navigate;
  dirty: () => void;
}) {
  const showPopup = usePopup();
  const query = useResource(async () => {
    const [patient, visits, orders, payments] = await Promise.all([
      request<Data>(`/patients/${id}`),
      listAll<Data>(`/visits?patient=${id}`),
      listAll<Data>(`/spectacle-orders?patient=${id}`),
      listAll<Data>(`/payments?patient=${id}`),
    ]);
    return { patient, bills: outstanding(visits, orders, payments) };
  }, id);
  const [billId, setBillId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(today());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const bill = query.data?.bills.find(b => b.id === billId);
  async function save() {
    if (lock.current) return;
    setError('');
    if (!bill) {
      setError('Select an outstanding bill.');
      return;
    }
    if (
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      Number(amount) > bill.due
    ) {
      setError('Enter an amount above zero and no more than the bill due.');
      return;
    }
    if (!validateDate(paymentDate)) {
      setError('Enter a valid payment date (YYYY-MM-DD).');
      return;
    }
    lock.current = true;
    setSaving(true);
    try {
      const result = await request<Data>('/payments', 'POST', {
        patient: id,
        [bill.kind]: bill.id,
        amount: Number(amount),
        paymentMethod: method,
        referenceNumber: reference,
        notes,
        paymentDate,
      });
      go({ name: 'receipt', kind: 'payment', id: result._id });
    } catch (e) {
      setError(
        `${
          e instanceof Error ? e.message : 'Could not record payment.'
        } If the connection was interrupted, refresh payment history before retrying to avoid a duplicate.`,
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  return (
    <Page query={query}>
      <Title sub={query.data?.patient.name}>Receive payment</Title>
      <Text style={styles.muted}>
        Record money already received. Verify UPI / QR payments before saving.
      </Text>
      {query.data?.bills.length ? (
        <>
          <FormSection
            title="Payment details"
            subtitle="Choose a bill and enter the amount received"
          >
            <Choice
              title="Outstanding bill"
              value={billId}
              options={query.data.bills.map(b => ({
                value: b.id,
                name: `${b.name} · Due ${money(b.due)}`,
              }))}
              onChange={v => {
                dirty();
                setBillId(v);
              }}
            />
            {bill && <Heading>Due {money(bill.due)}</Heading>}
            <Field
              title="Amount received (₹)"
              numeric
              value={amount}
              onChange={v => {
                dirty();
                setAmount(v);
              }}
            />
            <Choice
              title="Payment method"
              value={method}
              options={['CASH', 'UPI', 'CARD', 'OTHER']}
              onChange={v => {
                dirty();
                setMethod(v);
              }}
            />
            <Field
              title="Payment date (YYYY-MM-DD)"
              value={paymentDate}
              onChange={v => {
                dirty();
                setPaymentDate(v);
              }}
            />
          </FormSection>
          <FormSection
            title="Transaction details"
            subtitle="Reference & payment notes"
          >
            <Field
              title="Reference number"
              value={reference}
              onChange={v => {
                dirty();
                setReference(v);
              }}
            />
            <Field
              title="Notes"
              multiline
              value={notes}
              onChange={v => {
                dirty();
                setNotes(v);
              }}
            />
            <ErrorBox message={error} />
            <Button
              title={saving ? 'Recording…' : 'Confirm received payment'}
              disabled={saving}
              onPress={() =>
                showPopup(
                  'Record payment?',
                  `${money(Number(amount))} received by ${label(method)}.`,
                  [
                    { text: 'Back', style: 'cancel' },
                    { text: 'Record', onPress: () => void save() },
                  ],
                )
              }
            />
          </FormSection>
        </>
      ) : (
        <Empty text="This patient has no outstanding bills." />
      )}
    </Page>
  );
}
export function OrderScreen({ route, go }: { route: Route; go: Navigate }) {
  const showPopup = usePopup();
  const query = useResource(
    () => request<Data>(`/receipts/order/${route.id}`),
    route.id!,
  );
  const order = query.data?.order;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function update(status: string) {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      await request(`/spectacle-orders/${route.id}`, 'PATCH', { status });
      await query.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update order.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  const next =
    order &&
    (
      {
        ORDERED: 'IN_PROCESS',
        IN_PROCESS: 'READY',
        READY: 'DELIVERED',
      } as Record<string, string>
    )[order.status];
  return (
    <Page query={query}>
      {order && (
        <>
          <Title sub={query.data?.patient.name}>{order.orderId}</Title>
          <OrderDetails
            order={order}
            due={query.data?.due ?? order.remainingAmount}
          />
          <ErrorBox message={error} />
          <View style={styles.row}>
            {next && (
              <OrderAction
                icon={Check}
                primary
                disabled={saving}
                title={saving ? 'Updating…' : `Mark ${orderStatusName(next)}`}
                onPress={() => void update(next)}
              />
            )}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <OrderAction
                icon={Pencil}
                disabled={saving}
                title="Edit order"
                onPress={() =>
                  go({
                    name: 'form',
                    kind: 'order',
                    id: idOf(order.patient),
                    initial: order,
                  })
                }
              />
            )}
            {next && !order.advanceAmount && (
              <OrderAction
                icon={X}
                danger
                disabled={saving}
                title="Cancel unpaid order"
                onPress={() =>
                  showPopup(
                    'Cancel this order?',
                    'This will remove its outstanding due.',
                    [
                      { text: 'Keep order', style: 'cancel' },
                      {
                        text: 'Cancel order',
                        style: 'destructive',
                        onPress: () => void update('CANCELLED'),
                      },
                    ],
                  )
                }
              />
            )}
            <OrderAction
              icon={ReceiptText}
              title="View receipt"
              onPress={() =>
                go({ name: 'receipt', kind: 'order', id: route.id })
              }
            />
            <OrderAction
              icon={History}
              title="Patient history"
              onPress={() =>
                go({ name: 'patient', id: query.data?.patient._id })
              }
            />
          </View>
        </>
      )}
    </Page>
  );
}
export function ReceiptScreen({ route }: { route: Route }) {
  const query = useResource(
    () => request<Data>(`/receipts/${route.kind}/${route.id}`),
    `${route.kind}-${route.id}`,
  );
  const r = query.data;
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);
  async function print() {
    if (!r || printing) return;
    setPrinting(true);
    setError('');
    try {
      await RNPrint.print({ html: receiptHtml(r) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Printing unavailable.');
    } finally {
      setPrinting(false);
    }
  }
  return (
    <Page query={query}>
      {r && (
        <>
          <ReceiptView receipt={r} />
          <ErrorBox message={error} />
          <View style={styles.row}>
            <OrderAction
              icon={Printer}
              primary
              disabled={printing}
              title={printing ? 'Opening print options…' : 'Print / Save PDF'}
              onPress={() => void print()}
            />
            <OrderAction
              icon={Share2}
              title="Share summary"
              onPress={() => {
                void Share.share({
                  message: `${
                    r.settings.shopName || 'Chirag Eye Care & Optics'
                  }\n${r.number} · ${date(r.date)}\n${r.patient.name}\n${
                    r.kind === 'patient'
                      ? `Patient ID: ${r.patient.patientId}`
                      : `Total: ${money(r.total)}\nPaid: ${money(
                          r.paid,
                        )}\nDue: ${money(r.due)}`
                  }`,
                }).catch(e => setError(e.message));
              }}
            />
          </View>
        </>
      )}
    </Page>
  );
}
export function Reports() {
  const [from, setFrom] = useState(`${today().slice(0, 8)}01`);
  const [to, setTo] = useState(today());
  const [range, setRange] = useState({ from, to });
  const [error, setError] = useState('');
  const query = useResource(
    () =>
      request<Data>(`/reports/collection?from=${range.from}&to=${range.to}`),
    `${range.from}-${range.to}`,
  );
  function apply(a = from, b = to) {
    if (!validateDate(a) || !validateDate(b) || a > b) {
      setError('Enter valid dates with start on or before end.');
      return;
    }
    setError('');
    setFrom(a);
    setTo(b);
    setRange({ from: a, to: b });
  }
  return (
    <Page>
      <Title sub="Collections by date and payment method">Reports</Title>
      <FormSection
        title="Report period"
        subtitle="Choose a preset or set your own dates"
      >
        <View style={styles.row}>
          <Button
            secondary
            title="Today"
            onPress={() => apply(today(), today())}
          />
          <Button
            secondary
            title="This month"
            onPress={() => apply(`${today().slice(0, 8)}01`, today())}
          />
          <Button
            secondary
            title="Last 7 days"
            onPress={() => {
              const d = new Date(`${today()}T12:00:00Z`);
              d.setUTCDate(d.getUTCDate() - 6);
              apply(d.toISOString().slice(0, 10), today());
            }}
          />
        </View>
        <Field title="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
        <Field title="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        <ErrorBox message={error} />
        <Button title="Apply date range" onPress={() => apply()} />
      </FormSection>
      {query.loading ? (
        <Loading />
      ) : query.error ? (
        <>
          <ErrorBox message={query.error} />
          <Button title="Retry" onPress={() => void query.refresh()} />
        </>
      ) : (
        query.data && (
          <>
            <Card>
              <Text style={styles.muted}>
                {date(range.from)} – {date(range.to)}
              </Text>
              <Title>{money(query.data.totalCollection)}</Title>
              <Text style={styles.muted}>Total received</Text>
            </Card>
            <Card>
              <Heading>Payment methods</Heading>
              {Object.entries(query.data.paymentMethods).map(([key, value]) => (
                <View
                  key={key}
                  style={[styles.row, { justifyContent: 'space-between' }]}
                >
                  <Text style={styles.text}>{label(key)}</Text>
                  <Heading>{money(Number(value))}</Heading>
                </View>
              ))}
            </Card>
            <Card>
              <Heading>Daily collections</Heading>
              <Trend rows={query.data.trend || []} />
            </Card>
            <Button
              secondary
              title="Share collection report"
              onPress={() => {
                void Share.share({
                  message: `Collection report\n${range.from} to ${
                    range.to
                  }\nTotal: ${money(
                    query.data!.totalCollection,
                  )}\n${Object.entries(query.data!.paymentMethods)
                    .map(([k, v]) => `${label(k)}: ${money(Number(v))}`)
                    .join('\n')}\n${query
                    .data!.trend.map(
                      (r: Data) => `${r.date}: ${money(r.collection)}`,
                    )
                    .join('\n')}`,
                }).catch(e => setError(e.message));
              }}
            />
          </>
        )
      )}
    </Page>
  );
}
export function PasswordScreen({ onSaved }: { onSaved: () => void }) {
  const showPopup = usePopup();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    if (next.length < 8 || next !== confirm) {
      setError('Use at least 8 characters and match the confirmation.');
      return;
    }
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      await request('/auth/change-password', 'POST', {
        currentPassword: current,
        newPassword: next,
      });
      showPopup('Password updated');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update password.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  return (
    <Page>
      <Title>Change password</Title>
      <FormSection
        title="Account security"
        subtitle="Use at least 8 characters for your new password"
      >
        <Field
          title="Current password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          value={current}
          onChange={setCurrent}
        />
        <Field
          title="New password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          value={next}
          onChange={setNext}
        />
        <Field
          title="Confirm new password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          value={confirm}
          onChange={setConfirm}
        />
        <ErrorBox message={error} />
        <Button
          disabled={saving}
          title={saving ? 'Updating…' : 'Update password'}
          onPress={() => void save()}
        />
      </FormSection>
    </Page>
  );
}
