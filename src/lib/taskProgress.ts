export interface TrackableTask {
  id: string;
  vendor?: string;
}

export function parseCompletedTaskIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))];
  } catch {
    return [];
  }
}

export function toggleTaskCompletion(completedIds: string[], taskId: string): string[] {
  const next = new Set(completedIds);
  if (next.has(taskId)) next.delete(taskId);
  else next.add(taskId);
  return [...next];
}

export function summarizeTaskProgress(tasks: TrackableTask[], completedIds: string[]): { vendor: string; completed: number; total: number }[] {
  const completed = new Set(completedIds);
  const byVendor = new Map<string, { vendor: string; completed: number; total: number }>();
  for (const task of tasks) {
    const vendor = task.vendor?.trim() || 'Unassigned';
    const summary = byVendor.get(vendor) ?? { vendor, completed: 0, total: 0 };
    summary.total += 1;
    if (completed.has(task.id)) summary.completed += 1;
    byVendor.set(vendor, summary);
  }
  return [...byVendor.values()].sort((a, b) => a.vendor.localeCompare(b.vendor));
}
