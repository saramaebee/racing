import type { Championship, Participant, Result } from '../db';
import type { PointsRow, Standings, TimeRow } from '../scoring';
import { formatMs } from '../time';
import { Layout } from './layout';

type Mode = 'times' | 'places';

interface ChampPageProps {
  champ: Championship;
  participants: Participant[];
  results: Result[];
  standings: Standings;
  isEditor: boolean;
  mode: Mode;
}

export function ChampionshipPage({
  champ,
  participants,
  results,
  standings,
  isEditor,
  mode,
}: ChampPageProps) {
  const nameOf = new Map(participants.map((p) => [p.id, p.name]));
  const runs = Array.from({ length: champ.num_runs }, (_, i) => i + 1);

  // result lookup: pid -> run -> Result
  const cell = new Map<number, Map<number, Result>>();
  for (const r of results) {
    let m = cell.get(r.participant_id);
    if (!m) {
      m = new Map();
      cell.set(r.participant_id, m);
    }
    m.set(r.run_no, r);
  }
  const timeAt = (pid: number, run: number) => cell.get(pid)?.get(run)?.time_ms ?? null;
  const posAt = (pid: number, run: number) => cell.get(pid)?.get(run)?.position ?? null;
  const totalFor = (pid: number) => {
    let sum = 0;
    let count = 0;
    for (const run of runs) {
      const t = timeAt(pid, run);
      if (t !== null) {
        sum += t;
        count++;
      }
    }
    return count === runs.length && runs.length > 0 ? sum : null;
  };

  return (
    <Layout title={`${champ.name} — Racing`} isEditor={isEditor}>
      <div class="hero">
        <div class="meta">
          <h1>{champ.name}</h1>
          <div class="sub">
            {participants.length} racers · {champ.num_runs} runs · points{' '}
            {JSON.parse(champ.points_table).join('/')}
          </div>
        </div>
        <a class="btn secondary" href="/">
          All championships
        </a>
      </div>

      {/* ── Leaderboards ── */}
      <div class="leaderboards">
        <TimeBoard
          title="Total time"
          sub="Sum of all runs · lowest wins"
          rows={standings.byTotalTime}
          nameOf={nameOf}
          empty={
            standings.hasAnyTime ? 'No racer has a time in every run yet.' : 'No times entered yet.'
          }
          incomplete={standings.incompleteTotal.map((id) => nameOf.get(id) ?? '?')}
        />
        <TimeBoard
          title="Best run"
          sub="Fastest single run · lowest wins"
          rows={standings.byBestRun}
          nameOf={nameOf}
          empty="No times entered yet."
        />
        <PointsBoard rows={standings.byPoints} nameOf={nameOf} />
      </div>

      {/* ── Score entry ── */}
      <div class="card">
        <div class="card-header">
          <h2 style="margin:0;">Scores</h2>
          <div class="row">
            <a
              class={`btn ${mode === 'times' ? '' : 'secondary'}`}
              href={`/c/${champ.id}?mode=times`}
            >
              Times
            </a>
            <a
              class={`btn ${mode === 'places' ? '' : 'secondary'}`}
              href={`/c/${champ.id}?mode=places`}
            >
              Places
            </a>
          </div>
        </div>

        {isEditor ? (
          mode === 'places' ? (
            <p class="muted" style="margin-top:-4px;">
              Enter finishing place (1 = first) when there's no stopwatch. Times leaderboards need
              actual times.
            </p>
          ) : (
            <p class="muted" style="margin-top:-4px;">
              Enter each run's time, e.g. <code>45.231</code> or <code>1:02.5</code>.
            </p>
          )
        ) : null}

        <form method="post" action={`/c/${champ.id}/results?mode=${mode}`}>
          <div class="grid-scroll">
            <table class="scores">
              <thead>
                <tr>
                  <th>Racer</th>
                  {runs.map((run) => (
                    <th>Run {run}</th>
                  ))}
                  {mode === 'times' ? <th class="col-total">Total</th> : null}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr>
                    <td class="racer">{p.name}</td>
                    {runs.map((run) =>
                      mode === 'times' ? (
                        <td>
                          {isEditor ? (
                            <input
                              type="text"
                              name={`t_${p.id}_${run}`}
                              value={formatMs(timeAt(p.id, run))}
                              placeholder="—"
                              inputmode="decimal"
                            />
                          ) : (
                            <span class="static-val">{formatMs(timeAt(p.id, run)) || '—'}</span>
                          )}
                        </td>
                      ) : (
                        <td>
                          {isEditor ? (
                            <input
                              type="text"
                              name={`p_${p.id}_${run}`}
                              value={posAt(p.id, run)?.toString() ?? ''}
                              placeholder="—"
                              inputmode="numeric"
                              style="width:56px;"
                            />
                          ) : (
                            <span class="static-val">{posAt(p.id, run)?.toString() ?? '—'}</span>
                          )}
                        </td>
                      ),
                    )}
                    {mode === 'times' ? (
                      <td class="total">{formatMs(totalFor(p.id)) || '—'}</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isEditor ? (
            <div class="row" style="margin-top:18px;">
              <button type="submit" class="btn-large">
                Save scores
              </button>
            </div>
          ) : null}
        </form>
      </div>

      {/* ── Manage (editor only) ── */}
      {isEditor ? (
        <div class="card">
          <h2>Manage</h2>
          <div class="row" style="gap:24px;">
            <form method="post" action={`/c/${champ.id}/participants`} class="inline">
              <input type="text" name="name" placeholder="Add racer" required />
              <button type="submit" class="secondary">
                Add racer
              </button>
            </form>
            <form method="post" action={`/c/${champ.id}/runs`} class="inline">
              <button type="submit" class="secondary">
                + Add a run
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}

function StandingList<T extends { participantId: number; rank: number }>({
  rows,
  nameOf,
  render,
  empty,
}: {
  rows: T[];
  nameOf: Map<number, string>;
  render: (row: T) => unknown;
  empty: string;
}) {
  if (rows.length === 0) return <p class="muted">{empty}</p>;
  return (
    <div>
      {rows.map((row) => (
        <div class={`standing r${row.rank}`}>
          <span class="pos">{row.rank}</span>
          <span class="who">{nameOf.get(row.participantId) ?? '?'}</span>
          <span class="val">{render(row)}</span>
        </div>
      ))}
    </div>
  );
}

function TimeBoard({
  title,
  sub,
  rows,
  nameOf,
  empty,
  incomplete,
}: {
  title: string;
  sub: string;
  rows: TimeRow[];
  nameOf: Map<number, string>;
  empty: string;
  incomplete?: string[];
}) {
  return (
    <div class="card leader-card">
      <h3>{title}</h3>
      <div class="lead-sub">{sub}</div>
      <StandingList
        rows={rows}
        nameOf={nameOf}
        empty={empty}
        render={(r: TimeRow) => formatMs(r.value)}
      />
      {incomplete && incomplete.length > 0 ? (
        <p class="muted" style="font-size:11px;margin:12px 0 0;">
          Incomplete: {incomplete.join(', ')}
        </p>
      ) : null}
    </div>
  );
}

function PointsBoard({ rows, nameOf }: { rows: PointsRow[]; nameOf: Map<number, string> }) {
  return (
    <div class="card leader-card">
      <h3>Points</h3>
      <div class="lead-sub">Placement points per run · highest wins</div>
      <StandingList
        rows={rows}
        nameOf={nameOf}
        empty="No results yet."
        render={(r: PointsRow) => (
          <>
            {r.points}
            <span class="unit">pts</span>
          </>
        )}
      />
    </div>
  );
}
