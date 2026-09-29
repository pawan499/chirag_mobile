import { brandSvg } from './brand';
import { Data, date, label, money } from './domain';
const esc = (s: unknown) =>
  String(s ?? '—').replace(
    /[&<>"']/g,
    c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[
        c
      ]!),
  );
const row = (k: string, v: unknown) =>
  `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;
function eyes(exam: Data = {}) {
  const keys = [
    'sph',
    'cyl',
    'axis',
    'add',
    'va',
    'unaidedVision',
    'correctedVision',
    'pinholeVision',
    'nearVision',
    'iop',
  ];
  return `<table><tr><th>Examination</th><th>Right eye (OD)</th><th>Left eye (OS)</th></tr>${keys
    .filter(k => exam.rightEye?.[k] != null || exam.leftEye?.[k] != null)
    .map(
      k =>
        `<tr><th>${esc(label(k))}</th><td>${esc(
          exam.rightEye?.[k],
        )}</td><td>${esc(exam.leftEye?.[k])}</td></tr>`,
    )
    .join('')}</table><p>PD: ${esc(exam.pd)} mm</p><p>${esc(
    exam.remarks || '',
  )}</p>`;
}
export function receiptHtml(r: Data) {
  const p = r.patient || {},
    s = r.settings || {},
    v = r.visit,
    o = r.order;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(
    r.number,
  )}</title><style>@page{size:A4;margin:18mm}body{font:13px Arial,sans-serif;color:#173630;line-height:1.55}h1{margin:0;color:#087f70}h2{font-size:18px;border-bottom:1px solid #ccdcd5;padding-bottom:8px}table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #dce5df;padding:8px;text-align:left}th{background:#f0f6f3}header{text-align:center;border-bottom:3px solid #087f70;padding-bottom:16px}.totals{font-size:16px}.footer{margin-top:28px;color:#667a72}tr{break-inside:avoid}p{white-space:pre-wrap}header svg{display:block;width:72px;height:72px;margin:0 auto 8px}</style></head><body><header>${brandSvg}<h1>${esc(
    s.shopName || 'Chirag Eye Care & Optics',
  )}</h1><div>${esc(s.doctorName || '')}</div><div>${esc(
    s.address || '',
  )}</div><div>${esc([s.mobile, s.email].filter(Boolean).join(' · '))}</div>${
    s.registrationNumber
      ? `<div>Registration: ${esc(s.registrationNumber)}</div>`
      : ''
  }</header><h2>${
    r.kind === 'patient'
      ? 'Patient registration'
      : r.kind === 'visit'
      ? 'Consultation & prescription'
      : r.kind === 'order'
      ? 'Spectacle order'
      : 'Payment receipt'
  } · ${esc(r.number)}</h2><p>Date: ${esc(date(r.date))}${
    r.cancelled ? ' · CANCELLED' : ''
  }</p><table>${row('Patient', p.name)}${row('Patient ID', p.patientId)}${row(
    'Age / gender',
    `${p.age ?? '—'} / ${p.gender || '—'}`,
  )}${row('Mobile', p.mobile)}${row('Address', p.address)}</table>
  ${
    r.kind === 'patient'
      ? `<h2>Registration investigation</h2>${eyes(p.investigation)}<table>${[
          'dateOfBirth',
          'bloodGroup',
          'allergies',
          'medicalNotes',
        ]
          .filter(k => p[k])
          .map(k => row(label(k), p[k]))
          .join('')}</table>`
      : ''
  }
  ${
    v
      ? `<h2>Clinical assessment</h2><p>${esc(
          v.complaint || '',
        )}</p><p>Symptoms: ${esc((v.symptoms || []).join(', '))}</p>${(
          v.diagnoses || []
        )
          .map(
            (d: Data) =>
              `<p>${esc(d.name)} · ${esc(d.eye)} · ${esc(d.status)}</p>`,
          )
          .join('')}${eyes(v.eyeExamination)}<p>${esc(
          v.doctorNotes || '',
        )}</p><h2>Prescription</h2><table><tr><th>Medicine</th><th>Directions</th><th>Quantity</th><th>Amount</th></tr>${(
          v.medicines || []
        )
          .map(
            (m: Data) =>
              `<tr><td>${esc(m.medicineName)} ${esc(
                m.strength || '',
              )}</td><td>${esc(
                [m.eye, m.dosage, m.frequency, m.duration, m.instructions]
                  .filter(Boolean)
                  .join(' · '),
              )}</td><td>${esc(m.quantity)}</td><td>${esc(
                money(m.totalPrice || 0),
              )}</td></tr>`,
          )
          .join('')}</table><table>${Object.entries(v.charges || {})
          .map(([k, value]) => row(label(k), money(Number(value))))
          .join('')}</table>${
          v.followUpDate ? `<p>Follow-up: ${esc(date(v.followUpDate))}</p>` : ''
        }<p>${esc(v.remarks || '')}</p>`
      : ''
  }
  ${
    o
      ? `<h2>Frame & lenses</h2><table>${[
          'frameName',
          'lensType',
          'status',
          'notes',
        ]
          .map(k => row(label(k), o[k]))
          .join('')}${['framePrice', 'lensPrice', 'otherCharges', 'discount']
          .map(k => row(label(k), money(o[k])))
          .join('')}${row(
          'Expected delivery',
          date(o.deliveryDate),
        )}</table>${eyes(o)}`
      : ''
  }
  ${
    r.payment
      ? `<h2>Received ${esc(money(r.payment.amount))}</h2><table>${row(
          'Bill',
          r.billNumber,
        )}${row('Method', r.payment.paymentMethod)}${row(
          'Reference',
          r.payment.referenceNumber,
        )}${row('Notes', r.payment.notes)}</table>`
      : ''
  }
  ${
    r.kind !== 'patient'
      ? `<table class="totals">${row('Bill total', money(r.total))}${row(
          'Paid',
          money(r.paid),
        )}${row('Due', money(r.due))}</table><h2>Payment history</h2><table>${(
          r.payments || []
        )
          .map((payment: Data) =>
            row(
              `${date(payment.paymentDate)} · ${payment.paymentId} · ${
                payment.paymentMethod
              }`,
              money(payment.amount),
            ),
          )
          .join('')}</table>`
      : ''
  }<p class="footer">Generated ${esc(date(r.generatedAt))} · ${esc(
    s.shopName || 'Chirag Eye Care & Optics',
  )}</p></body></html>`;
}
