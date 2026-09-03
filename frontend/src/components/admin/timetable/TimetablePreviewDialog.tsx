import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid';
import { ScheduleEntry, SchedulePeriod, ScheduleStatus } from '../../../api/timetable';
import {
  Eye,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  ArrowLeftRight,
  Columns,
  LayoutGrid,
  ListFilter,
  Send,
  Calendar,
  MapPin,
  User,
} from 'lucide-react';

export type ChangeType = 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';

export interface LessonPropertyDiff {
  field: 'subject' | 'teacher' | 'room';
  label: string;
  before: string;
  after: string;
}

export interface SlotComparisonItem {
  slotKey: string;
  dayKey: string;
  dayLabel: string;
  period: SchedulePeriod;
  changeType: ChangeType;
  liveEntry: ScheduleEntry | null;
  stagedEntry: ScheduleEntry | null;
  diffs: LessonPropertyDiff[];
  moveNote?: string;
}

interface TimetablePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName?: string;
  sectionDisplayName?: string | null;
  gradeName?: string;
  academicYear?: string;
  scheduleStatus: ScheduleStatus;
  publishedAt?: string | null;
  defaultRoomNumber?: string | null;
  periods: SchedulePeriod[];
  serverEntries: ScheduleEntry[];
  workingEntries: ScheduleEntry[];
  isDirty: boolean;
  onProceedToPublish?: () => void;
}

const DEFAULT_DAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
];

function normalizeDayKey(day?: string): string {
  return (day || '').toUpperCase().trim();
}

function normalizeRoom(room?: string | null): string {
  return (room || '').trim();
}

