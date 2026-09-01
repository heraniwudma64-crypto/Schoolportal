export type ClassSectionLabelSource = {
  name?: string | null;
  displayName?: string | null;
  GradeLevel?: { name?: string | null } | null;
  gradeLevel?: { name?: string | null } | null;
};

/**
 * Section IDs are the only values sent to APIs. This formatter is the single
 * display rule for every selector: "Grade 10 A", never just "A" or "10A".
 */
export function formatClassSection(section?: ClassSectionLabelSource | null): string {
  if (!section) return 'Unassigned';
  if (section.displayName) return section.displayName;

  const name = String(section.name || '').trim();
  const gradeSource = section.GradeLevel?.name || section.gradeLevel?.name;
  const grade = gradeSource
    ? (/^grade\b/i.test(gradeSource.trim()) ? gradeSource.trim() : `Grade ${gradeSource.trim()}`)
    : '';

  if (grade) {
    const sectionOnly = name.replace(new RegExp(`^${grade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
    return sectionOnly ? `${grade} ${sectionOnly}` : grade;
  }

  const embedded = name.match(/^grade\s*(\d+)\s*([A-Za-z]+)$/i);
  return embedded ? `Grade ${embedded[1]} ${embedded[2]}` : name || 'Unassigned';
}
