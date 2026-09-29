export type Data = Record<string, any>;
export const money = (value: number = 0) =>
  `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
    new Date(),
  );
export const date = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
    : '—';
export const label = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, c => c.toUpperCase());
export const idOf = (value: any): string =>
  typeof value === 'string' ? value : value?._id || '';
export const statuses = [
  'ORDERED',
  'IN_PROCESS',
  'READY',
  'DELIVERED',
  'CANCELLED',
];
export function outstanding(visits: Data[], orders: Data[], payments: Data[]) {
  return [
    ...visits.map(v => ({
      id: v._id,
      name: v.visitId,
      kind: 'visit',
      due: Math.max(
        0,
        v.charges.total -
          payments
            .filter(
              p =>
                idOf(p.visit) === v._id &&
                p.status !== 'FAILED' &&
                p.status !== 'CANCELLED',
            )
            .reduce((s, p) => s + p.amount, 0),
      ),
    })),
    ...orders
      .filter(o => o.status !== 'CANCELLED')
      .map(o => ({
        id: o._id,
        name: o.orderId,
        kind: 'spectacleOrder',
        due: o.remainingAmount,
      })),
  ].filter(b => b.due > 0);
}
export function clean(value: any): any {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([k, v]) => [k, clean(v)]),
    );
  return value;
}
export function validateDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validateNumbers(value: any, path = ''): void {
  if (typeof value === 'number' && !Number.isFinite(value))
    throw new Error(`Enter a valid number for ${label(path)}.`);
  if (value && typeof value === 'object')
    Object.entries(value).forEach(([key, v]) => validateNumbers(v, key));
}
