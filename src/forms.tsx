import React, { useRef, useState } from 'react';
import { Switch, Text, View, useWindowDimensions } from 'react-native';
import { Button, Card, Choice, ErrorBox, Field, Heading, styles } from './ui';
import {
  clean,
  Data,
  label,
  money,
  validateDate,
  validateNumbers,
} from './domain';
import { request } from './api';
export type FormKind = 'patient' | 'visit' | 'order' | 'medicine' | 'settings';
const numericEye = ['sph', 'cyl', 'axis', 'add', 'iop'];
const eyeTitles: Record<string, string> = {
  sph: 'SPH',
  cyl: 'CYL',
  axis: 'Axis (0–180°)',
  add: 'ADD',
  iop: 'IOP (mmHg)',
  va: 'Visual acuity',
  unaidedVision: 'Unaided vision',
  correctedVision: 'Corrected vision',
  pinholeVision: 'Pinhole vision',
  nearVision: 'Near vision',
};
const distance = [
  'PL+',
  'PL-',
  'HM+',
  'HM-',
  '1/60',
  '2/60',
  '3/60',
  '4/60',
  '5/60',
  '6/60',
  '6/36',
  '6/24',
  '6/18',
  '6/12',
  '6/9',
  '6/6',
];
export function EyeForm({
  title,
  value = {},
  onChange,
  registration,
}: {
  title: string;
  value?: Data;
  onChange: (v: Data) => void;
  registration?: boolean;
}) {
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 360 || fontScale > 1.2 ? 1 : 2;
  const numericRows = Array.from(
    { length: Math.ceil(numericEye.length / columns) },
    (_, index) => numericEye.slice(index * columns, (index + 1) * columns),
  );
  return (
    <Card>
      <Heading>{title}</Heading>
      {/* Explicit rows let every field contribute its full measured height. */}
      {numericRows.map(row => (
        <View key={row[0]} style={{ flexDirection: 'row', gap: 12 }}>
          {row.map(key => (
            <View key={key} style={{ flex: 1, minWidth: 0 }}>
              <Field
                title={eyeTitles[key]}
                numeric
                value={value[key]}
                onChange={v => onChange({ ...value, [key]: v })}
              />
            </View>
          ))}
        </View>
      ))}
      {[
        'unaidedVision',
        'correctedVision',
        'pinholeVision',
        'nearVision',
        ...(registration ? [] : ['va']),
      ].map(key => (
        <View key={key} style={{ gap: 7 }}>
          <Field
            title={eyeTitles[key]}
            value={value[key]}
            onChange={v => onChange({ ...value, [key]: v })}
          />
          <Choice
            title={`${eyeTitles[key]} presets`}
            value={value[key]}
            options={
              key === 'nearVision'
                ? ['N5', 'N6', 'N8', 'N10', 'N12', 'N18', 'N24', 'N36']
                : distance
            }
            onChange={v => onChange({ ...value, [key]: v })}
          />
        </View>
      ))}
    </Card>
  );
}
function eyePayload(value: Data = {}) {
  const out = clean({ ...value });
  numericEye.forEach(key => {
    if (out[key] === undefined) return;
    out[key] = Number(out[key]);
    const range =
      key === 'axis' ? [0, 180] : key === 'iop' ? [0, 100] : [-50, 50];
    if (
      !Number.isFinite(out[key]) ||
      out[key] < range[0] ||
      out[key] > range[1]
    )
      throw new Error(
        `${eyeTitles[key]} must be between ${range[0]} and ${range[1]}.`,
      );
  });
  return out;
}
export function buildPayload(
  kind: FormKind,
  data: Data,
  editing = false,
): Data {
  const out = clean(data);
  if (editing || kind === 'settings')
    Object.entries(data).forEach(([key, value]) => {
      if (value === '') out[key] = '';
    });
  const numberKeys =
    kind === 'patient'
      ? ['age']
      : kind === 'medicine'
      ? ['defaultPrice']
      : kind === 'settings'
      ? ['defaultConsultationFee']
      : kind === 'order'
      ? ['pd', 'framePrice', 'lensPrice', 'otherCharges', 'discount']
      : [];
  numberKeys.forEach(key => {
    if (out[key] !== undefined) {
      out[key] = Number(out[key]);
      if (out[key] < 0) throw new Error(`${label(key)} cannot be negative.`);
    }
  });
  for (const key of [
    'dateOfBirth',
    'visitDate',
    'followUpDate',
    'deliveryDate',
  ])
    if (out[key] && !validateDate(out[key].slice(0, 10)))
      throw new Error(`${label(key)} must be a valid YYYY-MM-DD date.`);
  if (kind === 'patient' || kind === 'medicine') {
    out.name = String(out.name || '').trim();
    if (!out.name) throw new Error('Name is required.');
  }
  if (kind === 'patient') {
    if (out.age !== undefined && (!Number.isInteger(out.age) || out.age > 130))
      throw new Error('Age must be a whole number between 0 and 130.');
    if (out.mobile && !/^[+\d\s()-]{7,20}$/.test(out.mobile))
      throw new Error('Enter a valid mobile number.');
    if (editing)
      [
        'mobile',
        'age',
        'dateOfBirth',
        'gender',
        'address',
        'bloodGroup',
        'allergies',
        'medicalNotes',
      ].forEach(key => {
        if (data[key] === '') out[key] = null;
      });
  }
  for (const key of ['investigation', 'eyeExamination'])
    if (out[key]) {
      out[key] = {
        ...out[key],
        rightEye: eyePayload(out[key].rightEye),
        leftEye: eyePayload(out[key].leftEye),
      };
      if (out[key].pd !== undefined) out[key].pd = Number(out[key].pd);
      if (out[key].pd < 0 || out[key].pd > 100)
        throw new Error('PD must be between 0 and 100 mm.');
    }
  if (kind === 'order') {
    if (editing) {
      delete out.patient;
      delete out.visit;
    }
    out.rightEye = eyePayload(out.rightEye);
    out.leftEye = eyePayload(out.leftEye);
    if (
      (out.discount || 0) >
      (out.framePrice || 0) + (out.lensPrice || 0) + (out.otherCharges || 0)
    )
      throw new Error('Discount cannot exceed the order total.');
    if (out.pd > 100) throw new Error('PD cannot exceed 100 mm.');
  }
  if (kind === 'visit') {
    out.charges = Object.fromEntries(
      Object.entries(out.charges || {}).map(([k, v]) => [k, Number(v)]),
    );
    out.medicines = (out.medicines || []).map((m: Data) => {
      if (!m.medicine && !m.medicineName?.trim())
        throw new Error('Each prescription needs a medicine name.');
      if (!Number.isInteger(Number(m.quantity)) || Number(m.quantity) < 1)
        throw new Error('Medicine quantity must be at least 1.');
      if (Number(m.unitPrice || 0) < 0)
        throw new Error('Medicine price cannot be negative.');
      return {
        ...m,
        quantity: Number(m.quantity),
        unitPrice: Number(m.unitPrice || 0),
      };
    });
    if ((out.diagnoses || []).some((d: Data) => !d.name?.trim()))
      throw new Error('Enter a name for every diagnosis.');
    const subtotal =
      Number(out.charges.consultation || 0) +
      Number(out.charges.other || 0) +
      out.medicines.reduce(
        (s: number, m: Data) => s + m.unitPrice * m.quantity,
        0,
      );
    if (
      Object.values(out.charges).some(v => Number(v) < 0) ||
      Number(out.charges.discount || 0) > subtotal
    )
      throw new Error(
        'Charges must be positive and discount cannot exceed the bill.',
      );
  }
  validateNumbers(out);
  return out;
}
const patientFields = [
  'name',
  'mobile',
  'age',
  'dateOfBirth',
  'address',
  'bloodGroup',
  'allergies',
  'medicalNotes',
];
const settingFields = [
  'shopName',
  'doctorName',
  'mobile',
  'email',
  'address',
  'registrationNumber',
  'defaultConsultationFee',
];
export function RecordForm({
  kind,
  initial = {},
  patientId,
  medicines = [],
  onSaved,
  onDirty,
}: {
  kind: FormKind;
  initial?: Data;
  patientId?: string;
  medicines?: Data[];
  onSaved: (d: Data) => void;
  onDirty: () => void;
}) {
  const [data, setData] = useState<Data>(() => {
    const fields =
      kind === 'patient'
        ? [...patientFields, 'gender', 'investigation']
        : kind === 'medicine'
        ? [
            'name',
            'genericName',
            'unit',
            'defaultPrice',
            'description',
            'isActive',
          ]
        : kind === 'settings'
        ? settingFields
        : kind === 'order'
        ? [
            'patient',
            'visit',
            'rightEye',
            'leftEye',
            'pd',
            'frameName',
            'framePrice',
            'lensType',
            'lensPrice',
            'otherCharges',
            'discount',
            'deliveryDate',
            'notes',
          ]
        : [
            'patient',
            'complaint',
            'symptoms',
            'diagnoses',
            'eyeExamination',
            'doctorNotes',
            'medicines',
            'charges',
            'followUpDate',
            'visitDate',
            'remarks',
          ];
    return {
      ...(kind === 'visit'
        ? {
            medicines: [],
            diagnoses: [],
            symptoms: [],
            charges: { consultation: 0, other: 0, discount: 0 },
          }
        : {}),
      ...Object.fromEntries(
        fields
          .filter(k => initial[k] !== undefined)
          .map(k => [
            k,
            k.toLowerCase().includes('date')
              ? String(initial[k]).slice(0, 10)
              : initial[k],
          ]),
      ),
      ...(patientId ? { patient: patientId } : {}),
    };
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const change = (key: string, value: any) => {
    onDirty();
    setData(prev => ({ ...prev, [key]: value }));
  };
  const field = (
    key: string,
    numeric = false,
    multiline = false,
    title?: string,
  ) => (
    <Field
      key={key}
      title={
        title ||
        `${label(key)}${
          key.toLowerCase().includes('date') ? ' (YYYY-MM-DD)' : ''
        }`
      }
      value={data[key]}
      numeric={numeric}
      multiline={multiline}
      autoCapitalize={key === 'email' ? 'none' : 'sentences'}
      onChange={v => change(key, v)}
    />
  );
  const eyeSection = kind === 'patient' ? 'investigation' : 'eyeExamination';
  async function save() {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      const payload = buildPayload(kind, data, !!initial._id);
      const path = {
        patient: '/patients',
        visit: '/visits',
        order: '/spectacle-orders',
        medicine: '/medicines',
        settings: '/settings',
      }[kind];
      const editing = !!initial._id && kind !== 'visit';
      const result = await request<Data>(
        `${path}${editing && kind !== 'settings' ? `/${initial._id}` : ''}`,
        editing || kind === 'settings' ? 'PATCH' : 'POST',
        payload,
      );
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save record.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  const updateItem = (
    key: 'medicines' | 'diagnoses',
    index: number,
    value: Data,
  ) =>
    change(
      key,
      data[key].map((m: Data, i: number) => (i === index ? value : m)),
    );
  return (
    <View style={{ gap: 16 }} pointerEvents={saving ? 'none' : 'auto'}>
      {kind === 'patient' && (
        <Card>
          <Heading>Patient information</Heading>
          {patientFields.map(k =>
            field(
              k,
              k === 'age',
              ['address', 'allergies', 'medicalNotes'].includes(k),
              k === 'name' ? 'Full name *' : undefined,
            ),
          )}
          <Choice
            title="Gender"
            value={data.gender}
            options={['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']}
            onChange={v => change('gender', v)}
          />
        </Card>
      )}
      {kind === 'medicine' && (
        <Card>
          <Heading>Medicine details</Heading>
          {['name', 'genericName', 'unit', 'defaultPrice', 'description'].map(
            k => field(k, k === 'defaultPrice', k === 'description'),
          )}
          <View style={styles.row}>
            <Text style={styles.text}>Active medicine</Text>
            <Switch
              accessibilityLabel="Active medicine"
              value={data.isActive !== false}
              onValueChange={v => change('isActive', v)}
            />
          </View>
        </Card>
      )}
      {kind === 'settings' && (
        <Card>
          <Heading>Clinic & receipt information</Heading>
          {settingFields.map(k =>
            field(k, k === 'defaultConsultationFee', k === 'address'),
          )}
        </Card>
      )}
      {kind === 'visit' && (
        <Card>
          <Heading>Symptoms & assessment</Heading>
          {field(
            'visitDate',
            false,
            false,
            'Visit date (YYYY-MM-DD, optional)',
          )}
          {field('complaint', false, true)}
          <View style={styles.row}>
            {['Redness', 'Pain', 'Watering', 'Itching', 'Blurred vision'].map(
              s => (
                <Button
                  key={s}
                  secondary={!data.symptoms.includes(s)}
                  title={s}
                  onPress={() =>
                    change(
                      'symptoms',
                      data.symptoms.includes(s)
                        ? data.symptoms.filter((x: string) => x !== s)
                        : [...data.symptoms, s],
                    )
                  }
                />
              ),
            )}
          </View>
          {field('doctorNotes', false, true)}
          {field('followUpDate')}
          {field('remarks', false, true)}
        </Card>
      )}
      {(kind === 'patient' || kind === 'visit') && (
        <>
          <Heading>
            {kind === 'patient'
              ? 'Registration investigation'
              : 'Eye examination'}
          </Heading>
          {['rightEye', 'leftEye'].map(side => (
            <EyeForm
              key={side}
              title={side === 'rightEye' ? 'Right eye · OD' : 'Left eye · OS'}
              registration={kind === 'patient'}
              value={data[eyeSection]?.[side]}
              onChange={v =>
                change(eyeSection, { ...data[eyeSection], [side]: v })
              }
            />
          ))}
          <Card>
            <Field
              title="PD (mm)"
              value={data[eyeSection]?.pd}
              numeric
              onChange={v => change(eyeSection, { ...data[eyeSection], pd: v })}
            />
            <Field
              title="Examination remarks"
              multiline
              value={data[eyeSection]?.remarks}
              onChange={v =>
                change(eyeSection, { ...data[eyeSection], remarks: v })
              }
            />
          </Card>
        </>
      )}
      {kind === 'visit' && (
        <>
          <Card>
            <Heading>Diagnoses</Heading>
            {data.diagnoses.map((d: Data, i: number) => (
              <View key={i} style={{ gap: 12, paddingVertical: 12 }}>
                <Field
                  title={`Diagnosis ${i + 1}`}
                  value={d.name}
                  onChange={v => updateItem('diagnoses', i, { ...d, name: v })}
                />
                <Choice
                  title="Common diagnosis"
                  value={d.name}
                  options={['Conjunctivitis', 'Pterygium', 'Cataract']}
                  onChange={v => updateItem('diagnoses', i, { ...d, name: v })}
                />
                <Choice
                  title="Eye"
                  value={d.eye}
                  options={['OD', 'OS', 'OU']}
                  onChange={v => updateItem('diagnoses', i, { ...d, eye: v })}
                />
                <Choice
                  title="Status"
                  value={d.status}
                  options={['PROVISIONAL', 'CONFIRMED']}
                  onChange={v =>
                    updateItem('diagnoses', i, { ...d, status: v })
                  }
                />
                <Button
                  danger
                  title="Remove diagnosis"
                  onPress={() =>
                    change(
                      'diagnoses',
                      data.diagnoses.filter((_: Data, n: number) => n !== i),
                    )
                  }
                />
              </View>
            ))}
            <Button
              secondary
              title="+ Add diagnosis"
              disabled={data.diagnoses.length >= 20}
              onPress={() =>
                change('diagnoses', [
                  ...data.diagnoses,
                  { name: '', eye: 'OU', status: 'PROVISIONAL' },
                ])
              }
            />
          </Card>
          <Heading>Prescription</Heading>
          {data.medicines.map((m: Data, i: number) => (
            <Card key={i}>
              <Heading>Medicine {i + 1}</Heading>
              <Choice
                title="Select from catalogue"
                value={m.medicine || ''}
                options={[
                  { value: '', name: 'Write a custom medicine' },
                  ...medicines.map(x => ({ value: x._id, name: x.name })),
                ]}
                onChange={v => {
                  const selected = medicines.find(x => x._id === v);
                  updateItem('medicines', i, {
                    ...m,
                    medicine: v,
                    medicineName: selected?.name || '',
                    unitPrice: selected?.defaultPrice || 0,
                  });
                }}
              />
              {!m.medicine && (
                <Field
                  title="Medicine name *"
                  value={m.medicineName}
                  onChange={v =>
                    updateItem('medicines', i, { ...m, medicineName: v })
                  }
                />
              )}
              {[
                'strength',
                'quantity',
                'unitPrice',
                'dosage',
                'frequency',
                'duration',
                'instructions',
              ].map(k => (
                <Field
                  key={k}
                  title={label(k)}
                  value={m[k]}
                  numeric={['quantity', 'unitPrice'].includes(k)}
                  onChange={v => updateItem('medicines', i, { ...m, [k]: v })}
                />
              ))}
              <Choice
                title="Prescribed eye"
                value={m.eye}
                options={['OD', 'OS', 'OU', 'NA']}
                onChange={v => updateItem('medicines', i, { ...m, eye: v })}
              />
              <Button
                danger
                title="Remove medicine"
                onPress={() =>
                  change(
                    'medicines',
                    data.medicines.filter((_: Data, n: number) => n !== i),
                  )
                }
              />
            </Card>
          ))}
          <Button
            secondary
            title="+ Add medicine"
            onPress={() =>
              change('medicines', [
                ...data.medicines,
                { medicineName: '', quantity: 1, unitPrice: 0, eye: 'OU' },
              ])
            }
          />
          <Card>
            <Heading>Visit bill</Heading>
            {['consultation', 'other', 'discount'].map(k => (
              <Field
                key={k}
                title={`${label(k)} (₹)`}
                numeric
                value={data.charges[k]}
                onChange={v => change('charges', { ...data.charges, [k]: v })}
              />
            ))}
            <Heading>
              {money(
                Number(data.charges.consultation || 0) +
                  Number(data.charges.other || 0) -
                  Number(data.charges.discount || 0) +
                  data.medicines.reduce(
                    (s: number, m: Data) =>
                      s + Number(m.unitPrice || 0) * Number(m.quantity || 0),
                    0,
                  ),
              )}
            </Heading>
            <Text style={styles.muted}>
              Save the visit, then record payment against this bill.
            </Text>
          </Card>
        </>
      )}
      {kind === 'order' && (
        <>
          <Card>
            <Heading>Frame & lenses</Heading>
            {[
              'frameName',
              'lensType',
              'pd',
              'framePrice',
              'lensPrice',
              'otherCharges',
              'discount',
              'deliveryDate',
              'notes',
            ].map(k =>
              field(
                k,
                [
                  'pd',
                  'framePrice',
                  'lensPrice',
                  'otherCharges',
                  'discount',
                ].includes(k),
                k === 'notes',
              ),
            )}
            <Heading>
              Total{' '}
              {money(
                Number(data.framePrice || 0) +
                  Number(data.lensPrice || 0) +
                  Number(data.otherCharges || 0) -
                  Number(data.discount || 0),
              )}
            </Heading>
          </Card>
          {['rightEye', 'leftEye'].map(side => (
            <EyeForm
              key={side}
              title={side === 'rightEye' ? 'Right eye · OD' : 'Left eye · OS'}
              value={data[side]}
              onChange={v => change(side, v)}
            />
          ))}
        </>
      )}
      <ErrorBox message={error} />
      <Button
        disabled={saving}
        title={
          saving
            ? 'Saving…'
            : `Save ${kind === 'order' ? 'spectacle order' : kind}`
        }
        onPress={() => void save()}
      />
    </View>
  );
}
