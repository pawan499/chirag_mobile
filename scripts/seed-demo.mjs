// Run only against scripts/demo-backend.mjs on the fixed, isolated local port.
const base = 'http://127.0.0.1:4100/api/v1';
const auth = await fetch(`${base}/auth/login`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: 'mobile@test.local', password: 'mobile-test-123'})}).then(r => r.json());
if (!auth.data?.token) throw new Error('Start the isolated demo backend first.');
async function api(path, body, method = 'POST') {
  const r = await fetch(`${base}${path}`, {method, headers: {'Content-Type': 'application/json', Authorization: `Bearer ${auth.data.token}`}, body: JSON.stringify(body)});
  const result = await r.json(); if (!r.ok) throw new Error(result.message); return result.data;
}
await api('/settings', {shopName: 'Chirag Eye Care & Optics', doctorName: 'Dr. Chirag', address: 'Demo Clinic · Test workspace', mobile: '9000000000', defaultConsultationFee: 250}, 'PATCH');
const medicine = await api('/medicines', {name: 'Demo eye drops', genericName: 'Test catalogue item', unit: 'Bottle', defaultPrice: 80});
for (const [i, name] of ['Ananya Sharma', 'Rahul Verma', 'Kiran Patel'].entries()) {
  const patient = await api('/patients', {name, age: 28 + i * 9, gender: i === 1 ? 'MALE' : 'FEMALE', mobile: `900000000${i}`, address: 'Synthetic test record', investigation: {rightEye: {sph: -1.25, cyl: -0.5, axis: 90, correctedVision: '6/6'}, leftEye: {sph: -1, correctedVision: '6/6'}, pd: 62}});
  const visit = await api('/visits', {patient: patient._id, complaint: 'Routine eye examination — demo record', symptoms: ['Blurred vision'], eyeExamination: patient.investigation, medicines: [{medicine: medicine._id, quantity: 1, dosage: 'As recorded by clinician', eye: 'OU'}], charges: {consultation: 250}});
  await api('/payments', {patient: patient._id, visit: visit._id, amount: visit.charges.total, paymentMethod: i === 1 ? 'UPI' : 'CASH'});
  const order = await api('/spectacle-orders', {patient: patient._id, visit: visit._id, ...patient.investigation, frameName: ['Classic round', 'Urban acetate', 'Lightweight rimless'][i], lensType: 'Single vision', framePrice: 1200, lensPrice: 1800, deliveryDate: new Date().toISOString().slice(0,10)});
  await api(`/spectacle-orders/${order._id}`, {status: i === 0 ? 'READY' : 'IN_PROCESS'}, 'PATCH');
  await api('/payments', {patient: patient._id, spectacleOrder: order._id, amount: 1000, paymentMethod: 'UPI', referenceNumber: `DEMO-${i}`});
}
console.log('Seeded three synthetic patients, consultations, orders and payments in the isolated test database.');
