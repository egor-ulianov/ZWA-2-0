import styles from './operations.module.css';

export default function StudentAccess({
  username,
  code,
  error,
  loading,
  onUsernameChange,
  onCodeChange,
  onSubmit,
}) {
  return (
    <section className={styles.panel} aria-labelledby="student-login-title">
      <div className={styles.form}>
        <div>
          <p className={styles.sectionLabel}>Pouze pro studenty kurzu</p>
          <h2 id="student-login-title">Student Login</h2>
          <p className={styles.muted}>
            Use the access code from your instructor to open your read-only study record.
          </p>
        </div>
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.field} htmlFor="student-username">
            Username
            <input
              id="student-username"
              autoComplete="username"
              placeholder="e.g. IHNATILL"
              required
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
            />
          </label>
          <label className={styles.field} htmlFor="student-code">
            Auth code
            <input
              id="student-code"
              autoComplete="one-time-code"
              placeholder="6-char code from your teacher"
              required
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
            />
          </label>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <div>
            <button className={styles.primaryButton} disabled={loading} type="submit">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
