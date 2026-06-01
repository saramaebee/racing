import type { Championship } from '../db';
import { Layout } from './layout';

interface HomeProps {
  isEditor: boolean;
  championships: { champ: Championship; participantCount: number }[];
}

export function Home({ isEditor, championships }: HomeProps) {
  return (
    <Layout title="Racing — Championships" isEditor={isEditor}>
      <div class="page-header">
        <div class="titles">
          <h1>Championships</h1>
          <p class="lead">
            Track standings across runs — total time, best run, and points, all at once.
          </p>
        </div>
      </div>

      {championships.length === 0 ? (
        <div class="empty">
          <h3>No championships yet</h3>
          <p>{isEditor ? 'Create one below to get started.' : 'Log in to create one.'}</p>
        </div>
      ) : (
        <div class="champ-grid" style="margin-bottom: 28px;">
          {championships.map(({ champ, participantCount }) => (
            <a class="champ-card" href={`/c/${champ.id}`}>
              <div class="name">{champ.name}</div>
              <div class="sub">
                {participantCount} racer{participantCount === 1 ? '' : 's'} · {champ.num_runs} run
                {champ.num_runs === 1 ? '' : 's'}
              </div>
            </a>
          ))}
        </div>
      )}

      {isEditor ? (
        <div class="card">
          <h2>New championship</h2>
          <form method="post" action="/championships" class="stack">
            <label class="field">
              <span class="lbl">Name</span>
              <input type="text" name="name" placeholder="Luge — Saturday" required />
            </label>
            <label class="field">
              <span class="lbl">Number of runs</span>
              <input type="number" name="num_runs" value="4" min="1" max="50" required />
            </label>
            <label class="field">
              <span class="lbl">Racers (one per line)</span>
              <textarea
                name="participants"
                rows={6}
                placeholder={'Sara\nAlex\nJordan\nSam\nKai\nRiley'}
                required
              />
            </label>
            <label class="field">
              <span class="lbl">Points per finishing place</span>
              <input type="text" name="points" value="6,5,4,3,2,1" />
              <span class="hint">
                Comma-separated: points for 1st, 2nd, 3rd… Used for the points leaderboard.
              </span>
            </label>
            <div>
              <button type="submit" class="btn-large">
                Create championship
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </Layout>
  );
}

export function Login({ error }: { error?: boolean }) {
  return (
    <Layout title="Log in — Racing" isEditor={false}>
      <div class="login">
        <div class="card">
          <div class="login-mark">🏁</div>
          <h2>Enter the edit password</h2>
          <p class="muted">
            Viewing is open to everyone. Editing scores needs the shared password.
          </p>
          {error ? <div class="notice">Wrong password — try again.</div> : null}
          <form method="post" action="/login" class="stack">
            <input type="password" name="password" placeholder="Password" autofocus required />
            <button type="submit" class="btn-large">
              Log in
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
