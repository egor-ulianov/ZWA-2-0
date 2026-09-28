import React from 'react';

import TeacherWorkspace, {
  TeacherLogin,
} from '../../src/course-ui/operations/TeacherWorkspace.jsx';
import styles from '../../src/course-ui/operations/operations.module.css';
import { buildNormalizationRequestBody, isAbortError, request } from '../../src/lib/apiClient.js';

const INITIAL_TEST_STATE = {
  1: { loading: false, error: '', result: null },
  2: { loading: false, error: '', result: null },
  3: { loading: false, error: '', result: null },
  4: { loading: false, error: '', result: null },
};

function NormalizationPanel({ testNumber, state, onRun }) {
  const result = state.result;
  const preview = result?.preview || [];

  return (
    <section
      aria-labelledby={`normalization-test-${testNumber}-title`}
      className={styles.record}
      role="region"
    >
      <header className={styles.recordHeader}>
        <div>
          <p className={styles.sectionLabel}>Grade review</p>
          <h2 id={`normalization-test-${testNumber}-title`}>Test {testNumber} normalization</h2>
        </div>
      </header>
      <div className={`${styles.recordBody} ${styles.stack}`}>
        <p className={styles.muted}>
          Dry run before applying changes. Review the bounded preview, then apply only this matching
          run.
        </p>
        <div className={styles.buttonRow}>
          <button
            className={styles.secondaryButton}
            disabled={state.loading}
            onClick={() => onRun(testNumber, true)}
            type="button"
          >
            Dry run normalization for Test {testNumber}
          </button>
          <button
            className={styles.primaryButton}
            disabled={state.loading || !result?.runId}
            onClick={() => onRun(testNumber, false)}
            type="button"
          >
            Apply normalization for Test {testNumber}
          </button>
        </div>
        {state.loading ? (
          <p aria-live="polite" className={styles.statusLine} role="status">
            Processing normalization…
          </p>
        ) : null}
        {state.error ? (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        ) : null}
        {result ? (
          <div className={styles.stack}>
            <p>
              <strong>Total:</strong> {result.total ?? 0} · <strong>Updated:</strong>{' '}
              {result.updated ?? 0}
            </p>
            {preview.length > 0 ? (
              <div className={`${styles.tableScroll} overflow-x-auto`}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Username</th>
                      <th scope="col">Original</th>
                      <th scope="col">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((item) => (
                      <tr key={item.username}>
                        <td>{item.username}</td>
                        <td>{item.originalPoints}</td>
                        <td>{item.normalizedPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.muted}>
                {result.updated > 0 ? 'Applied.' : 'No preview available.'}
              </p>
            )}
            {preview.length > 20 ? (
              <p className={styles.muted}>Showing first 20 of {preview.length} rows…</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function TeacherNormalize() {
  const [auth, setAuth] = React.useState({ loading: true, username: '', error: '' });
  const [authAttempt, setAuthAttempt] = React.useState(0);
  const [stateByTest, setStateByTest] = React.useState(INITIAL_TEST_STATE);

  React.useEffect(() => {
    let mounted = true;
    setAuth({ loading: true, username: '', error: '' });
    request('/api/teacher/me')
      .then((data) => {
        if (mounted) setAuth({ loading: false, username: data.username || '', error: '' });
      })
      .catch((error) => {
        if (mounted && !isAbortError(error)) {
          setAuth({ loading: false, username: '', error: 'Unauthorized' });
        }
      });
    return () => {
      mounted = false;
    };
  }, [authAttempt]);

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
      setStateByTest((current) => ({
        ...current,
        [testNumber]: {
          ...current[testNumber],
          loading: false,
          error: error.message || 'Run a dry-run before applying normalization',
        },
      }));
      return;
    }

    setStateByTest((current) => ({
      ...current,
      [testNumber]: { ...current[testNumber], loading: true, error: '', result: null },
    }));
    try {
      const data = await request('/api/teacher/normalize-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setStateByTest((current) => ({
        ...current,
        [testNumber]: { loading: false, error: '', result: data },
      }));
    } catch (error) {
      if (isAbortError(error)) return;
      setStateByTest((current) => ({
        ...current,
        [testNumber]: {
          ...current[testNumber],
          loading: false,
          error: error.message || 'Failed',
        },
      }));
    }
  }

  const workspaceProps = {
    activeSection: 'normalization',
    description: 'Review grade changes safely with a dry run before applying any normalization.',
    title: 'Grade normalization',
  };

  if (auth.loading) {
    return (
      <TeacherWorkspace {...workspaceProps}>
        <section aria-live="polite" className={styles.statusPanel} role="status">
          <p className={styles.muted}>Loading…</p>
        </section>
      </TeacherWorkspace>
    );
  }

  if (auth.error) {
    return (
      <TeacherWorkspace {...workspaceProps}>
        <section aria-labelledby="teacher-login-title" className={styles.panel}>
          <p className={styles.sectionLabel}>Secure access</p>
          <h2 id="teacher-login-title">Teacher login</h2>
          <p className={styles.muted}>Sign in to review and apply grade normalization changes.</p>
          <TeacherLogin
            onSuccess={() => {
              setAuth({ loading: true, username: '', error: '' });
              setAuthAttempt((attempt) => attempt + 1);
            }}
          />
        </section>
      </TeacherWorkspace>
    );
  }

  return (
    <TeacherWorkspace {...workspaceProps} username={auth.username}>
      <div className={styles.twoColumn}>
        {[1, 2, 3, 4].map((testNumber) => (
          <NormalizationPanel
            key={testNumber}
            onRun={runNormalize}
            state={stateByTest[testNumber]}
            testNumber={testNumber}
          />
        ))}
      </div>
    </TeacherWorkspace>
  );
}
