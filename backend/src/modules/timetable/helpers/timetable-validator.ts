/**
 * Room normalization helper.
 * Trims leading/trailing whitespace, collapses internal whitespace sequences into a single space,
 * and converts to uppercase for case-insensitive, whitespace-agnostic comparison.
 * Empty or whitespace-only strings return null.
 */
export function normalizeRoom(room?: string | null): string | null {
  if (!room) return null;
  const clean = room.trim().replace(/\s+/g, ' ').toUpperCase();
  return clean.length > 0 ? clean : null;
}

/**
 * Resolves the effective room for a timetable slot.
 * If roomOverride is supplied and non-empty, it takes precedence.
 * Otherwise, falls back to the default room of the class section.
 * If neither is present, returns null.
 */
export function resolveEffectiveRoom(
  roomOverride?: string | null,
  sectionDefaultRoom?: string | null,
): string | null {
  const override = normalizeRoom(roomOverride);
  if (override !== null) {
    return override;
  }
  return normalizeRoom(sectionDefaultRoom);
}

/**
 * Converts uppercase Prisma DayOfWeek enum to title-case for frontend compatibility.
 * e.g. "MONDAY" -> "Monday"
 */
export function toTitleCaseDay(day: string): string {
  if (!day) return day;
  const upper = day.toUpperCase().trim();
  switch (upper) {
    case 'MONDAY':
      return 'Monday';
    case 'TUESDAY':
      return 'Tuesday';
    case 'WEDNESDAY':
      return 'Wednesday';
    case 'THURSDAY':
      return 'Thursday';
    case 'FRIDAY':
      return 'Friday';
    case 'SATURDAY':
      return 'Saturday';
    case 'SUNDAY':
      return 'Sunday';
    default:
      return upper.charAt(0) + upper.slice(1).toLowerCase();
  }
}
