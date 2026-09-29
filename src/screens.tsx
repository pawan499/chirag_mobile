import { AppPressable as Pressable } from './pressable';
import { Trash2 } from 'lucide-react-native';
import { usePopup } from './popup';
import { PaymentEditor, paymentTime } from './payment-editor';
import React, { useRef, useState } from 'react';
import {
  Image,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
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
  statuses,
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
    <ScrollView
      keyboardShouldPersistTaps="handled"
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
    </ScrollView>
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
      <Title sub={`${date(today())} · Your clinic at a glance`}>
        Hello, {user.split(' ')[0] || 'Doctor'} 👋
      </Title>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.ink, borderColor: colors.ink, padding: 24 },
        ]}
      >
        <Text style={{ color: '#B6DAD0', fontSize: 14 }}>
          TODAY’S COLLECTION
        </Text>
        <Text style={{ fontSize: 40, fontWeight: '800', color: '#fff' }}>
          {money(d?.summary.todayCollection)}
        </Text>
        <Text style={{ color: '#CAE1D8' }}>
          {d?.summary.todayPatients || 0} patients seen today
        </Text>
        <Button
          title="+ Register patient"
          onPress={() => go({ name: 'form', kind: 'patient' })}
        />
      </View>
      <View style={styles.row}>
        {[
          ['This week', d?.summary.weeklyCollection],
          ['This month', d?.summary.monthlyCollection],
          ['Outstanding dues', d?.summary.pendingDue],
        ].map(([name, amount]) => (
          <View
            key={name}
            style={[
              styles.card,
              { flexGrow: 1, flexBasis: '45%', minWidth: 0, maxWidth: '100%' },
            ]}
          >
            <Text style={styles.muted}>{name}</Text>
            <Heading>{money(Number(amount || 0))}</Heading>
          </View>
        ))}
      </View>
      <Heading>Quick actions</Heading>
      <View style={styles.row}>
        {['Patients', 'Visits', 'Spectacles', 'Payments'].map(name => (
          <Button
            key={name}
            secondary
            title={name}
            onPress={() => go({ name: name.toLowerCase() })}
          />
        ))}
      </View>
      <Card>
        <Heading>Today’s payment methods</Heading>
        {Object.entries(d?.daily.paymentMethods || {}).map(
          ([method, amount]) => (
            <View
              key={method}
              style={[styles.row, { justifyContent: 'space-between' }]}
            >
              <Text style={styles.text}>{label(method)}</Text>
              <Heading>{money(Number(amount))}</Heading>
            </View>
          ),
        )}
        <Button
          secondary
          title="Collection reports →"
          onPress={() => go({ name: 'reports' })}
        />
      </Card>
      <Card>
        <Heading>Collections this week</Heading>
        <Trend rows={d?.trend.trend || []} />
      </Card>
      <Card>
        <Heading>Spectacle orders</Heading>
        {Object.entries(d?.summary.spectacleOrders || {}).map(
          ([key, value]) => (
            <Button
              key={key}
              secondary
              title={`${label(key)} · ${value} →`}
              onPress={() => go({ name: 'spectacles', kind: key })}
            />
          ),
        )}
        <Button
          secondary
          title="Manage orders →"
          onPress={() => go({ name: 'spectacles' })}
        />
      </Card>
      <Heading>Recent visits</Heading>
      {d?.visits.length ? (
        d.visits.map(v => (
          <RecordCard key={v._id} record={v} kind="visits" go={go} />
        ))
      ) : (
        <Empty text="Consultations will appear here after your first visit." />
      )}
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
                  width: `${Math.max(1, (r.collection / max) * 100)}%`,
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
export function RecordCard({
  record: r,
  kind,
  go,
}: {
  record: Data;
  kind: string;
  go: Navigate;
}) {
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
      {kind === 'patients' && (
        <>
          <Text style={styles.muted}>
            {[
              r.mobile,
              r.age != null ? `${r.age} years` : '',
              r.gender && label(r.gender),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Button
            secondary
            title="Open patient →"
            onPress={() => go({ name: 'patient', id: r._id })}
          />
        </>
      )}
      {kind === 'visits' && (
        <>
          <Text style={styles.text}>
            {date(r.visitDate)} · {money(r.charges?.total)}
          </Text>
          <Text style={styles.muted}>{r.complaint || 'Eye examination'}</Text>
          <Button
            secondary
            title="Examination & prescription →"
            onPress={() => go({ name: 'receipt', kind: 'visit', id: r._id })}
          />
        </>
      )}
      {kind === 'spectacles' && (
        <>
          <Text style={styles.text}>
            {r.frameName || 'Frame'} · {r.lensType || 'Lens'}
          </Text>
          <Text style={[styles.muted, { color: colors.primary }]}>
            {label(r.status)} · Delivery {date(r.deliveryDate)}
          </Text>
          <Text style={styles.text}>
            Total {money(r.totalAmount)} · Due{' '}
            {money(r.status === 'CANCELLED' ? 0 : r.remainingAmount)}
          </Text>
          <Button
            secondary
            title="Manage order →"
            onPress={() => go({ name: 'order', id: r._id, initial: r })}
          />
        </>
      )}
      {kind === 'payments' && (
        <>
          <Heading>{money(r.amount)}</Heading>
          <Text style={styles.muted}>
            {label(r.paymentMethod)} · {paymentTime(r.paymentDate)}
            {r.referenceNumber ? ` · ${r.referenceNumber}` : ''}
          </Text>
          <PaymentEditor payment={r} onSaved={() => go({ name: 'payments' })} />
          <Button
            secondary
            title="Payment receipt →"
            onPress={() => go({ name: 'receipt', kind: 'payment', id: r._id })}
          />
        </>
      )}
      {kind === 'medicines' && (
        <>
          <Text style={styles.text}>
            {money(r.defaultPrice)} / {r.unit || 'unit'}
          </Text>
          <Text style={styles.muted}>{r.description}</Text>
          <Button
            secondary
            title="Edit medicine"
            onPress={() => go({ name: 'form', kind: 'medicine', initial: r })}
          />
        </>
      )}
      {patientId && kind !== 'patients' && (
        <Button
          secondary
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
        r.referenceNumber,
        r.paymentMethod,
      ].some(v =>
        String(v || '')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ) &&
      (status === 'ALL' || r.status === status) &&
      (!visitDate ||
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
          new Date(r.visitDate),
        ) === visitDate),
  );
  return (
    <FlatList
      data={query.error ? [] : rows}
      keyExtractor={r => r._id}
      keyboardShouldPersistTaps="handled"
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
          <Title sub={`${query.data?.length || 0} records in your clinic`}>
            {label(kind)}
          </Title>
          {kind === 'payments' && (
            <>
              <ErrorBox message={totals.error} />
              {totals.data && (
                <Card>
                  {[
                    ['Today received', totals.data.daily.totalCollection],
                    ['Cash today', totals.data.daily.paymentMethods.CASH],
                    ['Outstanding bills', totals.data.summary.pendingDue],
                  ].map(([name, value]) => (
                    <View
                      key={name}
                      style={[styles.row, { justifyContent: 'space-between' }]}
                    >
                      <Text style={styles.muted}>{name}</Text>
                      <Heading>{money(Number(value))}</Heading>
                    </View>
                  ))}
                </Card>
              )}
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
            placeholder="Name, phone, or record number"
            value={search}
            onChange={setSearch}
          />
          {kind === 'spectacles' && (
            <Choice
              title="Order status"
              value={status}
              options={['ALL', ...statuses]}
              onChange={setStatus}
            />
          )}
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
              search
                ? 'No records match your search.'
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
  return (
    <Page query={query}>
      <Title sub="Choose the patient for this record">Select patient</Title>
      <Field title="Search patients" value={search} onChange={setSearch} />
      {query.data
        ?.filter(p =>
          `${p.name} ${p.mobile} ${p.patientId}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .map(p => (
          <Card key={p._id}>
            <Heading>{p.name}</Heading>
            <Text style={styles.muted}>
              {p.patientId} · {p.mobile}
            </Text>
            <Button
              secondary
              title="Continue →"
              onPress={() =>
                go({
                  name: kind === 'payment' ? 'payment' : 'form',
                  kind,
                  id: p._id,
                })
              }
            />
          </Card>
        ))}
      {query.data?.length === 0 && <Empty text="Register a patient first." />}
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
              <Button
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
            <Button
              title="+ New visit"
              onPress={() => go({ name: 'form', kind: 'visit', id })}
            />
            <Button
              secondary
              title="+ Spectacle order"
              onPress={() => go({ name: 'form', kind: 'order', id })}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                maxWidth: '100%',
              }}
            >
              <View style={{ flexShrink: 1 }}>
                <Button
                  secondary
                  title="Edit patient"
                  onPress={() =>
                    go({ name: 'form', kind: 'patient', initial: p })
                  }
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete patient"
                style={({ pressed }) => ({
                  width: 48,
                  minHeight: 50,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFF0ED',
                  opacity: pressed ? 0.7 : 1,
                })}
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
              >
                <Trash2 size={21} color={colors.red} />
              </Pressable>
            </View>
            {p.mobile && (
              <Button
                secondary
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
            <Button
              secondary
              title="Registration receipt"
              onPress={() => go({ name: 'receipt', kind: 'patient', id })}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.row}>
              {['Overview', 'Visits', 'Orders', 'Payments', 'Timeline'].map(
                t => (
                  <Button
                    key={t}
                    secondary={tab !== t}
                    title={t}
                    onPress={() => setTab(t)}
                  />
                ),
              )}
            </View>
          </ScrollView>
          {tab === 'Overview' && (
            <>
              <Card>
                <Heading>Patient information</Heading>
                <DetailFields data={p} />
              </Card>
              {d?.details.latestVisit && (
                <Card>
                  <Heading>Latest examination</Heading>
                  <DetailFields data={d.details.latestVisit} />
                </Card>
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
        <Card>
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
        </Card>
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
          <Card>
            <Heading>{label(order.status)}</Heading>
            <Text style={styles.text}>
              Total {money(order.totalAmount)} · Due {money(query.data?.due)}
            </Text>
            <DetailFields data={order} />
          </Card>
          <ErrorBox message={error} />
          {next && (
            <Button
              disabled={saving}
              title={`Mark ${label(next)}`}
              onPress={() => void update(next)}
            />
          )}
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <Button
              secondary
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
            <Button
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
          <Button
            secondary
            title="View receipt"
            onPress={() => go({ name: 'receipt', kind: 'order', id: route.id })}
          />
          <Button
            secondary
            title="Patient history"
            onPress={() => go({ name: 'patient', id: query.data?.patient._id })}
          />
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
          <Title sub={`${r.number} · ${date(r.date)}`}>
            {r.kind === 'visit'
              ? 'Bill & prescription'
              : r.kind === 'patient'
              ? 'Registration receipt'
              : 'Receipt'}
          </Title>
          <Card>
            <Image
              source={require('../assets/brand-icon.png')}
              accessibilityLabel="Chirag logo"
              style={{
                width: 64,
                height: 64,
                alignSelf: 'center',
                marginBottom: 8,
              }}
            />
            <Heading>
              {r.settings.shopName || 'Chirag Eye Care & Optics'}
            </Heading>
            <Text style={styles.text}>{r.settings.doctorName}</Text>
            <Text style={styles.muted}>
              {[
                r.settings.address,
                r.settings.mobile,
                r.settings.email,
                r.settings.registrationNumber,
              ]
                .filter(Boolean)
                .join('\n')}
            </Text>
          </Card>
          <Card>
            <Heading>{r.patient.name}</Heading>
            <DetailFields
              data={
                r.kind === 'payment'
                  ? r.patient
                  : { ...r.patient, investigation: undefined }
              }
            />
          </Card>
          {r.payment?.editedAt && (
            <Card>
              <Heading>Edited · {paymentTime(r.payment.editedAt)} IST</Heading>
              {r.payment.editHistory?.map((edit: Data, i: number) => (
                <Text key={i} style={styles.text}>
                  {paymentTime(edit.editedAt)} IST — {edit.note}
                </Text>
              ))}
            </Card>
          )}
          {r.cancelled && <ErrorBox message="This order is cancelled." />}
          {r.kind === 'patient' && (
            <Card>
              <Heading>Registration investigation</Heading>
              <DetailFields data={r.patient.investigation} />
            </Card>
          )}
          {r.visit && (
            <Card>
              <Heading>Examination & prescription</Heading>
              <DetailFields data={r.visit} />
            </Card>
          )}
          {r.order && (
            <Card>
              <Heading>Spectacle order</Heading>
              <DetailFields data={r.order} />
            </Card>
          )}
          {r.payment && (
            <Card>
              <Heading>Payment received</Heading>
              <DetailFields data={r.payment} />
            </Card>
          )}
          {r.kind !== 'patient' && (
            <>
              <Card>
                <Heading>Total {money(r.total)}</Heading>
                <Text style={styles.text}>Paid {money(r.paid)}</Text>
                <Heading>Due {money(r.due)}</Heading>
              </Card>
              <Card>
                <Heading>Payment history</Heading>
                {r.payments.length ? (
                  r.payments.map((p: Data) => (
                    <Text key={p._id} style={styles.text}>
                      {p.paymentId} · {date(p.paymentDate)} · {p.paymentMethod}{' '}
                      · {money(p.amount)}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.muted}>No payments recorded.</Text>
                )}
              </Card>
            </>
          )}
          <ErrorBox message={error} />
          <Button
            disabled={printing}
            title={printing ? 'Opening print options…' : 'Print / Save PDF'}
            onPress={() => void print()}
          />
          <Button
            secondary
            title="Share receipt summary"
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
      <Card>
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
      </Card>
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
      <Card>
        <Field
          title="Current password"
          secureTextEntry
          value={current}
          onChange={setCurrent}
        />
        <Field
          title="New password"
          secureTextEntry
          value={next}
          onChange={setNext}
        />
        <Field
          title="Confirm new password"
          secureTextEntry
          value={confirm}
          onChange={setConfirm}
        />
        <ErrorBox message={error} />
        <Button
          disabled={saving}
          title={saving ? 'Updating…' : 'Update password'}
          onPress={() => void save()}
        />
      </Card>
    </Page>
  );
}
