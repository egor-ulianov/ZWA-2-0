import React from 'react';

export default function TeacherNormalize() {
  const [auth, setAuth] = React.useState({ loading: true, username: '', error: '' });
  const [stateByTest, setStateByTest] = React.useState({
    1: { loading: false, error: '', result: null },
    2: { loading: false, error: '', result: null },
    3: { loading: false, error: '', result: null },
    4: { loading: false, error: '', result: null }
  });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/teacher/me');
        if (!res.ok) throw new Error('Unauthorized');
        const d = await res.json();
        if (!mounted) return;
        setAuth({ loading: false, username: d.username || '', error: '' });
      } catch (e) {
        if (mounted) setAuth({ loading: false, username: '', error: 'Unauthorized' });
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function runNormalize(testNumber, dryRun) {
    setStateByTest((s) => ({
      ...s,
      [testNumber]: { ...s[testNumber], loading: true, error: '', result: null }
    }));
    try {
      const res = await fetch('/api/teacher/normalize-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testNumber,
          maxPoints: 12,
          dryRun
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setStateByTest((s) => ({
        ...s,
        [testNumber]: { loading: false, error: '', result: data }
      }));
    } catch (e) {
      setStateByTest((s) => ({
        ...s,
        [testNumber]: { loading: false, error: String(e.message || e), result: null }
      }));
    }
  }

  function Panel({ tn }) {
    const st = stateByTest[tn] || { loading: false, error: '', result: null };
    const result = st.result;
    const preview = result?.preview || [];
    return (
      <section className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow">
        <div className="px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">Test {tn}</h2>
          <div className="flex items-center gap-2">
            <button
              className="text-xs px-3 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
              onClick={() => runNormalize(tn, true)}
              disabled={st.loading}
            >
              Dry‑run
            </button>
            <button
              className="text-xs px-3 py-1 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50"
              onClick={() => runNormalize(tn, false)}
              disabled={st.loading}
            >
              Apply
            </button>
          </div>
        </div>
        <div className="p-4">
          {st.loading ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Processing…</div>
          ) : null}
          {st.error ? (
            <div className="text-sm text-rose-600 dark:text-rose-400">{st.error}</div>
          ) : null}
          {result ? (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">Total:</span> {result.total ?? 0}{' '}
                <span className="ml-3 font-medium">Updated:</span> {result.updated ?? 0}
              </div>
              {Array.isArray(preview) && preview.length > 0 ? (
                <div className="rounded-lg border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50/80 dark:bg-zinc-800/60">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Username</th>
                        <th className="text-left px-3 py-2 font-semibold">Original</th>
                        <th className="text-left px-3 py-2 font-semibold">New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 20).map((it) => (
                        <tr key={it.username} className="odd:bg-white/50 dark:odd:bg-zinc-900/40">
                          <td className="px-3 py-2">{it.username}</td>
                          <td className="px-3 py-2">{it.originalPoints}</td>
                          <td className="px-3 py-2">{it.normalizedPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 20 ? (
                    <div className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                      Showing first 20 of {preview.length} rows…
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  {result.updated > 0 ? 'Applied.' : 'No preview available.'}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (auth.loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-6">
            <p className="text-zinc-600 dark:text-zinc-300">Loading…</p>
          </div>
        </main>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="rounded-2xl border border-rose-300/40 dark:border-rose-900/40 bg-white/70 dark:bg-zinc-900/60 p-6">
            <p className="text-rose-600 dark:text-rose-400">{auth.error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-sky-50 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-5xl mx-auto p-4 md:p-8 relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-fuchsia-300/40 dark:bg-fuchsia-500/20 blur-3xl" />
        </div>

        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Teacher – Normalize Grades</h1>
            <p className="text-xs md:text-sm text-zinc-500 mt-1">Username: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{auth.username}</span></p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map((tn) => <Panel key={tn} tn={tn} />)}
        </div>

        <footer className="mt-8 text-sm text-zinc-500">
          © 2025 ZWA – Teacher view
        </footer>
      </div>
    </div>
  );
}



