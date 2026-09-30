import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { PatientDetailsCard } from '../src/patient-details';

test('examination cards retain zero readings, both eyes and nested clinical details', () => {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PatientDetailsCard
        examination
        data={{
          _id: 'internal-id',
          visitId: 'VIS-123',
          visitDate: '2026-09-30',
          eyeExamination: {
            rightEye: { sph: 0, axis: 0 },
            leftEye: { sph: -1.25 },
            pd: 0,
            remarks: 'Review refraction',
          },
          diagnoses: [
            { name: 'Recorded diagnosis', eye: 'OD', status: 'CONFIRMED' },
          ],
          medicines: [
            {
              medicine: 'internal-medicine-id',
              medicineName: 'Recorded medicine',
              quantity: 1,
              instructions: 'Recorded instructions',
            },
          ],
          doctorNotes: 'Recorded notes',
          charges: { consultation: 0, total: 0 },
        }}
      />,
    );
  });
  const text = tree!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat()
    .join(' ');
  for (const value of [
    'VIS-123',
    'Right · OD',
    'Left · OS',
    '0',
    '-1.25',
    'Review refraction',
    'Recorded diagnosis',
    'Recorded medicine',
    'Recorded instructions',
    'Recorded notes',
    '₹0',
  ]) {
    expect(text).toContain(value);
  }
  expect(text).not.toContain('internal-id');
  expect(text).not.toContain('internal-medicine-id');
  act(() => tree!.unmount());
});
