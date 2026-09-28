import Link from 'next/link';
import { useState } from 'react';

import { request } from '../../lib/apiClient.js';
import OperationsApplication from './OperationsApplication.jsx';
import styles from './operations.module.css';

const SECTIONS = [
  { key: 'attendance', href: '/attendance', label: 'Attendance & records' },
  { key: 'normalization', href: '/teacher', label: 'Grade normalization' },
];

export function TeacherLogin({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await request('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      setPassword('');
      onSuccess();
    } catch (cause) {
      setError(cause.message || 'Login failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form aria-label="Teacher login" className={styles.form} onSubmit={submit}>
      <label className={styles.field} htmlFor="teacher-username">
        Username
        <input
          autoComplete="username"
          id="teacher-username"
          onChange={(event) => setUsername(event.target.value)}
          required
          value={username}
        />
      </label>
      <label className={styles.field} htmlFor="teacher-password">
        Password
        <input
          autoComplete="current-password"
          id="teacher-password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <div>
        <button className={styles.primaryButton} disabled={saving} type="submit">
          {saving ? 'Signing in…' : 'Login'}
        </button>
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export default function TeacherWorkspace({
  title,
  description,
  username,
  activeSection,
  actions,
  children,
}) {
  const navigation = SECTIONS.map((section) => (
    <Link
      aria-current={activeSection === section.key ? 'page' : undefined}
      href={section.href}
      key={section.key}
      prefetch={false}
    >
      {section.label}
    </Link>
  ));
  const identity = typeof username === 'string' ? username.trim() : '';

  return (
    <OperationsApplication
      actions={actions}
      contextLabel="Teacher workspace"
      description={description}
      navigation={navigation}
      title={title}
    >
      {identity ? (
        <p className={styles.muted}>
          Signed in as <strong>{identity}</strong>
        </p>
      ) : null}
      {children}
    </OperationsApplication>
  );
}
