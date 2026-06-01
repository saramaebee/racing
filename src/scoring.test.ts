import { describe, expect, test } from 'bun:test';
import { type ResultLike, computeStandings } from './scoring';
import { formatMs, parseTimeToMs } from './time';

const POINTS = [6, 5, 4, 3, 2, 1];

function r(
  participant_id: number,
  run_no: number,
  time_ms: number | null,
  position = null,
): ResultLike {
  return { participant_id, run_no, time_ms, position };
}

describe('parseTimeToMs', () => {
  test('plain seconds with fraction', () => {
    expect(parseTimeToMs('45.231')).toBe(45231);
  });
  test('integer seconds', () => {
    expect(parseTimeToMs('45')).toBe(45000);
  });
  test('minutes:seconds', () => {
    expect(parseTimeToMs('1:02.5')).toBe(62500);
  });
  test('hours:minutes:seconds', () => {
    expect(parseTimeToMs('1:01:00')).toBe(3660000);
  });
  test('blank is null', () => {
    expect(parseTimeToMs('   ')).toBeNull();
  });
  test('garbage is null', () => {
    expect(parseTimeToMs('abc')).toBeNull();
  });
});

describe('formatMs', () => {
  test('sub-minute keeps 3 decimals', () => {
    expect(formatMs(45231)).toBe('45.231');
  });
  test('over a minute uses m:ss.fff', () => {
    expect(formatMs(62500)).toBe('1:02.500');
  });
  test('null is empty', () => {
    expect(formatMs(null)).toBe('');
  });
});

describe('computeStandings — timed championship', () => {
  // 3 racers, 2 runs. A is fastest overall.
  const results = [
    r(1, 1, 45000),
    r(1, 2, 46000), // A total 91.0
    r(2, 1, 47000),
    r(2, 2, 45500), // B total 92.5
    r(3, 1, 50000),
    r(3, 2, 44000), // C total 94.0, but best run 44.0
  ];
  const s = computeStandings([1, 2, 3], results, 2, POINTS);

  test('total time ranks lowest sum first', () => {
    expect(s.byTotalTime.map((x) => x.participantId)).toEqual([1, 2, 3]);
    expect(s.byTotalTime[0].value).toBe(91000);
  });

  test('best run finds fastest single run', () => {
    expect(s.byBestRun[0].participantId).toBe(3); // C's 44.0 is the fastest run
    expect(s.byBestRun[0].value).toBe(44000);
  });

  test('points awarded per run by finishing order', () => {
    // Run 1 order: A(45),B(47),C(50) -> A6 B5 C4
    // Run 2 order: C(44),B(45.5),A(46) -> C6 B5 A4
    // Totals: A10 B10 C10 -> all tied
    const pts = new Map(s.byPoints.map((p) => [p.participantId, p.points]));
    expect(pts.get(1)).toBe(10);
    expect(pts.get(2)).toBe(10);
    expect(pts.get(3)).toBe(10);
  });
});

describe('computeStandings — incomplete totals', () => {
  const results = [
    r(1, 1, 45000),
    r(1, 2, 46000), // complete
    r(2, 1, 47000), // missing run 2
  ];
  const s = computeStandings([1, 2], results, 2, POINTS);

  test('only fully-timed racers appear in total', () => {
    expect(s.byTotalTime.map((x) => x.participantId)).toEqual([1]);
  });
  test('partially-timed racer flagged incomplete', () => {
    expect(s.incompleteTotal).toContain(2);
  });
});

describe('computeStandings — ties share rank and points', () => {
  const results = [r(1, 1, 45000), r(2, 1, 45000), r(3, 1, 48000)];
  const s = computeStandings([1, 2, 3], results, 1, POINTS);

  test('equal times share rank 1, next is rank 3', () => {
    const ranks = new Map(s.byBestRun.map((x) => [x.participantId, x.rank]));
    expect(ranks.get(1)).toBe(1);
    expect(ranks.get(2)).toBe(1);
    expect(ranks.get(3)).toBe(3);
  });

  test('tied racers both get 1st-place points', () => {
    const pts = new Map(s.byPoints.map((p) => [p.participantId, p.points]));
    expect(pts.get(1)).toBe(6);
    expect(pts.get(2)).toBe(6);
    expect(pts.get(3)).toBe(4); // slot index 2 -> 4 points
  });
});

describe('computeStandings — position-only (no stopwatch)', () => {
  const results: ResultLike[] = [
    { participant_id: 1, run_no: 1, time_ms: null, position: 2 },
    { participant_id: 2, run_no: 1, time_ms: null, position: 1 },
    { participant_id: 3, run_no: 1, time_ms: null, position: 3 },
  ];
  const s = computeStandings([1, 2, 3], results, 1, POINTS);

  test('points derive from manual positions', () => {
    const pts = new Map(s.byPoints.map((p) => [p.participantId, p.points]));
    expect(pts.get(2)).toBe(6); // 1st
    expect(pts.get(1)).toBe(5); // 2nd
    expect(pts.get(3)).toBe(4); // 3rd
  });

  test('no times means no time leaderboards', () => {
    expect(s.hasAnyTime).toBe(false);
    expect(s.byTotalTime).toHaveLength(0);
    expect(s.byBestRun).toHaveLength(0);
  });
});
