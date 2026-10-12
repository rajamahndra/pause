import { Temporal } from '@js-temporal/polyfill';
export function localToInstant(value: string, zone: string) {
  return Temporal.PlainDateTime.from(value).toZonedDateTime(zone, { disambiguation: 'reject' }).toInstant().toString();
}
export function instantToLocal(value: string, zone: string) {
  return Temporal.Instant.from(value).toZonedDateTimeISO(zone).toPlainDateTime().toString({ smallestUnit: 'minute' });
}
export function dayStart(value: string, zone: string, next = false) {
  let date = Temporal.PlainDate.from(value);
  if (next) date = date.add({ days: 1 });
  return new Date(date.toZonedDateTime({ timeZone: zone, plainTime: '00:00' }).epochMilliseconds);
}
export function today(zone: string, minus = 0) {
  return Temporal.Now.zonedDateTimeISO(zone).toPlainDate().subtract({ days: minus }).toString();
}
export function displayDate(value: string, zone = 'Asia/Makassar', time = false) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: zone, day: 'numeric', month: 'long', year: 'numeric', ...(time ? ({ hour: '2-digit', minute: '2-digit' } as const) : {}) }).format(new Date(value));
}
