import React, { useMemo } from 'react';
import { ScheduleEntry, SchedulePeriod } from '../../../api/timetable';
import { Clock, MapPin, User, Coffee, Plus } from 'lucide-react';

interface WeeklyScheduleGridProps {
  periods: SchedulePeriod[];
  entries: ScheduleEntry[];
  sectionName?: string;
  roomNumber?: string | null;
  readOnly?: boolean;
  onCellClick?: (
    day: { key: string; label: string },
    period: SchedulePeriod,
    existingEntry?: ScheduleEntry | null
  ) => void;
  renderCellHeader?: (
    day: { key: string; label: string },
    period: SchedulePeriod,
    entry?: ScheduleEntry | null
  ) => React.ReactNode;
  customCellContent?: (
    day: { key: string; label: string },
    period: SchedulePeriod
  ) => React.ReactNode;
  customCardClass?: (
    day: { key: string; label: string },
    period: SchedulePeriod,
    entry?: ScheduleEntry | null
  ) => string;
}

const DEFAULT_DAYS: { key: string; label: string }[] = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
];

function normalizeDayKey(day: string): string {
  return (day || '').toUpperCase().trim();
}

export const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  periods,
  entries,
  roomNumber,
  readOnly = false,
  onCellClick,
  renderCellHeader,
  customCellContent,
  customCardClass,
}) => {
  // Sort periods by displayOrder ASC, then periodNumber ASC
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.periodNumber - b.periodNumber;
    });
  }, [periods]);

  // Check if any entries occur on Saturday or Sunday
  const hasWeekendEntries = useMemo(() => {
    return entries.some((e) => {
      const day = normalizeDayKey(e.dayOfWeek);
      return day === 'SATURDAY' || day === 'SUNDAY';
    });
  }, [entries]);

  // Dynamically include weekend days only if entries exist for them
  const displayDays = useMemo(() => {
    if (hasWeekendEntries) {
      return [
        ...DEFAULT_DAYS,
        { key: 'SATURDAY', label: 'Saturday' },
        { key: 'SUNDAY', label: 'Sunday' },
      ];
    }
    return DEFAULT_DAYS;
  }, [hasWeekendEntries]);

  // Build O(1) indexed lookup map: "DAY_PERIODID" -> ScheduleEntry
  const entryMap = useMemo(() => {
    const map = new Map<string, ScheduleEntry>();
    for (const entry of entries) {
      if (entry.dayOfWeek && entry.periodId) {
        const dayKey = normalizeDayKey(entry.dayOfWeek);
        const key = `${dayKey}_${entry.periodId}`;
        map.set(key, entry);
      }
    }
    return map;
  }, [entries]);

  if (sortedPeriods.length === 0) {
    return (
      <div className="bg-gray-50/60 p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-500 text-sm">
        No schedule periods have been configured for this academic year.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[760px]">
        {/* Table Header */}
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <th
              scope="col"
              className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest w-48 min-w-[170px]"
            >
              Time / Period
            </th>
            {displayDays.map((day) => (
              <th
                key={day.key}
                scope="col"
                className="px-4 py-4 text-xs font-black text-gray-900 tracking-tight"
              >
                {day.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-100">
          {sortedPeriods.map((period) => {
            // Case 1: Break Period (Amber Row)
            if (period.isBreak) {
              return (
                <tr
                  key={period.id}
                  className="bg-amber-50/40 border-y border-amber-100/60"
                >
                  <td className="px-6 py-4 border-r border-amber-100/60">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Coffee className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      <span>{period.name}</span>
                      <span className="text-[10px] text-amber-700/80 font-medium">
                        ({period.startTime} – {period.endTime})
                      </span>
                    </div>
                  </td>
                  <td
                    colSpan={displayDays.length}
                    className="px-6 py-4 text-center text-xs font-bold text-amber-800 tracking-wide uppercase"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-amber-800 text-[11px]">
                      Break • No Classes Scheduled
                    </span>
                  </td>
                </tr>
              );
            }

            // Case 2: Instructional Period (Interactive or Read-Only Cells)
            return (
              <tr key={period.id} className="hover:bg-gray-50/30 transition-colors">
                {/* Period Info Header Cell */}
                <th
                  scope="row"
                  className="px-6 py-5 align-top border-r border-gray-50 font-normal bg-gray-50/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-gray-900">{period.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        P{period.periodNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                      <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span>
                        {period.startTime} – {period.endTime}
                      </span>
                    </div>
                  </div>
                </th>

                {/* Day Cells */}
                {displayDays.map((day) => {
                  const cellKey = `${day.key}_${period.id}`;
                  const entry = entryMap.get(cellKey);
                  const effectiveRoom =
                    entry?.effectiveRoom || entry?.roomOverride || roomNumber || null;

                  const customHeader = renderCellHeader?.(day, period, entry);
                  const customContent = customCellContent?.(day, period);
                  const extraClass = customCardClass?.(day, period, entry) || '';

                  return (
                    <td
                      key={cellKey}
                      className="px-3 py-3 align-top border-r border-gray-50 last:border-r-0"
                    >
                      {entry ? (
                        readOnly ? (
                          <div
                            className={`w-full text-left bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs space-y-2 block ${extraClass}`}
                          >
                            {customHeader && <div>{customHeader}</div>}
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-gray-900 leading-tight block line-clamp-2">
                                {entry.subject?.name || 'Unknown Subject'}
                              </span>
                              {entry.subject?.code && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 whitespace-nowrap flex-shrink-0">
                                  {entry.subject.code}
                                </span>
                              )}
                            </div>
                            {entry.teacher && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                                <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                  {entry.teacher.firstName} {entry.teacher.lastName}
                                </span>
                              </div>
                            )}
                            {effectiveRoom && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium pt-0.5">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{effectiveRoom}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onCellClick?.(day, period, entry)}
                            className="w-full text-left bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs hover:border-blue-400 hover:shadow-md transition-all space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900/20 block group"
                            aria-label={`Edit ${entry.subject?.name || 'Lesson'}, ${day.label}, ${period.name}`}
                          >
                            {customHeader && <div>{customHeader}</div>}
                            {/* Subject Header */}
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-gray-900 leading-tight block line-clamp-2 group-hover:text-blue-900 transition-colors">
                                {entry.subject?.name || 'Unknown Subject'}
                              </span>
                              {entry.subject?.code && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 whitespace-nowrap flex-shrink-0">
                                  {entry.subject.code}
                                </span>
                              )}
                            </div>

                            {/* Teacher */}
                            {entry.teacher && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                                <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                  {entry.teacher.firstName} {entry.teacher.lastName}
                                </span>
                              </div>
                            )}

                            {/* Room */}
                            {effectiveRoom && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium pt-0.5">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{effectiveRoom}</span>
                              </div>
                            )}
                          </button>
                        )
                      ) : customContent ? (
                        <div>{customContent}</div>
                      ) : readOnly ? (
                        <div className="w-full h-24 bg-gray-50/30 rounded-xl border border-dashed border-gray-200/50 flex items-center justify-center text-gray-300 text-xs font-medium">
                          —
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCellClick?.(day, period, null)}
                          className="w-full h-24 bg-gray-50/40 hover:bg-blue-50/40 rounded-xl border border-dashed border-gray-200/80 hover:border-blue-300 flex items-center justify-center text-gray-300 hover:text-blue-700 text-xs font-medium cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          aria-label={`Add lesson for ${day.label}, ${period.name}`}
                        >
                          <span className="group-hover:hidden">—</span>
                          <span className="hidden group-hover:inline-flex items-center gap-1 font-bold text-xs">
                            <Plus className="w-3.5 h-3.5" /> Add
                          </span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
