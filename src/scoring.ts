// Standings computation. The data model records a time and/or a position per
// racer per run; from that single set of results we derive three independent
// leaderboards, all shown side by side for the same championship:
//   1. Total time  — sum of all runs (lowest wins; needs every run timed)
//   2. Best run    — fastest single run (lowest wins)
//   3. Points      — placement points per run, summed (highest wins)

export interface ResultLike {
  participant_id: number;
  run_no: number;
  time_ms: number | null;
  position: number | null;
}

export interface TimeRow {
  participantId: number;
  value: number; // ms
  rank: number;
}

export interface PointsRow {
  participantId: number;
  points: number;
  perRun: number[]; // points earned in each run, index = run_no - 1
  rank: number;
}

export interface Standings {
  byTotalTime: TimeRow[];
  incompleteTotal: number[]; // participants with some but not all runs timed
  byBestRun: TimeRow[];
  byPoints: PointsRow[];
  hasAnyTime: boolean;
  hasAnyResult: boolean;
}

// Standard competition ranking ("1224"): equal values share a rank, the next
// distinct value skips ahead. `better` decides ordering (asc for time, desc for points).
function rank<T extends { value: number }>(
  entries: T[],
  order: 'asc' | 'desc',
): (T & { rank: number })[] {
  const sorted = [...entries].sort((a, b) =>
    order === 'asc' ? a.value - b.value : b.value - a.value,
  );
  return sorted
    .map((e, i) => ({
      ...e,
      rank: i > 0 && sorted[i - 1].value === e.value ? -1 : i + 1,
    }))
    .map((e, i, arr) => ({
      ...e,
      rank: e.rank === -1 ? arr[i - 1].rank : e.rank,
    }));
}

export function computeStandings(
  participantIds: number[],
  results: ResultLike[],
  numRuns: number,
  pointsTable: number[],
): Standings {
  const byP = new Map<number, Map<number, ResultLike>>();
  for (const r of results) {
    let runs = byP.get(r.participant_id);
    if (!runs) {
      runs = new Map();
      byP.set(r.participant_id, runs);
    }
    runs.set(r.run_no, r);
  }
  const timeOf = (pid: number, run: number) => byP.get(pid)?.get(run)?.time_ms ?? null;
  const posOf = (pid: number, run: number) => byP.get(pid)?.get(run)?.position ?? null;

  // ── Total time ──────────────────────────────────────────────────────────
  const totals: { participantId: number; value: number }[] = [];
  const incompleteTotal: number[] = [];
  for (const pid of participantIds) {
    let sum = 0;
    let count = 0;
    for (let run = 1; run <= numRuns; run++) {
      const t = timeOf(pid, run);
      if (t !== null) {
        sum += t;
        count++;
      }
    }
    if (numRuns > 0 && count === numRuns) totals.push({ participantId: pid, value: sum });
    else if (count > 0) incompleteTotal.push(pid);
  }
  const byTotalTime = rank(totals, 'asc');

  // ── Best single run ─────────────────────────────────────────────────────
  const bests: { participantId: number; value: number }[] = [];
  for (const pid of participantIds) {
    let best = Number.POSITIVE_INFINITY;
    for (let run = 1; run <= numRuns; run++) {
      const t = timeOf(pid, run);
      if (t !== null) best = Math.min(best, t);
    }
    if (best !== Number.POSITIVE_INFINITY) bests.push({ participantId: pid, value: best });
  }
  const byBestRun = rank(bests, 'asc');

  // ── Placement points ──────────────────────────────────────────────────────
  // Per run, derive finishing order. Prefer recorded times (fastest = 1st);
  // if no times that run, fall back to manually entered positions.
  const pointsByP = new Map<number, { points: number; perRun: number[] }>();
  for (const pid of participantIds) {
    pointsByP.set(pid, { points: 0, perRun: new Array(numRuns).fill(0) });
  }
  let hasAnyTime = false;
  for (let run = 1; run <= numRuns; run++) {
    const timed = participantIds
      .map((pid) => ({ pid, key: timeOf(pid, run) }))
      .filter((e): e is { pid: number; key: number } => e.key !== null);
    if (timed.length > 0) hasAnyTime = true;

    const order =
      timed.length > 0
        ? timed
        : participantIds
            .map((pid) => ({ pid, key: posOf(pid, run) }))
            .filter((e): e is { pid: number; key: number } => e.key !== null);

    order.sort((a, b) => a.key - b.key);

    // Tied keys share the same (best) points slot.
    for (let i = 0; i < order.length; i++) {
      const slot = i > 0 && order[i].key === order[i - 1].key ? prevSlot(order, i) : i;
      const pts = pointsTable[slot] ?? 0;
      const entry = pointsByP.get(order[i].pid);
      if (entry) {
        entry.points += pts;
        entry.perRun[run - 1] = pts;
      }
    }
  }

  const byPoints = rank(
    participantIds
      .filter((pid) => (pointsByP.get(pid)?.points ?? 0) > 0)
      .map((pid) => ({ participantId: pid, value: pointsByP.get(pid)?.points ?? 0 })),
    'desc',
  ).map((e) => ({
    participantId: e.participantId,
    points: e.value,
    perRun: pointsByP.get(e.participantId)?.perRun ?? [],
    rank: e.rank,
  }));

  return {
    byTotalTime,
    incompleteTotal,
    byBestRun,
    byPoints,
    hasAnyTime,
    hasAnyResult: results.length > 0,
  };
}

// Walk back to the first index sharing this key to find its points slot.
function prevSlot(order: { key: number }[], i: number): number {
  let j = i;
  while (j > 0 && order[j - 1].key === order[i].key) j--;
  return j;
}
