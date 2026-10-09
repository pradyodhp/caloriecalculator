/** Diary days are user-local. Convert an instant to the user's calendar date (YYYY-MM-DD) in an IANA timezone. */
export function toLocalDate(instant: Date, timeZone: string): string {
  if (Number.isNaN(instant.getTime())) throw new RangeError('invalid date');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isValidTimeZone(tz: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}

/** The 7 local dates ending at (and including) `endDate`. Pure calendar arithmetic, no DST drift. */
export function lastNDates(endDate: string, n: number): string[] {
  const [y, m, d] = endDate.split('-').map(Number) as [number, number, number];
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}
