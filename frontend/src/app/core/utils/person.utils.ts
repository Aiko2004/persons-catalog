export function formatYearRange(
  start: number | null | undefined,
  end: number | null | undefined,
): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start} — ${end}`;
  if (start) return `${start} — қазірге дейін`;
  return `— ${end}`;
}

export function personInitials(lastName: string, firstName: string): string {
  return ((lastName?.[0] ?? '') + (firstName?.[0] ?? '')).toUpperCase();
}
