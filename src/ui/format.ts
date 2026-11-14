import { he } from "../i18n/he";

export function formatDuration(sec: number): string {
  const totalMin = Math.round(sec / 60);
  if (totalMin < 60) return `${totalMin} ${he.minutes}`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} ${he.hours}` : `${h} ${he.hours} ${m} ${he.minutes}`;
}

export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} ק״מ`
    : `${Math.round(meters)} מ׳`;
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDayTime(d: Date): string {
  return `${d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" })} ${formatClock(d)}`;
}

/** value for <input type="date"> in local time */
export function toDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** value for <input type="time"> in local time */
export function toTimeInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromInputs(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}