function formatPublishedDate(dateStr?: string | null): string {
  if (!dateStr) return 'Not published yet';
  try {
    const d = new Date(dateStr);
    return `Last published: ${d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} at ${d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  } catch {
    return 'Not published yet';
  }
}

export const TimetablePreviewDialog: React.FC<TimetablePreviewDialogProps> = ({
  isOpen,
  onClose,
  sectionName = 'Class Section',
  sectionDisplayName,
  gradeName = 'Grade',
  academicYear = '—',
  scheduleStatus,
  publishedAt,
  defaultRoomNumber,
  periods,
  serverEntries,
  workingEntries,
  isDirty,
  onProceedToPublish,
}) => {
  const [activeView, setActiveView] = useState<'visual_diff' | 'side_by_side' | 'changes_list'>('visual_diff');
  const [listFilter, setListFilter] = useState<'ALL' | 'ADDED' | 'CHANGED' | 'REMOVED'>('ALL');

  // Compute Days to Display (include weekend only if weekend entries exist)
  const displayDays = useMemo(() => {
    const hasWeekend = [...serverEntries, ...workingEntries].some((e) => {
      const d = normalizeDayKey(e.dayOfWeek);
      return d === 'SATURDAY' || d === 'SUNDAY';
    });
    if (hasWeekend) {
      return [
        ...DEFAULT_DAYS,
        { key: 'SATURDAY', label: 'Saturday' },
        { key: 'SUNDAY', label: 'Sunday' },
      ];
    }
    return DEFAULT_DAYS;
  }, [serverEntries, workingEntries]);

  // Derived Comparison Analysis
  const comparison = useMemo(() => {
    const liveMap = new Map<string, ScheduleEntry>();
    for (const e of serverEntries) {
      if (e.dayOfWeek && e.periodId) {
        liveMap.set(`${normalizeDayKey(e.dayOfWeek)}_${e.periodId}`, e);
      }
    }

    const stagedMap = new Map<string, ScheduleEntry>();
    for (const e of workingEntries) {
      if (e.dayOfWeek && e.periodId) {
        stagedMap.set(`${normalizeDayKey(e.dayOfWeek)}_${e.periodId}`, e);
      }
    }

    // All unique slot keys across all periods and days
    const allSlotKeys = new Set<string>();
    for (const day of displayDays) {
      for (const p of periods) {
        if (!p.isBreak) {
          allSlotKeys.add(`${day.key}_${p.id}`);
        }
      }
    }
    // Also include any slots in liveMap or stagedMap that might not be in the default grid
    for (const k of liveMap.keys()) allSlotKeys.add(k);
    for (const k of stagedMap.keys()) allSlotKeys.add(k);

    const periodMap = new Map<string, SchedulePeriod>();
    for (const p of periods) periodMap.set(p.id, p);

    const items: SlotComparisonItem[] = [];
    const itemsBySlot = new Map<string, SlotComparisonItem>();

    let addedCount = 0;
    let removedCount = 0;
    let changedCount = 0;
    let unchangedCount = 0;

    for (const slotKey of allSlotKeys) {
      const [dayKey, periodId] = slotKey.split('_');
      const dayObj = displayDays.find((d) => d.key === dayKey) || {
        key: dayKey,
        label: dayKey.charAt(0) + dayKey.slice(1).toLowerCase(),
      };
      const period = periodMap.get(periodId) || {
        id: periodId,
        academicYearId: '',
        periodNumber: 0,
        name: `Period ${periodId}`,
        startTime: '—',
        endTime: '—',
        isBreak: false,
        isActive: true,
        displayOrder: 99,
        createdAt: '',
        updatedAt: '',
      };

      const live = liveMap.get(slotKey) || null;
      const staged = stagedMap.get(slotKey) || null;

      let changeType: ChangeType = 'UNCHANGED';
      const diffs: LessonPropertyDiff[] = [];

      if (!live && staged) {
        changeType = 'ADDED';
        addedCount++;
      } else if (live && !staged) {
        changeType = 'REMOVED';
        removedCount++;
      } else if (live && staged) {
        const liveSubjectId = live.subjectId || '';
        const stagedSubjectId = staged.subjectId || '';
        if (liveSubjectId !== stagedSubjectId) {
          diffs.push({
            field: 'subject',
            label: 'Subject',
            before: live.subject?.name || '—',
            after: staged.subject?.name || '—',
          });
        }

        const liveTeacherId = live.teacherId || '';
        const stagedTeacherId = staged.teacherId || '';
        if (liveTeacherId !== stagedTeacherId) {
          const beforeTeacher = live.teacher ? `${live.teacher.firstName} ${live.teacher.lastName}`.trim() : '—';
          const afterTeacher = staged.teacher ? `${staged.teacher.firstName} ${staged.teacher.lastName}`.trim() : '—';
          diffs.push({
            field: 'teacher',
            label: 'Teacher',
            before: beforeTeacher,
            after: afterTeacher,
          });
        }

        const liveRoom = normalizeRoom(live.roomOverride);
        const stagedRoom = normalizeRoom(staged.roomOverride);
        if (liveRoom !== stagedRoom) {
          diffs.push({
            field: 'room',
            label: 'Room',
            before: liveRoom || defaultRoomNumber || 'None',
            after: stagedRoom || defaultRoomNumber || 'None',
          });
        }

        if (diffs.length > 0) {
          changeType = 'CHANGED';
          changedCount++;
        } else {
          changeType = 'UNCHANGED';
          unchangedCount++;
        }
      }

      const item: SlotComparisonItem = {
        slotKey,
        dayKey,
        dayLabel: dayObj.label,
        period,
        changeType,
        liveEntry: live,
        stagedEntry: staged,
        diffs,
      };

      items.push(item);
      itemsBySlot.set(slotKey, item);
    }

    // Move annotation detection: If same subject was removed from slot A and added to slot B on same day
    const addedItems = items.filter((i) => i.changeType === 'ADDED' && i.stagedEntry);
    const removedItems = items.filter((i) => i.changeType === 'REMOVED' && i.liveEntry);

    for (const added of addedItems) {
      const match = removedItems.find(
        (r) =>
          r.dayKey === added.dayKey &&
          r.liveEntry?.subjectId === added.stagedEntry?.subjectId
      );
      if (match) {
        added.moveNote = `Moved from ${match.period.name}`;
        match.moveNote = `Moved to ${added.period.name}`;
      }
    }

    return {
      totalLiveLessons: serverEntries.length,
      totalStagedLessons: workingEntries.length,
      totalChanges: addedCount + removedCount + changedCount,
      addedCount,
      removedCount,
      changedCount,
      unchangedCount,
      items,
      itemsBySlot,
    };
  }, [serverEntries, workingEntries, periods, displayDays, defaultRoomNumber]);

  // Filtered change items for Changes List view
  const filteredChangeItems = useMemo(() => {
    return comparison.items.filter((item) => {
      if (item.changeType === 'UNCHANGED') return false;
      if (listFilter === 'ALL') return true;
      return item.changeType === listFilter;
    });
  }, [comparison.items, listFilter]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[90vh] bg-white rounded-3xl p-0 overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* 1. Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-900" />
                  <span>Timetable Preview & Comparison</span>
                </DialogTitle>
                {scheduleStatus === 'PUBLISHED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Live Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    Draft — Not Live
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {sectionName} {sectionDisplayName ? `(${sectionDisplayName})` : ''} • {gradeName} • Academic Year {academicYear}
                {scheduleStatus === 'PUBLISHED' && publishedAt && ` • ${formatPublishedDate(publishedAt)}`}
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="inline-flex p-1 bg-gray-100/90 rounded-2xl self-start md:self-auto border border-gray-200/60">
              <button
                type="button"
                onClick={() => setActiveView('visual_diff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'visual_diff'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Visual Diff Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('side_by_side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'side_by_side'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('changes_list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'changes_list'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Changes List ({comparison.totalChanges})</span>
              </button>
            </div>
          </div>

          {/* 2. Change Summary Banner */}
          <div className="pt-3">
            {comparison.totalChanges === 0 ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    {scheduleStatus === 'PUBLISHED'
                      ? 'No staged changes. The working timetable matches the live published schedule.'
                      : `Draft timetable is clean. All ${workingEntries.length} lessons are up to date.`}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  {workingEntries.length} Lessons Scheduled
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-amber-900 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{comparison.totalChanges} Changes Detected Before Publishing</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  {comparison.addedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <PlusCircle className="w-3 h-3" /> +{comparison.addedCount} Added
                    </span>
                  )}
                  {comparison.changedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      <ArrowLeftRight className="w-3 h-3" /> ↕{comparison.changedCount} Changed
                    </span>
                  )}
                  {comparison.removedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      <MinusCircle className="w-3 h-3" /> -{comparison.removedCount} Removed
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    ✓ {comparison.unchangedCount} Unchanged
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* 3. Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* VIEW 1: Visual Diff Grid */}
          {activeView === 'visual_diff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <p>
                  Showing staged timetable with highlighted diff badges. Lessons marked with badges indicate modifications compared to the live baseline.
                </p>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Added
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Changed
                  </span>
                  <span className="flex items-center gap-1 text-rose-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Removed
                  </span>
                </div>
              </div>

              <WeeklyScheduleGrid
                periods={periods}
                entries={workingEntries}
                sectionName={sectionName}
                roomNumber={defaultRoomNumber}
                readOnly={true}
                renderCellHeader={(day, period) => {
                  const slotKey = `${day.key}_${period.id}`;
                  const item = comparison.itemsBySlot.get(slotKey);
                  if (!item || item.changeType === 'UNCHANGED') return null;

                  if (item.changeType === 'ADDED') {
                    return (
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-emerald-100 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <PlusCircle className="w-3 h-3" /> Added
                        </span>
                        {item.moveNote && (
                          <span className="text-[9px] text-emerald-600 lowercase font-medium">{item.moveNote}</span>
                        )}
                      </div>
                    );
                  }

                  if (item.changeType === 'CHANGED') {
                    return (
                      <div className="pb-1 mb-1 border-b border-amber-200 text-[10px] font-black text-amber-800 uppercase tracking-wider">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <ArrowLeftRight className="w-3 h-3" /> Changed
                          </span>
                        </div>
                        {item.diffs.length > 0 && (
                          <p className="text-[9px] text-amber-700/90 font-medium normal-case tracking-normal truncate pt-0.5">
                            Was: {item.diffs.map((d) => `${d.label} (${d.before})`).join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  }

                  return null;
                }}
                customCardClass={(day, period) => {
                  const slotKey = `${day.key}_${period.id}`;
                  const item = comparison.itemsBySlot.get(slotKey);
                  if (!item) return '';
                  if (item.changeType === 'ADDED') {
                    return 'ring-2 ring-emerald-500/80 bg-emerald-50/40 border-emerald-200';
                  }
                  if (item.changeType === 'CHANGED') {
                    return 'ring-2 ring-amber-500/80 bg-amber-50/40 border-amber-200';
                  }
                  return '';
                }}
                customCellContent={(day, period) => {
                  const slotKey = `${day.key}_${period.id}`;
                  const item = comparison.itemsBySlot.get(slotKey);
                  // Render a removed card in the empty slot if a live entry was removed here!
                  if (item && item.changeType === 'REMOVED' && item.liveEntry) {
                    const removed = item.liveEntry;
                    return (
                      <div className="w-full text-left bg-rose-50/40 p-3.5 rounded-xl border border-dashed border-rose-300 shadow-xs space-y-1.5 block opacity-75">
                        <div className="flex items-center justify-between pb-1 border-b border-rose-200 text-[10px] font-black text-rose-700 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <MinusCircle className="w-3 h-3" /> Removed
                          </span>
                          {item.moveNote && (
                            <span className="text-[9px] text-rose-600 lowercase font-medium">{item.moveNote}</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-gray-500 line-through block truncate">
                          {removed.subject?.name || 'Subject'}
                        </span>
                        {removed.teacher && (
                          <span className="text-[11px] text-gray-400 block truncate">
                            {removed.teacher.firstName} {removed.teacher.lastName}
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </div>
          )}

          {/* VIEW 2: Side-by-Side View */}
          {activeView === 'side_by_side' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Column 1: Live Baseline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                        {scheduleStatus === 'PUBLISHED' ? 'Live Published Timetable' : 'Current Saved Draft'}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {serverEntries.length} Lessons
                    </span>
                  </div>

                  {serverEntries.length === 0 ? (
                    <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-xs">
                      No live lessons are currently recorded on the server.
                    </div>
                  ) : (
                    <WeeklyScheduleGrid
                      periods={periods}
                      entries={serverEntries}
                      sectionName={sectionName}
                      roomNumber={defaultRoomNumber}
                      readOnly={true}
                    />
                  )}
                </div>

                {/* Column 2: Staged Working Timetable */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                        Staged Timetable (Intended Live)
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {workingEntries.length} Lessons
                    </span>
                  </div>

                  {workingEntries.length === 0 ? (
                    <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-xs">
                      No lessons currently in working timetable.
                    </div>
                  ) : (
                    <WeeklyScheduleGrid
                      periods={periods}
                      entries={workingEntries}
                      sectionName={sectionName}
                      roomNumber={defaultRoomNumber}
                      readOnly={true}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: Detailed Changes List */}
          {activeView === 'changes_list' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setListFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    listFilter === 'ALL'
                      ? 'bg-blue-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Changes ({comparison.totalChanges})
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('ADDED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    listFilter === 'ADDED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Added ({comparison.addedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('CHANGED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    listFilter === 'CHANGED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Changed ({comparison.changedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('REMOVED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    listFilter === 'REMOVED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Removed ({comparison.removedCount})
                </button>
              </div>

              {filteredChangeItems.length === 0 ? (
                <div className="p-12 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 text-gray-500 text-xs">
                  {comparison.totalChanges === 0
                    ? 'No changes detected. The staged schedule matches the server baseline.'
                    : 'No changes match the selected filter.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredChangeItems.map((item) => {
                    const isAdded = item.changeType === 'ADDED';
                    const isChanged = item.changeType === 'CHANGED';

                    const entry = item.stagedEntry || item.liveEntry;

                    return (
                      <div
                        key={item.slotKey}
                        className={`p-4 rounded-2xl border shadow-xs space-y-3 ${
                          isAdded
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : isChanged
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isAdded
                                ? 'bg-emerald-100 text-emerald-800'
                                : isChanged
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <PlusCircle className="w-3 h-3" /> Added Lesson
                              </>
                            ) : isChanged ? (
                              <>
                                <ArrowLeftRight className="w-3 h-3" /> Changed Lesson
                              </>
                            ) : (
                              <>
                                <MinusCircle className="w-3 h-3" /> Removed Lesson
                              </>
                            )}
                          </span>

                          <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {item.dayLabel} • {item.period.name} ({item.period.startTime}–{item.period.endTime})
                          </span>
                        </div>

                        {/* Subject Title */}
                        <div>
                          <h4 className="text-sm font-black text-gray-900">
                            {entry?.subject?.name || 'Unknown Subject'}
                            {entry?.subject?.code && (
                              <span className="ml-2 text-xs font-bold text-gray-400">
                                ({entry.subject.code})
                              </span>
                            )}
                          </h4>
                          {item.moveNote && (
                            <p className="text-[11px] font-medium text-blue-700 mt-0.5">
                              {item.moveNote}
                            </p>
                          )}
                        </div>

                        {/* Details or Diffs */}
                        {isChanged && item.diffs.length > 0 ? (
                          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 space-y-1 text-xs">
                            {item.diffs.map((diff, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2">
                                <span className="font-bold text-gray-500">{diff.label}:</span>
                                <span className="text-gray-800">
                                  <span className="line-through text-rose-600 mr-1.5">{diff.before}</span>
                                  <span className="font-bold text-emerald-700">→ {diff.after}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {entry?.teacher
                                  ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
                                  : 'No teacher'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {entry?.effectiveRoom || entry?.roomOverride || defaultRoomNumber || 'Default Room'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Modal Footer */}
        <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-500 font-medium">
            This preview is read-only. No live data is altered until you proceed to Publish.
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Close Preview
            </Button>

            {isDirty && onProceedToPublish && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToPublish();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Proceed to Publish
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimetablePreviewDialog;
