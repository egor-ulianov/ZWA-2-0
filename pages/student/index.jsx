import React from 'react';

import OperationsApplication from '../../src/course-ui/operations/OperationsApplication.jsx';
import StudentAccess from '../../src/course-ui/operations/StudentAccess.jsx';
import { request } from '../../src/lib/apiClient.js';

export default function StudentLogin() {
  const [username, setUsername] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    request('/api/student/me', { signal: controller.signal })
      .then(() => window.location.replace('/student/progress'))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await request('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code }),
      });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional auth-boundary navigation.
      window.location.href = '/student/progress';
    } catch (cause) {
      setError(cause.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <OperationsApplication
      contextLabel="Student access"
      description="Sign in to view your evaluations, assignment record, and attendance."
      title="Student Portal"
    >
      <StudentAccess
        code={code}
        error={error}
        loading={loading}
        onCodeChange={setCode}
        onSubmit={submit}
        onUsernameChange={setUsername}
        username={username}
      />
    </OperationsApplication>
  );
}
