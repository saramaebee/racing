// Embedded stylesheet, inlined into every page (no static asset pipeline).
// Design tokens borrowed from the atmosfera web app for a consistent look.
export const STYLES = `
  :root {
    color-scheme: dark;

    --bg: #07090f;
    --bg-grad-from: rgba(99, 102, 241, 0.10);
    --bg-grad-to: transparent;

    --surface-1: #0f131c;
    --surface-2: #161b27;
    --surface-3: #1d2330;
    --surface-hover: #232a3a;

    --border: rgba(255, 255, 255, 0.06);
    --border-strong: rgba(255, 255, 255, 0.12);
    --border-accent: rgba(129, 140, 248, 0.35);

    --fg: #ebedf2;
    --fg-muted: #8d95a8;
    --fg-dim: #5b6378;

    --accent: #818cf8;
    --accent-strong: #6366f1;
    --accent-press: #4f46e5;
    --accent-glow: rgba(99, 102, 241, 0.45);

    --ok: #34d399;
    --ok-bg: rgba(52, 211, 153, 0.10);
    --ok-border: rgba(52, 211, 153, 0.28);

    --danger: #f87171;
    --danger-bg: rgba(248, 113, 113, 0.10);
    --danger-border: rgba(248, 113, 113, 0.28);

    --warn: #fbbf24;
    --warn-bg: rgba(251, 191, 36, 0.10);
    --warn-border: rgba(251, 191, 36, 0.28);

    --gold: #fcd34d;
    --silver: #cbd5e1;
    --bronze: #d8a07a;

    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
    --shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 16px 40px -8px rgba(0, 0, 0, 0.6);
    --shadow-accent: 0 0 0 1px rgba(99, 102, 241, 0.2), 0 8px 24px -8px var(--accent-glow);

    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 20px;

    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text',
      system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo,
      Consolas, monospace;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--fg);
  }

  body {
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    min-height: 100vh;
    background-image:
      radial-gradient(1200px 600px at 15% -10%, var(--bg-grad-from), var(--bg-grad-to)),
      radial-gradient(900px 500px at 95% 5%, rgba(192, 132, 252, 0.06), transparent 70%);
    background-attachment: fixed;
  }

  a { color: var(--accent); text-decoration: none; transition: color 0.12s ease; }
  a:hover { color: #a5b4fc; }
  ::selection { background: var(--accent-strong); color: white; }

  /* ── Top bar ─────────────────────────────────────────────────────────── */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(16px) saturate(140%);
    -webkit-backdrop-filter: blur(16px) saturate(140%);
    background: rgba(15, 19, 28, 0.72);
    border-bottom: 1px solid var(--border);
  }
  .topbar-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 14px 28px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--fg);
    font-size: 15px;
  }
  .brand:hover { color: var(--fg); }
  .brand-mark {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #6366f1, #c084fc);
    box-shadow: 0 4px 10px -2px var(--accent-glow);
    display: grid;
    place-items: center;
    font-size: 16px;
  }
  .topbar-spacer { flex: 1; }

  .user-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--fg-muted);
    font-size: 12px;
    font-weight: 600;
  }
  .user-chip.editing { color: var(--ok); border-color: var(--ok-border); background: var(--ok-bg); }

  /* ── Layout ──────────────────────────────────────────────────────────── */
  main { max-width: 1100px; margin: 0 auto; padding: 36px 28px 80px; }

  h1 { font-size: 26px; line-height: 1.2; letter-spacing: -0.02em; font-weight: 600; margin: 0 0 8px; }
  h2 { font-size: 16px; line-height: 1.3; letter-spacing: -0.01em; font-weight: 600; margin: 0 0 12px; }
  h3 {
    font-size: 12px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--fg-dim); margin: 0 0 12px;
  }
  p { margin: 0 0 12px; }
  p.lead { font-size: 15px; color: var(--fg-muted); margin-bottom: 24px; max-width: 720px; }
  .muted { color: var(--fg-muted); }
  .dim { color: var(--fg-dim); }
  code {
    font-family: var(--font-mono); font-size: 12.5px; background: var(--surface-2);
    padding: 1px 6px; border-radius: 4px; border: 1px solid var(--border);
  }

  .page-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 24px; margin-bottom: 28px; flex-wrap: wrap;
  }
  .page-header .titles { min-width: 0; flex: 1; }

  /* ── Cards ───────────────────────────────────────────────────────────── */
  .card {
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 22px;
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
  }
  .card h2:first-child, .card h3:first-child { margin-top: 0; }
  .card-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; margin-bottom: 14px;
  }

  /* ── Championship list cards ─────────────────────────────────────────── */
  .champ-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }
  .champ-card {
    display: block;
    padding: 18px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--fg);
    transition: transform 0.15s ease, background 0.15s ease,
                border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .champ-card:hover {
    background: var(--surface-2);
    border-color: var(--border-accent);
    transform: translateY(-1px);
    box-shadow: var(--shadow-accent);
    color: var(--fg);
  }
  .champ-card .name { font-weight: 600; font-size: 16px; letter-spacing: -0.01em; }
  .champ-card .sub { font-size: 12px; color: var(--fg-dim); margin-top: 4px; }

  /* ── Hero ────────────────────────────────────────────────────────────── */
  .hero {
    display: flex; align-items: center; gap: 18px;
    padding: 24px;
    background: linear-gradient(135deg, var(--surface-1), var(--surface-2));
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    margin-bottom: 24px;
    position: relative; overflow: hidden;
  }
  .hero::after {
    content: ''; position: absolute; top: -50%; right: -10%;
    width: 400px; height: 200%;
    background: radial-gradient(closest-side, rgba(99, 102, 241, 0.12), transparent);
    pointer-events: none;
  }
  .hero .meta { position: relative; z-index: 1; min-width: 0; flex: 1; }
  .hero h1 { margin: 0; }
  .hero .sub { margin-top: 6px; color: var(--fg-muted); font-size: 13px; }

  /* ── Leaderboards ────────────────────────────────────────────────────── */
  .leaderboards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }
  .leader-card { display: flex; flex-direction: column; }
  .leader-card .lead-sub { font-size: 11px; color: var(--fg-dim); margin: -8px 0 14px; }

  .standing {
    display: flex; align-items: center; gap: 12px;
    padding: 9px 10px;
    border-radius: var(--radius-sm);
    border-bottom: 1px solid var(--border);
  }
  .standing:last-child { border-bottom: 0; }
  .standing .pos {
    width: 26px; height: 26px; flex-shrink: 0;
    display: grid; place-items: center;
    border-radius: 7px;
    background: var(--surface-3);
    font-size: 12px; font-weight: 700;
    color: var(--fg-muted);
    font-variant-numeric: tabular-nums;
  }
  .standing.r1 .pos { background: rgba(252,211,77,0.16); color: var(--gold); box-shadow: inset 0 0 0 1px rgba(252,211,77,0.35); }
  .standing.r2 .pos { background: rgba(203,213,225,0.14); color: var(--silver); box-shadow: inset 0 0 0 1px rgba(203,213,225,0.3); }
  .standing.r3 .pos { background: rgba(216,160,122,0.16); color: var(--bronze); box-shadow: inset 0 0 0 1px rgba(216,160,122,0.32); }
  .standing .who { flex: 1; min-width: 0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .standing .val { font-family: var(--font-mono); font-size: 13px; font-variant-numeric: tabular-nums; color: var(--fg); }
  .standing .val .unit { color: var(--fg-dim); font-size: 11px; margin-left: 3px; }

  /* ── Score entry grid ────────────────────────────────────────────────── */
  .grid-scroll { overflow-x: auto; margin: 0 -4px; }
  table.scores {
    width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px;
  }
  table.scores th {
    text-align: left; padding: 8px 10px; color: var(--fg-dim);
    font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    border-bottom: 1px solid var(--border); white-space: nowrap;
  }
  table.scores td {
    padding: 7px 10px; border-bottom: 1px solid var(--border); vertical-align: middle;
  }
  table.scores tr:last-child td { border-bottom: 0; }
  table.scores .racer { font-weight: 600; white-space: nowrap; }
  table.scores input[type="text"] { width: 92px; text-align: center; font-family: var(--font-mono); }
  table.scores .static-val { font-family: var(--font-mono); color: var(--fg-muted); }
  .col-total { color: var(--accent) !important; }
  table.scores td.total { font-family: var(--font-mono); font-weight: 600; color: var(--accent); }

  /* ── Badges ──────────────────────────────────────────────────────────── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
    background: var(--surface-3); color: var(--fg-muted); border: 1px solid var(--border);
  }

  /* ── Buttons + inputs ────────────────────────────────────────────────── */
  button, .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    background: var(--accent-strong); color: white; border: 1px solid transparent;
    padding: 8px 16px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer;
    transition: background 0.12s ease, transform 0.05s ease, box-shadow 0.12s ease;
    text-decoration: none; line-height: 1.4;
  }
  button:hover, .btn:hover { background: var(--accent-press); box-shadow: 0 4px 12px -4px var(--accent-glow); text-decoration: none; }
  button:active, .btn:active { transform: translateY(1px); }
  button.secondary, .btn.secondary { background: var(--surface-2); color: var(--fg); border-color: var(--border); }
  button.secondary:hover, .btn.secondary:hover { background: var(--surface-hover); box-shadow: none; }
  button.ghost, .btn.ghost { background: transparent; color: var(--fg-muted); border-color: transparent; }
  button.ghost:hover, .btn.ghost:hover { background: var(--surface-2); color: var(--fg); box-shadow: none; }
  .btn-large { padding: 11px 22px; font-size: 14px; border-radius: var(--radius-md); }

  input[type="text"], input[type="password"], input[type="number"], textarea, select {
    background: var(--surface-2); border: 1px solid var(--border); color: var(--fg);
    padding: 8px 11px; border-radius: var(--radius-sm); font-size: 13px;
    font-family: inherit; transition: border-color 0.12s ease, box-shadow 0.12s ease; min-width: 0;
  }
  input::placeholder, textarea::placeholder { color: var(--fg-dim); }
  input:focus, textarea:focus, select:focus {
    outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }
  textarea { width: 100%; resize: vertical; font-family: inherit; line-height: 1.5; }
  label.field { display: block; margin-bottom: 14px; }
  label.field .lbl { display: block; font-size: 12px; font-weight: 600; color: var(--fg-muted); margin-bottom: 6px; }
  label.field input, label.field textarea { width: 100%; }
  label.field .hint { font-size: 11px; color: var(--fg-dim); margin-top: 5px; }

  /* ── Utilities ───────────────────────────────────────────────────────── */
  .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .stack { display: flex; flex-direction: column; gap: 10px; }
  .between { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
  .grow { flex: 1; min-width: 0; }
  form.inline { display: inline-flex; align-items: center; gap: 8px; }

  .empty {
    padding: 48px 24px; text-align: center; color: var(--fg-muted);
    background: var(--surface-1); border: 1px dashed var(--border-strong); border-radius: var(--radius-lg);
  }
  .empty h3 { font-size: 14px; color: var(--fg); text-transform: none; letter-spacing: -0.01em; margin-bottom: 4px; }
  .empty p { color: var(--fg-muted); margin: 0; }

  .notice {
    padding: 12px 14px; border-radius: var(--radius-sm); font-size: 13px;
    background: var(--warn-bg); border: 1px solid var(--warn-border); color: var(--warn);
    margin-bottom: 18px;
  }

  /* ── Login ───────────────────────────────────────────────────────────── */
  .login { max-width: 420px; margin: 64px auto; }
  .login .card { text-align: center; }
  .login-mark {
    width: 60px; height: 60px; margin: 4px auto 20px; border-radius: 16px;
    background: linear-gradient(135deg, #6366f1, #c084fc);
    box-shadow: 0 16px 48px -8px var(--accent-glow);
    display: grid; place-items: center; font-size: 30px;
  }
`;
