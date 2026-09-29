import { buildPayload } from '../src/forms';
import { outstanding, validateDate } from '../src/domain';
import { receiptHtml } from '../src/receipts';

test('patient form preserves zero readings and converts signed numeric input', () => {
  const value = buildPayload('patient', {
    name: ' Patient ',
    age: '0',
    investigation: {
      rightEye: {
        sph: '0',
        cyl: '-0.5',
        axis: '0',
        iop: '0',
        nearVision: 'N6',
      },
      leftEye: { sph: '' },
      pd: '62',
    },
  });
  expect(value.name).toBe('Patient');
  expect(value.age).toBe(0);
  expect(value.investigation).toEqual({
    rightEye: { sph: 0, cyl: -0.5, axis: 0, iop: 0, nearVision: 'N6' },
    leftEye: {},
    pd: 62,
  });
});
test('editing patient explicitly clears optional fields and never coerces blanks to age zero', () => {
  expect(
    buildPayload(
      'patient',
      { name: 'Patient', age: '', dateOfBirth: '', allergies: '' },
      true,
    ),
  ).toMatchObject({ age: null, dateOfBirth: null, allergies: null });
});
test('visit payload includes diagnoses, custom medicine directions and detailed examination', () => {
  const value = buildPayload('visit', {
    patient: '507f1f77bcf86cd799439011',
    symptoms: ['Redness'],
    diagnoses: [{ name: 'Recorded finding', eye: 'OD', status: 'CONFIRMED' }],
    eyeExamination: {
      leftEye: { sph: '-1.25', iop: '15', correctedVision: '6/6' },
    },
    medicines: [
      {
        medicineName: 'Recorded medicine',
        quantity: '2',
        unitPrice: '50',
        eye: 'OD',
        strength: 'Recorded strength',
        instructions: 'Recorded instructions',
      },
    ],
    charges: { consultation: '200', other: '0', discount: '20' },
  });
  expect(value.medicines[0]).toMatchObject({
    quantity: 2,
    unitPrice: 50,
    eye: 'OD',
    instructions: 'Recorded instructions',
  });
  expect(value.charges).toEqual({ consultation: 200, other: 0, discount: 20 });
  expect(value.eyeExamination.leftEye.sph).toBe(-1.25);
});
test.each([
  ['patient', { name: 'P', age: '131' }],
  ['patient', { name: 'P', age: '1.5' }],
  ['patient', { name: 'P', mobile: 'abc' }],
  ['patient', { name: 'P', investigation: { rightEye: { axis: '181' } } }],
  ['patient', { name: 'P', investigation: { leftEye: { iop: '-1' } } }],
  ['visit', { medicines: [{ medicineName: 'Drops', quantity: '0' }] }],
  ['visit', { diagnoses: [{ name: ' ' }] }],
  ['order', { framePrice: '100', discount: '101' }],
  ['order', { framePrice: 'NaN' }],
] as const)('rejects invalid %s fields before sending', (kind, fields) => {
  expect(() => buildPayload(kind, fields)).toThrow();
});
test('outstanding bills account for visit payments and exclude cancelled orders', () => {
  expect(
    outstanding(
      [{ _id: 'v', visitId: 'V-1', charges: { total: 300 } }],
      [
        { _id: 'o', orderId: 'O-1', status: 'READY', remainingAmount: 50 },
        { _id: 'cancelled', status: 'CANCELLED', remainingAmount: 900 },
      ],
      [{ visit: { _id: 'v' }, amount: 100, status: 'COMPLETED' }],
    ),
  ).toEqual([
    { id: 'v', name: 'V-1', kind: 'visit', due: 200 },
    { id: 'o', name: 'O-1', kind: 'spectacleOrder', due: 50 },
  ]);
});
test('order edit never changes the patient or linked visit', () => {
  const value = buildPayload(
    'order',
    { patient: 'p', visit: 'v', framePrice: '500', notes: '' },
    true,
  );
  expect(value.patient).toBeUndefined();
  expect(value.visit).toBeUndefined();
  expect(value.notes).toBe('');
});
test('date validation rejects impossible dates', () => {
  expect(validateDate('2026-02-30')).toBe(false);
  expect(validateDate('2026-02-28')).toBe(true);
});
test('receipt escapes user content, retains zero readings and prints complete directions', () => {
  const html = receiptHtml({
    kind: 'visit',
    number: 'V-1',
    date: '2026-09-21',
    patient: { name: '<script>bad</script>', age: 0 },
    settings: { shopName: 'Clinic & Optics' },
    visit: {
      eyeExamination: { rightEye: { sph: 0, axis: 0 } },
      medicines: [
        {
          medicineName: 'Medicine',
          quantity: 1,
          eye: 'OD',
          strength: 'S',
          dosage: 'D',
          frequency: 'F',
          duration: 'T',
          instructions: 'I',
        },
      ],
      charges: { total: 200 },
    },
    total: 200,
    paid: 100,
    due: 100,
  });
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('Clinic &amp; Optics');
  expect(html).toContain('<td>0</td>');
  expect(html).toContain('OD · D · F · T · I');
});
