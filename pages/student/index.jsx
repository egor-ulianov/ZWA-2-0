import React from 'react';

import PortalFrame from '../../src/components/portal/PortalFrame.jsx';
import { portalClassNames } from '../../src/components/portal/portalClasses.js';
import { request } from '../../src/lib/apiClient.js';

export default function StudentLogin() {
  const [username, setUsername] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    request('/api/student/me', { signal: controller.signal })
      .then(() => {
        window.location.replace('/student/progress');
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await request('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code }),
      });
      // A full navigation resets the login page state after authentication.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional auth-boundary navigation.
      window.location.href = '/student/progress';
    } catch (cause) {
      setError(cause.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalFrame meta="Student access">
      <main className="mx-auto w-full max-w-2xl px-4 py-10 md:px-8 md:py-14">
        <div className="max-w-md">
          <p className={portalClassNames.kicker}>Student access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Student Portal</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--portal-text-muted)]">
            Sign in to view your progress.
          </p>
        </div>

        <section className="portal-panel mt-8 max-w-md" aria-labelledby="student-login-title">
          <div className="border-b border-[var(--portal-border)] px-5 py-4">
            <h2 id="student-login-title" className="text-lg font-semibold">
              Student Login
            </h2>
          </div>
          <form onSubmit={submit} className="space-y-5 p-5">
            <div>
              <label
                htmlFor="student-username"
                className="block text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]"
              >
                Username
              </label>
              <input
                id="student-username"
                className="mt-2 w-full rounded border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--portal-focus)]"
                placeholder="e.g. IHNATILL"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label
                htmlFor="student-code"
                className="block text-xs font-semibold uppercase tracking-wide text-[var(--portal-text-muted)]"
              >
                Auth code
              </label>
              <input
                id="student-code"
                className="mt-2 w-full rounded border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--portal-focus)]"
                placeholder="6-char code from your teacher"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                required
              />
            </div>
            {!!error && (
              <div className="text-sm text-[var(--portal-coral)]" role="alert">
                {error}
              </div>
            )}
            <button
              className={`${portalClassNames.action} w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </section>

        <p className="mt-4 max-w-md text-sm leading-6 text-[var(--portal-text-muted)]">
          Having trouble? Contact your instructor for your auth code.
        </p>
      </main>
    </PortalFrame>
  );
}
