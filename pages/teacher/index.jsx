import React from 'react';
import { buildNormalizationRequestBody, isAbortError, request } from '../../src/lib/apiClient.js';
import TeacherWorkspaceShell from '../../src/components/teacher/TeacherWorkspaceShell.jsx';

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
        const d = await request('/api/teacher/me');
        if (!mounted) return;
        setAuth({ loading: false, username: d.username || '', error: '' });
      } catch (error) {
        if (mounted && !isAbortError(error)) setAuth({ loading: false, username: '', error: 'Unauthorized' });
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function runNormalize(testNumber, dryRun) {
    let body;
    try {
      body = buildNormalizationRequestBody({
        dryRun,
        testNumber,
        maxPoints: 12,
        runId: stateByTest[testNumber]?.result?.runId,
      });
    } catch (error) {
      setStateByTest((s) => ({
        ...s,
        [testNumber]: { ...s[testNumber], loading: false, error: error.message || 'Run a dry-run before applying normalization' },
      }));
      return;
    }
    setStateByTest((s) => ({
      ...s,
      [testNumber]: { ...s[testNumber], loading: true, error: '', result: null }
    }));
    try {
      const data = await request('/api/teacher/normalize-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setStateByTest((s) => ({
        ...s,
        [testNumber]: { loading: false, error: '', result: data }
      }));
    } catch (error) {
      if (isAbortError(error)) return;
      setStateByTest((s) => ({
        ...s,
        [testNumber]: { loading: false, error: error.message || 'Failed', result: null }
      }));
    }
  }

  function Panel({ tn }) {
    const st = stateByTest[tn] || { loading: false, error: '', result: null };
    const result = st.result;
    const preview = result?.preview || [];
    return (
      <section
        className="portal-panel"
        role="region"
        aria-labelledby={`normalization-test-${tn}-title`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--portal-border)] px-4 py-4 md:px-5">
          <div className="min-w-0">
            <p className="portal-kicker">Grade review</p>
            <h2 id={`normalization-test-${tn}-title`} className="mt-2 text-lg font-semibold">
              Test {tn} normalization
            </h2>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <button
              type="button"
              className="portal-action portal-secondary-action px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => runNormalize(tn, true)}
              disabled={st.loading}
            >
              Dry run normalization for Test {tn}
            </button>
            <button
              type="button"
              className="portal-action px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => runNormalize(tn, false)}
              disabled={st.loading || !st.result?.runId}
            >
              Apply normalization for Test {tn}
            </button>
          </div>
        </div>
        <div className="space-y-4 p-4 md:p-5">
          <p className="text-sm leading-6 text-[var(--portal-text-muted)]">
            Dry run before applying changes. Review the bounded preview, then apply only this
            matching run.
          </p>
          {st.loading ? (
            <div className="text-sm text-[var(--portal-text-muted)]" role="status" aria-live="polite">
              Processing normalization…
            </div>
          ) : null}
          {st.error ? (
            <div className="text-sm text-[var(--portal-coral)]" role="alert">
              {st.error}
            </div>
          ) : null}
          {result ? (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">Total:</span> {result.total ?? 0}{' '}
                <span className="ml-3 font-medium">Updated:</span> {result.updated ?? 0}
              </div>
              {Array.isArray(preview) && preview.length > 0 ? (
                <div className="overflow-hidden rounded border border-[var(--portal-border)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--portal-surface-muted)]">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left font-semibold">
                          Username
                        </th>
                        <th scope="col" className="px-3 py-2 text-left font-semibold">
                          Original
                        </th>
                        <th scope="col" className="px-3 py-2 text-left font-semibold">
                          New
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 20).map((item) => (
                        <tr key={item.username} className="border-t border-[var(--portal-border)]">
                          <td className="px-3 py-2">{item.username}</td>
                          <td className="px-3 py-2">{item.originalPoints}</td>
                          <td className="px-3 py-2">{item.normalizedPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 20 ? (
                    <div className="border-t border-[var(--portal-border)] px-3 py-2 text-xs text-[var(--portal-text-muted)]">
                      Showing first 20 of {preview.length} rows…
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-[var(--portal-text-muted)]">
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
      <TeacherWorkspaceShell
        title="Grade normalization"
        description="Review grade changes safely with a dry run before applying any normalization."
        activeSection="normalization"
      >
        <section className="portal-panel p-6" role="status" aria-live="polite">
          <p className="text-sm text-[var(--portal-text-muted)]">Loading…</p>
        </section>
      </TeacherWorkspaceShell>
    );
  }

  if (auth.error) {
    return (
      <TeacherWorkspaceShell
        title="Grade normalization"
        description="Review grade changes safely with a dry run before applying any normalization."
        activeSection="normalization"
      >
        <section className="portal-panel p-6" role="alert">
          <p className="text-sm text-[var(--portal-coral)]">{auth.error}</p>
        </section>
      </TeacherWorkspaceShell>
    );
  }

  return (
    <TeacherWorkspaceShell
      title="Grade normalization"
      description="Review grade changes safely with a dry run before applying any normalization."
      username={auth.username}
      activeSection="normalization"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1,2,3,4].map((tn) => <Panel key={tn} tn={tn} />)}
      </div>
    </TeacherWorkspaceShell>
  );
}
