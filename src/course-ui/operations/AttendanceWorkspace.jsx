import React from 'react';
import {
  createAttendanceSnapshotOptions,
  createSerializedRequestQueue,
  isAbortError,
  isUnauthorized,
  request,
} from '../../lib/apiClient.js';
import { MAX_CSV_INPUT_BYTES, parseAttendanceCsv, serializeAttendanceCsv } from '../../lib/csv.js';
import AttendanceImportPreview from './AttendanceImportPreview.jsx';
import AttendanceStudentRow from './AttendanceStudentRow.jsx';
import TeacherWorkspace, { TeacherLogin } from './TeacherWorkspace.jsx';
import styles from './operations.module.css';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceWorkspace() {
  const [teacher, setTeacher] = React.useState(undefined);
  const [students, setStudents] = React.useState([]);
  const [date, setDate] = React.useState(today);
  const [attendance, setAttendance] = React.useState({});
  const [overview, setOverview] = React.useState({});
  const [progress, setProgress] = React.useState({});
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');
  const [saveError, setSaveError] = React.useState(null);
  const [attendanceStatus, setAttendanceStatus] = React.useState({
    kind: 'idle',
    message: 'Attendance ready.',
  });
  const [attendanceDateLoading, setAttendanceDateLoading] = React.useState(false);
  const [attendanceDateError, setAttendanceDateError] = React.useState('');
  const [importDraft, setImportDraft] = React.useState(null);
  const queuesRef = React.useRef(new Map());
  const revisionsRef = React.useRef(new Map());
  const progressQueuesRef = React.useRef(new Map());
  const confirmedRef = React.useRef(new Map());
  const attendanceRef = React.useRef({});
  const saveVersionsRef = React.useRef(new Map());
  const fileReaderRef = React.useRef(null);
  const dateLoadVersionRef = React.useRef(0);
  const verifiedAttendanceDateRef = React.useRef(null);
  const selectedDateRef = React.useRef(date);
  const selectedDateVersionRef = React.useRef(0);
  selectedDateRef.current = date;

  React.useEffect(
    () => () => {
      const reader = fileReaderRef.current;
      fileReaderRef.current = null;
      if (reader?.readyState === 1) {
        reader.onload = null;
        reader.onerror = null;
        reader.onabort = null;
        reader.abort();
      }
    },
    [],
  );

  const onUnauthorized = React.useCallback(() => setTeacher(null), []);
  const client = React.useCallback(
    (path, options) => request(path, { ...options, onUnauthorized }),
    [onUnauthorized],
  );

  const applyAttendance = React.useCallback((targetDate, map, revision) => {
    const snapshot = { ...map };
    if (Number.isSafeInteger(revision) && revision >= 0) {
      revisionsRef.current.set(targetDate, revision);
    }
    confirmedRef.current.set(targetDate, snapshot);
    setOverview((current) => ({ ...current, [targetDate]: snapshot }));
    if (targetDate === selectedDateRef.current) {
      verifiedAttendanceDateRef.current = targetDate;
      attendanceRef.current = snapshot;
      setAttendance(snapshot);
    }
  }, []);

  const readAttendanceDate = React.useCallback(
    async (targetDate, signal) => {
      const data = await client(`/api/attendance?date=${encodeURIComponent(targetDate)}`, {
        signal,
      });
      const revision = Number(data?.revision);
      if (!Number.isSafeInteger(revision) || revision < 0)
        throw new Error('Attendance response is missing a revision');
      const map = data.map || {};
      return { map, revision };
    },
    [client],
  );

  const reloadAttendance = React.useCallback(
    (targetDate, signal) => readAttendanceDate(targetDate, signal),
    [readAttendanceDate],
  );

  const loadTeacherData = React.useCallback(
    async (signal) => {
      setError('');
      setTeacher(undefined);
      setStudents([]);
      setOverview({});
      setProgress({});
      attendanceRef.current = {};
      verifiedAttendanceDateRef.current = null;
      setAttendance({});
      setAttendanceDateError('');
      try {
        const me = await client('/api/teacher/me', { signal });
        const [studentData, attendanceData, progressData] = await Promise.all([
          client('/api/students', { signal }),
          client('/api/attendance', { signal }),
          client('/api/progress', { signal }),
        ]);
        const nextOverview = attendanceData.overview || {};
        setStudents(studentData.students || []);
        setOverview(nextOverview);
        setProgress(
          Object.fromEntries((progressData.items || []).map((item) => [item.username, item])),
        );
        setAttendanceDateLoading(true);
        setTeacher(me.username || 'teacher');
      } catch (cause) {
        if (isAbortError(cause) || isUnauthorized(cause)) return;
        setError(cause.message || 'Unable to load teacher data');
      }
    },
    [client],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    loadTeacherData(controller.signal);
    return () => controller.abort();
  }, [loadTeacherData]);

  React.useEffect(() => {
    if (!teacher) return undefined;
    const requestVersion = ++dateLoadVersionRef.current;
    const requestedDate = date;
    const controller = new AbortController();
    setAttendanceDateLoading(true);
    setAttendanceDateError('');
    readAttendanceDate(requestedDate, controller.signal)
      .then(({ map, revision }) => {
        if (dateLoadVersionRef.current !== requestVersion || requestedDate !== date) return;
        applyAttendance(requestedDate, map, revision);
        setError('');
      })
      .catch((cause) => {
        if (dateLoadVersionRef.current !== requestVersion || requestedDate !== date) return;
        if (isAbortError(cause) || isUnauthorized(cause)) return;
        const message = cause.message || 'Unable to load attendance';
        confirmedRef.current.delete(requestedDate);
        revisionsRef.current.delete(requestedDate);
        verifiedAttendanceDateRef.current = null;
        attendanceRef.current = {};
        setAttendance({});
        setAttendanceDateError(message);
        setError(message);
      })
      .finally(() => {
        if (dateLoadVersionRef.current === requestVersion && requestedDate === date) {
          setAttendanceDateLoading(false);
        }
      });
    return () => controller.abort();
  }, [applyAttendance, date, readAttendanceDate, teacher]);

  async function refreshAttendanceDate(targetDate) {
    if (targetDate !== selectedDateRef.current) return { stale: true };
    const requestVersion = ++dateLoadVersionRef.current;
    setAttendanceDateLoading(true);
    setAttendanceDateError('');
    try {
      const { map, revision } = await reloadAttendance(targetDate);
      if (dateLoadVersionRef.current !== requestVersion || targetDate !== selectedDateRef.current)
        return { stale: true };
      applyAttendance(targetDate, map, revision);
      setError('');
      return { stale: false };
    } catch (cause) {
      if (
        dateLoadVersionRef.current === requestVersion &&
        targetDate === selectedDateRef.current &&
        !isAbortError(cause) &&
        !isUnauthorized(cause)
      ) {
        const message = cause.message || 'Unable to reload attendance';
        confirmedRef.current.delete(targetDate);
        revisionsRef.current.delete(targetDate);
        verifiedAttendanceDateRef.current = null;
        attendanceRef.current = {};
        setAttendance({});
        setAttendanceDateError(message);
        setError(message);
      }
      throw cause;
    } finally {
      if (dateLoadVersionRef.current === requestVersion && targetDate === selectedDateRef.current) {
        setAttendanceDateLoading(false);
      }
    }
  }

  function queueForDate(targetDate) {
    if (!queuesRef.current.has(targetDate)) {
      queuesRef.current.set(
        targetDate,
        createSerializedRequestQueue(({ map }) => {
          const options = createAttendanceSnapshotOptions({
            date: targetDate,
            map,
            revision: revisionsRef.current.get(targetDate),
          });
          return client('/api/attendance', options).then((result) => {
            const revision = Number(result?.revision);
            if (!Number.isSafeInteger(revision) || revision < 0)
              throw new Error('Attendance response is missing a revision');
            revisionsRef.current.set(targetDate, revision);
            return result;
          });
        }),
      );
    }
    return queuesRef.current.get(targetDate);
  }

  function persist(targetDate, nextMap) {
    const selectedDateVersion = selectedDateVersionRef.current;
    const version = (saveVersionsRef.current.get(targetDate) || 0) + 1;
    saveVersionsRef.current.set(targetDate, version);
    setSaveError(null);
    setAttendanceStatus({ kind: 'saving', message: 'Saving attendance…' });
    const snapshot = { ...nextMap };
    const queue = queueForDate(targetDate);
    return queue
      .enqueue({ map: snapshot })
      .then(() => {
        confirmedRef.current.set(targetDate, snapshot);
        setOverview((current) => ({ ...current, [targetDate]: snapshot }));
        const isCurrentDate =
          targetDate === selectedDateRef.current &&
          selectedDateVersionRef.current === selectedDateVersion;
        if (isCurrentDate) {
          verifiedAttendanceDateRef.current = targetDate;
          attendanceRef.current = snapshot;
          setAttendance(snapshot);
        }
        if (isCurrentDate && saveVersionsRef.current.get(targetDate) === version) {
          setSaveError(null);
          setAttendanceStatus({ kind: 'saved', message: 'Attendance saved.' });
        }
      })
      .catch(async (cause) => {
        if (isAbortError(cause) || isUnauthorized(cause)) throw cause;
        if (cause.status === 409) {
          queue.clearPending(cause);
          const isCurrentDate =
            targetDate === selectedDateRef.current &&
            selectedDateVersionRef.current === selectedDateVersion;
          if (isCurrentDate) {
            setAttendanceStatus({
              kind: 'conflict',
              message:
                'Attendance conflict: the latest values are being reloaded. Review and retry.',
            });
          }
          try {
            const refresh = await refreshAttendanceDate(targetDate);
            if (
              !refresh.stale &&
              targetDate === selectedDateRef.current &&
              selectedDateVersionRef.current === selectedDateVersion &&
              saveVersionsRef.current.get(targetDate) === version
            ) {
              setSaveError({
                message:
                  'Attendance changed on the server. The latest values were reloaded; review and retry.',
                date: targetDate,
                conflict: true,
                action: 'reload',
              });
            }
          } catch (reloadError) {
            if (
              !isAbortError(reloadError) &&
              !isUnauthorized(reloadError) &&
              targetDate === selectedDateRef.current &&
              selectedDateVersionRef.current === selectedDateVersion &&
              saveVersionsRef.current.get(targetDate) === version
            ) {
              const message = reloadError.message || 'Unable to reload attendance after a conflict';
              setAttendanceStatus({
                kind: 'error',
                message: `Attendance reload failed: ${message}`,
              });
              setSaveError({ message, date: targetDate, conflict: true, action: 'reload' });
            }
          }
        } else if (
          targetDate === selectedDateRef.current &&
          selectedDateVersionRef.current === selectedDateVersion &&
          saveVersionsRef.current.get(targetDate) === version
        ) {
          attendanceRef.current = confirmedRef.current.get(targetDate) || {};
          setAttendance(attendanceRef.current);
          const message = cause.message || 'Unable to save attendance';
          setAttendanceStatus({ kind: 'error', message: `Attendance save failed: ${message}` });
          setSaveError({ message, date: targetDate, map: snapshot, action: 'retry' });
        }
        throw cause;
      });
  }

  function updateAttendance(nextMap) {
    if (attendanceDateLoading || attendanceDateError || verifiedAttendanceDateRef.current !== date)
      return;
    const snapshot = { ...nextMap };
    attendanceRef.current = snapshot;
    setAttendance(snapshot);
    persist(date, snapshot).catch((cause) => {
      if (!isAbortError(cause) && !isUnauthorized(cause)) return;
      return undefined;
    });
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (fileReaderRef.current) {
      setSaveError({ message: 'A CSV file is already being read.' });
      return;
    }
    function showImportError(message) {
      setImportDraft(null);
      setSaveError({ message });
    }
    if (typeof file.size === 'number' && file.size > MAX_CSV_INPUT_BYTES) {
      showImportError(`CSV file exceeds the maximum size of ${MAX_CSV_INPUT_BYTES} bytes.`);
      return;
    }
    const reader = new FileReader();
    const readDateVersion = dateLoadVersionRef.current;
    fileReaderRef.current = reader;
    const finishReading = () => {
      if (fileReaderRef.current === reader) fileReaderRef.current = null;
    };
    reader.onload = () => {
      if (dateLoadVersionRef.current !== readDateVersion) {
        finishReading();
        return;
      }
      try {
        setImportDraft(
          parseAttendanceCsv(String(reader.result || ''), {
            knownUsernames: new Set(students.map((student) => student.username)),
          }),
        );
      } catch (cause) {
        showImportError(cause.message || 'Unable to parse CSV');
      } finally {
        finishReading();
      }
    };
    reader.onerror = () => {
      finishReading();
      if (dateLoadVersionRef.current !== readDateVersion) return;
      showImportError(reader.error?.message || 'Unable to read CSV file');
    };
    reader.onabort = () => {
      finishReading();
      if (dateLoadVersionRef.current !== readDateVersion) return;
      showImportError('CSV file reading was cancelled.');
    };
    try {
      reader.readAsText(file);
    } catch (cause) {
      finishReading();
      showImportError(cause.message || 'Unable to read CSV file');
    }
  }

  function confirmImport() {
    if (
      attendanceDateLoading ||
      attendanceDateError ||
      !importDraft?.entries.length ||
      !importDraft.date
    )
      return;
    const draft = importDraft;
    const sourceDateVersion = selectedDateVersionRef.current;
    let importDateVersion = sourceDateVersion;
    setSaveError(null);
    (async () => {
      try {
        const baseResponse =
          draft.date === selectedDateRef.current
            ? { map: attendanceRef.current, revision: revisionsRef.current.get(draft.date) }
            : await readAttendanceDate(draft.date);
        if (selectedDateVersionRef.current !== sourceDateVersion) return;
        if (Number.isSafeInteger(baseResponse.revision) && baseResponse.revision >= 0) {
          revisionsRef.current.set(draft.date, baseResponse.revision);
        }
        const base = baseResponse.map;
        const next = {
          ...base,
          ...Object.fromEntries(draft.entries.map((entry) => [entry.username, entry.present])),
        };
        if (draft.date !== selectedDateRef.current) {
          selectedDateRef.current = draft.date;
          selectedDateVersionRef.current += 1;
          importDateVersion = selectedDateVersionRef.current;
          dateLoadVersionRef.current += 1;
          setAttendanceDateLoading(true);
          setAttendanceDateError('');
          setError('');
          setSaveError(null);
          setImportDraft(null);
          setAttendanceStatus({ kind: 'idle', message: 'Attendance ready.' });
          verifiedAttendanceDateRef.current = null;
          attendanceRef.current = {};
          setAttendance({});
          setDate(draft.date);
        }
        attendanceRef.current = next;
        setAttendance(next);
        await persist(draft.date, next);
        if (
          selectedDateRef.current !== draft.date ||
          selectedDateVersionRef.current !== importDateVersion
        )
          return;
        const readback = await readAttendanceDate(draft.date);
        if (
          selectedDateRef.current !== draft.date ||
          selectedDateVersionRef.current !== importDateVersion
        )
          return;
        applyAttendance(draft.date, readback.map, readback.revision);
        setImportDraft(null);
      } catch (cause) {
        if (isAbortError(cause) || isUnauthorized(cause)) return;
        if (
          selectedDateRef.current !== draft.date ||
          selectedDateVersionRef.current !== importDateVersion
        )
          return;
        setSaveError((current) =>
          current?.date === draft.date && current.action
            ? current
            : {
                message: cause.message || 'Unable to persist or verify CSV import',
                date: draft.date,
                action: 'reload',
              },
        );
      }
    })();
  }

  function retrySave() {
    if (attendanceDateLoading || !saveError?.action) return;
    if (saveError.date !== selectedDateRef.current) {
      setSaveError(null);
      return;
    }
    if (saveError.action === 'reload') {
      setAttendanceStatus({ kind: 'loading', message: 'Reloading latest attendance…' });
      const reloadDate = saveError.date;
      const refreshPromise = refreshAttendanceDate(reloadDate);
      const refreshVersion = dateLoadVersionRef.current;
      refreshPromise
        .then((result) => {
          if (result.stale || dateLoadVersionRef.current !== refreshVersion) return;
          setSaveError(null);
          setAttendanceStatus({
            kind: 'ready',
            message: 'Latest attendance reloaded. Review and retry.',
          });
        })
        .catch((cause) => {
          if (dateLoadVersionRef.current !== refreshVersion) return;
          if (!isAbortError(cause) && !isUnauthorized(cause)) {
            const message = cause.message || 'Unable to reload attendance';
            setAttendanceStatus({ kind: 'error', message: `Attendance reload failed: ${message}` });
            setSaveError({ message, date: reloadDate, conflict: true, action: 'reload' });
          }
        });
      return;
    }
    persist(saveError.date, saveError.map).catch((cause) => {
      if (!isAbortError(cause) && !isUnauthorized(cause)) return;
    });
  }

  function saveProgressPatch(username, patch) {
    if (!progressQueuesRef.current.has(username)) {
      progressQueuesRef.current.set(
        username,
        createSerializedRequestQueue((nextPatch) =>
          client('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, ...nextPatch }),
          }),
        ),
      );
    }
    return progressQueuesRef.current
      .get(username)
      .enqueue(patch)
      .then((result) => {
        if (result.item) setProgress((current) => ({ ...current, [username]: result.item }));
        return result;
      });
  }

  async function logout() {
    try {
      await client('/api/teacher/logout', { method: 'POST' });
    } catch (_) {
      /* local session state still ends */
    }
    setTeacher(null);
    setStudents([]);
    attendanceRef.current = {};
    setAttendance({});
  }

  const filtered = students.filter((student) =>
    student.username.includes(query.trim().toLowerCase()),
  );
  const dates = [...new Set([...Object.keys(overview), date])].sort();
  const presentCount = students.filter((student) => attendance[student.username]).length;
  const attendanceSaving = Boolean(queuesRef.current.get(date)?.pendingCount);
  const attendanceBusy = attendanceSaving || attendanceDateLoading || Boolean(attendanceDateError);

  if (teacher === undefined) {
    return (
      <TeacherWorkspace
        title="Attendance & student records"
        description="Review attendance and maintain the assignment record for each student."
        activeSection="attendance"
      >
        <section className={styles.statusPanel} role="status" aria-live="polite">
          {error ? (
            <div role="alert">
              <p className={styles.error}>{error}</p>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setError('');
                  loadTeacherData();
                }}
              >
                Retry loading workspace
              </button>
            </div>
          ) : (
            <p className={styles.muted}>Checking teacher session…</p>
          )}
        </section>
      </TeacherWorkspace>
    );
  }

  if (teacher === null) {
    return (
      <TeacherWorkspace
        title="Attendance & student records"
        description="Review attendance and maintain the assignment record for each student."
        activeSection="attendance"
      >
        <section className={styles.panel} aria-labelledby="teacher-login-title">
          <p className={styles.sectionLabel}>Secure access</p>
          <h2 id="teacher-login-title">Teacher login</h2>
          <p className={styles.muted}>
            Sign in to view attendance and update student assignment records.
          </p>
          <TeacherLogin onSuccess={() => loadTeacherData()} />
        </section>
      </TeacherWorkspace>
    );
  }

  return (
    <TeacherWorkspace
      title="Attendance & student records"
      description="Review attendance and maintain the assignment record for each student."
      username={teacher}
      activeSection="attendance"
      actions={
        <button type="button" className={styles.secondaryButton} onClick={logout}>
          Logout
        </button>
      }
    >
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.stack}>
        <section className={styles.panel} aria-labelledby="active-attendance-day-title">
          <div className={styles.recordHeaderPlain}>
            <div>
              <p className={styles.sectionLabel}>Operational view</p>
              <h2 id="active-attendance-day-title">Active attendance day</h2>
              <p className={styles.muted}>
                Choose a date, narrow the visible roster, and apply attendance changes to the
                filtered students.
              </p>
            </div>
            <div>
              <p>
                <strong>
                  Present: {presentCount} of {students.length}
                </strong>
              </p>
              <p className={styles.statusLine} role="status" aria-live="polite">
                {attendanceDateLoading
                  ? `Loading attendance for ${date}…`
                  : attendanceDateError
                    ? `Attendance unavailable for ${date}: ${attendanceDateError}`
                    : attendanceStatus.message}
              </p>
            </div>
          </div>
          <div className={styles.controlGrid}>
            <label className={styles.field} htmlFor="attendance-date">
              Attendance date
              <input
                id="attendance-date"
                type="date"
                value={date}
                disabled={attendanceSaving || attendanceDateLoading}
                onChange={(event) => {
                  selectedDateRef.current = event.target.value;
                  selectedDateVersionRef.current += 1;
                  dateLoadVersionRef.current += 1;
                  setAttendanceDateLoading(true);
                  setAttendanceDateError('');
                  setError('');
                  setSaveError(null);
                  setImportDraft(null);
                  setAttendanceStatus({ kind: 'idle', message: 'Attendance ready.' });
                  verifiedAttendanceDateRef.current = null;
                  attendanceRef.current = {};
                  setAttendance({});
                  setDate(event.target.value);
                }}
              />
            </label>
            <label className={styles.field} htmlFor="attendance-search">
              Search username
              <input
                id="attendance-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={attendanceBusy}
                onClick={() =>
                  updateAttendance({
                    ...attendanceRef.current,
                    ...Object.fromEntries(filtered.map((student) => [student.username, true])),
                  })
                }
              >
                Mark visible students present
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={attendanceBusy}
                onClick={() =>
                  updateAttendance({
                    ...attendanceRef.current,
                    ...Object.fromEntries(filtered.map((student) => [student.username, false])),
                  })
                }
              >
                Mark visible students absent
              </button>
            </div>
          </div>
        </section>

        {saveError ? (
          <p className={styles.error} role="alert">
            {saveError.message}
            {saveError.action ? (
              <button type="button" className={styles.secondaryButton} onClick={retrySave}>
                {saveError.action === 'reload' ? 'Reload latest' : 'Retry'}
              </button>
            ) : null}
          </p>
        ) : null}

        <section className={styles.panel} aria-labelledby="visible-roster-title">
          <div className={styles.recordHeaderPlain}>
            <div>
              <p className={styles.sectionLabel}>Student roster</p>
              <h2 id="visible-roster-title">Visible students</h2>
            </div>
            <p className={styles.muted}>
              {filtered.length} of {students.length} students shown
            </p>
          </div>
          <ul className={styles.studentList} aria-label="Visible students">
            {filtered.map((student) => (
              <AttendanceStudentRow
                key={student.username}
                student={student}
                present={Boolean(attendance[student.username])}
                saving={attendanceBusy}
                progress={progress[student.username]}
                onToggle={(username, present) =>
                  updateAttendance({ ...attendanceRef.current, [username]: present })
                }
                onSaveProgress={saveProgressPatch}
              />
            ))}
          </ul>
        </section>

        <section className={styles.panel} aria-labelledby="attendance-actions-title">
          <div>
            <p className={styles.sectionLabel}>Data exchange</p>
            <h2 id="attendance-actions-title">Attendance CSV</h2>
            <p className={styles.muted}>
              Export the current date or import a reviewed CSV before confirming persistence.
            </p>
          </div>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={attendanceBusy || verifiedAttendanceDateRef.current !== date}
              onClick={() => {
                if (attendanceBusy || verifiedAttendanceDateRef.current !== date) return;
                const blob = new Blob(
                  [
                    serializeAttendanceCsv(
                      students.map((student) => ({
                        username: student.username,
                        present: Boolean(attendance[student.username]),
                        date,
                      })),
                    ),
                  ],
                  { type: 'text/csv;charset=utf-8' },
                );
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `attendance_${date}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </button>
            <label className={styles.secondaryButton}>
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                disabled={attendanceBusy}
                onChange={handleFile}
              />
            </label>
          </div>
        </section>

        <AttendanceImportPreview
          disabled={attendanceBusy}
          draft={importDraft}
          onCancel={() => setImportDraft(null)}
          onConfirm={confirmImport}
        />

        <section className={styles.panel} aria-labelledby="overall-attendance-title">
          <div>
            <p className={styles.sectionLabel}>Historical view</p>
            <h2 id="overall-attendance-title">Overall attendance</h2>
          </div>
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th scope="col" className="whitespace-nowrap px-3 py-3 text-left">
                    Username
                  </th>
                  {dates.map((item) => (
                    <th scope="col" key={item} className="whitespace-nowrap px-3 py-3 text-center">
                      {item}
                    </th>
                  ))}
                  <th scope="col" className="whitespace-nowrap px-3 py-3 text-center">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const total = dates.filter((item) => overview[item]?.[student.username]).length;
                  return (
                    <tr key={student.username}>
                      <th
                        scope="row"
                        className="whitespace-nowrap px-3 py-3 text-left font-semibold"
                      >
                        {student.username}
                      </th>
                      {dates.map((item) => (
                        <td key={item} className="whitespace-nowrap px-3 py-3 text-center">
                          {overview[item]?.[student.username] ? '✓' : '–'}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-3 py-3 text-center font-semibold">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </TeacherWorkspace>
  );
}
