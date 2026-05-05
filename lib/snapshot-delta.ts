type Snapshot = { date: string; total_value: number };

export type NetWorthDelta = { delta: number; deltaPct: number };

export const computeNetWorthDelta = (snapshots: Snapshot[]): NetWorthDelta | null => {
  if (snapshots.length < 2) return null;

  const latest = snapshots[snapshots.length - 1];
  const oldest = snapshots[0];

  const latestMs = new Date(latest.date).getTime();
  const oldestMs = new Date(oldest.date).getTime();
  const daysDiff = (latestMs - oldestMs) / 86_400_000;

  if (daysDiff < 7) return null;

  const targetMs = latestMs - 30 * 86_400_000;

  const referenceSnapshot = snapshots.reduce((closest, snapshot) => {
    const snapshotDiff = Math.abs(new Date(snapshot.date).getTime() - targetMs);
    const closestDiff = Math.abs(new Date(closest.date).getTime() - targetMs);
    return snapshotDiff < closestDiff ? snapshot : closest;
  });

  if (referenceSnapshot.date === latest.date) return null;

  const delta = latest.total_value - referenceSnapshot.total_value;
  const deltaPct =
    referenceSnapshot.total_value > 0 ? (delta / referenceSnapshot.total_value) * 100 : 0;

  return { delta, deltaPct };
};
