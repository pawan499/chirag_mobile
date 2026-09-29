import { execFileSync } from 'node:child_process';
import { buildPayload } from '../src/forms';
import type { FormKind } from '../src/forms';

// Validate mobile-generated JSON with the real sibling backend's Zod contracts.
const fixtures: Array<{
  kind: FormKind;
  schema: string;
  draft: Record<string, unknown>;
  editing?: boolean;
}> = [
  {
    kind: 'patient',
    schema: 'patientInput',
    draft: {
      name: 'Mobile Patient',
      age: '0',
      gender: 'PREFER_NOT_TO_SAY',
      mobile: '+91 9876543210',
      dateOfBirth: '2026-09-01',
      address: 'Address',
      bloodGroup: 'AB+',
      allergies: 'Recorded allergy',
      medicalNotes: 'Notes',
      investigation: {
        rightEye: { sph: '0', axis: '180', iop: '0', correctedVision: '6/6' },
        leftEye: { sph: '-1.25' },
        pd: '62',
        remarks: 'Reading',
      },
    },
  },
  {
    kind: 'patient',
    schema: 'patientPatch',
    editing: true,
    draft: {
      name: 'Updated',
      age: '',
      mobile: '',
      dateOfBirth: '',
      allergies: '',
    },
  },
  {
    kind: 'visit',
    schema: 'visitInput',
    draft: {
      patient: '507f1f77bcf86cd799439011',
      visitDate: '2026-09-21',
      complaint: 'Recorded complaint',
      symptoms: ['Redness'],
      diagnoses: [{ name: 'Recorded finding', eye: 'OD', status: 'CONFIRMED' }],
      eyeExamination: {
        rightEye: { sph: '0', cyl: '-0.5', axis: '90', va: '6/6', iop: '15' },
        pd: '61',
      },
      doctorNotes: 'Notes',
      medicines: [
        {
          medicineName: 'Clinician-entered medicine',
          quantity: '2',
          unitPrice: '50',
          strength: 'Recorded strength',
          eye: 'OD',
          dosage: 'Recorded dosage',
          frequency: 'Recorded frequency',
          duration: 'Recorded duration',
          instructions: 'Recorded instructions',
        },
      ],
      charges: { consultation: '200', other: '20', discount: '10' },
      followUpDate: '2026-10-01',
    },
  },
  {
    kind: 'order',
    schema: 'orderInput',
    draft: {
      patient: '507f1f77bcf86cd799439011',
      visit: '507f1f77bcf86cd799439012',
      frameName: 'Frame',
      lensType: 'Lens',
      framePrice: '500',
      lensPrice: '300',
      otherCharges: '10',
      discount: '20',
      rightEye: { sph: '-1', axis: '0' },
      leftEye: { sph: '0' },
      pd: '62',
      deliveryDate: '2026-10-01',
    },
  },
  {
    kind: 'order',
    schema: 'orderPatch',
    editing: true,
    draft: {
      patient: '507f1f77bcf86cd799439011',
      visit: '507f1f77bcf86cd799439012',
      framePrice: '1000',
      notes: '',
    },
  },
  {
    kind: 'medicine',
    schema: 'medicineInput',
    draft: {
      name: 'Catalogue medicine',
      genericName: 'Generic',
      unit: 'Bottle',
      defaultPrice: '100',
      isActive: true,
    },
  },
];

test.each(fixtures)(
  'mobile $kind payload survives the backend $schema without losing fields',
  ({ kind, schema, draft, editing }) => {
    const payload = buildPayload(kind, draft, editing);
    const script = `import fs from 'node:fs'; import * as schemas from '../chirag_eyecare/src/validators/schemas.js'; const {schema,payload}=JSON.parse(fs.readFileSync(0,'utf8')); process.stdout.write(JSON.stringify(schemas[schema].parse(payload)));`;
    const parsed = JSON.parse(
      execFileSync('node', ['--input-type=module', '-e', script], {
        input: JSON.stringify({ schema, payload }),
        encoding: 'utf8',
      }),
    );
    for (const key of Object.keys(payload)) {
      expect(parsed).toHaveProperty(key);
      if (!key.toLowerCase().includes('date'))
        expect(parsed[key]).toEqual(payload[key]);
    }
  },
);
