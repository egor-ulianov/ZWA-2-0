import React from 'react';

export default function StudentLogin() {
  const [username, setUsername] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/student/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, code }) });
    if (res.ok) {
      window.location.href = '/student/progress';
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-5xl mx-auto p-4 md:p-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-fuchsia-300/40 dark:bg-fuchsia-500/20 blur-3xl" />
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Student Portal</h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1">Sign in to view your progress</p>
        </header>

        <main className="max-w-md mx-auto">
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow">
            <div className="px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800">
              <h2 className="text-lg font-bold">Student Login</h2>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">Username</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. IHNATILL"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">Auth code</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="6-char code from your teacher"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  autoComplete="one-time-code"
                  required
                />
              </div>
              {!!error && (
                <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>
              )}
              <button
                className="w-full px-4 py-2 rounded-lg bg-sky-600 text-white disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-xs text-zinc-500 text-center mt-3">
            Having trouble? Contact your instructor for your auth code.
          </p>
        </main>

        <footer className="mt-10 text-sm text-zinc-500 text-center">
          © 2025 ZWA – Student view
        </footer>
      </div>
    </div>
  );
}


