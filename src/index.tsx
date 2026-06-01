import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { EDIT_COOKIE, checkPassword, makeToken, verifyToken } from './auth';
import {
  DEFAULT_POINTS,
  addParticipant,
  addRun,
  createChampionship,
  getChampionship,
  getParticipants,
  getResults,
  listChampionships,
  upsertResult,
} from './db';
import { computeStandings } from './scoring';
import { parseTimeToMs } from './time';
import { ChampionshipPage } from './views/championship';
import { Home, Login } from './views/home';

type Env = { Variables: { isEditor: boolean } };

const app = new Hono<Env>();

app.use('*', async (c, next) => {
  c.set('isEditor', verifyToken(getCookie(c, EDIT_COOKIE)));
  await next();
});

function requireEditor(c: { get: (k: 'isEditor') => boolean }): boolean {
  return c.get('isEditor');
}

// ── Home ────────────────────────────────────────────────────────────────
app.get('/', (c) => {
  const championships = listChampionships().map((champ) => ({
    champ,
    participantCount: getParticipants(champ.id).length,
  }));
  return c.html(<Home isEditor={c.get('isEditor')} championships={championships} />);
});

// ── Auth ────────────────────────────────────────────────────────────────
app.get('/login', (c) => {
  if (c.get('isEditor')) return c.redirect('/');
  return c.html(<Login error={c.req.query('error') === '1'} />);
});

app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const password = String(body.password ?? '');
  if (!checkPassword(password)) return c.redirect('/login?error=1');
  setCookie(c, EDIT_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return c.redirect('/');
});

app.post('/logout', (c) => {
  deleteCookie(c, EDIT_COOKIE, { path: '/' });
  return c.redirect('/');
});

// ── Create championship ───────────────────────────────────────────────────
app.post('/championships', async (c) => {
  if (!requireEditor(c)) return c.redirect('/login');
  const body = await c.req.parseBody();

  const name = String(body.name ?? '').trim();
  const numRuns = Math.max(1, Math.min(50, Number.parseInt(String(body.num_runs ?? '4'), 10) || 4));
  const participantNames = String(body.participants ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const points = parsePointsInput(String(body.points ?? ''));

  if (name === '' || participantNames.length === 0) return c.redirect('/');

  const id = createChampionship(name, numRuns, points, participantNames);
  return c.redirect(`/c/${id}`);
});

// ── Championship page ─────────────────────────────────────────────────────
app.get('/c/:id', (c) => {
  const id = Number.parseInt(c.req.param('id'), 10);
  const champ = getChampionship(id);
  if (!champ) return c.notFound();

  const participants = getParticipants(id);
  const results = getResults(id);
  const pointsTable = JSON.parse(champ.points_table) as number[];
  const standings = computeStandings(
    participants.map((p) => p.id),
    results,
    champ.num_runs,
    pointsTable,
  );
  const mode = c.req.query('mode') === 'places' ? 'places' : 'times';

  return c.html(
    <ChampionshipPage
      champ={champ}
      participants={participants}
      results={results}
      standings={standings}
      isEditor={c.get('isEditor')}
      mode={mode}
    />,
  );
});

// ── Save scores (bulk) ────────────────────────────────────────────────────
app.post('/c/:id/results', async (c) => {
  const id = Number.parseInt(c.req.param('id'), 10);
  const champ = getChampionship(id);
  if (!champ) return c.notFound();
  if (!requireEditor(c)) return c.redirect('/login');

  const body = await c.req.parseBody();
  const participants = getParticipants(id);
  const mode = c.req.query('mode') === 'places' ? 'places' : 'times';

  // Snapshot existing results so we can preserve the column the active mode
  // doesn't edit (times mode keeps any manual positions, and vice versa).
  const existing = new Map(getResults(id).map((r) => [`${r.participant_id}_${r.run_no}`, r]));

  for (const p of participants) {
    for (let run = 1; run <= champ.num_runs; run++) {
      const prior = existing.get(`${p.id}_${run}`);
      if (mode === 'times') {
        const raw = body[`t_${p.id}_${run}`];
        if (raw === undefined) continue;
        upsertResult(id, p.id, run, parseTimeToMs(String(raw)), prior?.position ?? null);
      } else {
        const raw = body[`p_${p.id}_${run}`];
        if (raw === undefined) continue;
        upsertResult(id, p.id, run, prior?.time_ms ?? null, parsePosition(String(raw)));
      }
    }
  }

  return c.redirect(`/c/${id}?mode=${mode}`);
});

// ── Add racer / run ───────────────────────────────────────────────────────
app.post('/c/:id/participants', async (c) => {
  const id = Number.parseInt(c.req.param('id'), 10);
  if (!getChampionship(id)) return c.notFound();
  if (!requireEditor(c)) return c.redirect('/login');
  const body = await c.req.parseBody();
  const name = String(body.name ?? '').trim();
  if (name !== '') addParticipant(id, name);
  return c.redirect(`/c/${id}`);
});

app.post('/c/:id/runs', (c) => {
  const id = Number.parseInt(c.req.param('id'), 10);
  if (!getChampionship(id)) return c.notFound();
  if (!requireEditor(c)) return c.redirect('/login');
  addRun(id);
  return c.redirect(`/c/${id}`);
});

// ── helpers ───────────────────────────────────────────────────────────────
function parsePointsInput(raw: string): number[] {
  const parts = raw
    .split(',')
    .map((s) => Number.parseFloat(s.trim()))
    .filter((n) => Number.isFinite(n));
  return parts.length > 0 ? parts : DEFAULT_POINTS;
}

function parsePosition(raw: string): number | null {
  const s = raw.trim();
  if (s === '') return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};
