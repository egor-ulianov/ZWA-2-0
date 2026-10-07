import React from 'react';
import {
  createAttendanceSnapshotOptions,
  createSerializedRequestQueue,
  isAbortError,
  isUnauthorized,
  request,
} from '../../lib/apiClient.js';
import {
  MAX_CSV_INPUT_BYTES,
  parseAttendanceCsv,
  parseTeacherRosterCsv,
  serializeAttendanceCsv,
} from '../../lib/csv.js';
import AttendanceImportPreview from './AttendanceImportPreview.jsx';
import AttendanceStudentRow from './AttendanceStudentRow.jsx';
import LectureAttendanceMatrix, { LECTURES } from './LectureAttendanceMatrix.jsx';
import TeacherWorkspace, { TeacherLogin } from './TeacherWorkspace.jsx';
import styles from './operations.module.css';

export default function AttendanceWorkspace() {
  const [teacher, setTeacher] = React.useState(undefined);
  const [students, setStudents] = React.useState([]);
  const [overview, setOverview] = React.useState({});
  const [revisions, setRevisions] = React.useState({});
  const [progress, setProgress] = React.useState({});
  const [query, setQuery] = React.useState('');
  const [parallel, setParallel] = React.useState('all');
  const [error, setError] = React.useState('');
  const [attendanceStatus, setAttendanceStatus] = React.useState('Attendance ready.');
  const [savingLectures, setSavingLectures] = React.useState(new Set());
  const [blockedLectures, setBlockedLectures] = React.useState(new Set());
  const [failedSaves, setFailedSaves] = React.useState({});
  const [importDraft, setImportDraft] = React.useState(null);
  const [importError, setImportError] = React.useState('');
  const [rosterDraft, setRosterDraft] = React.useState(null);
  const [rosterStatus, setRosterStatus] = React.useState('');
  const [rosterBusy, setRosterBusy] = React.useState(false);
  const overviewRef = React.useRef({});
  const revisionsRef = React.useRef({});
  const confirmedRef = React.useRef({});
  const queuesRef = React.useRef(new Map());
  const saveVersionsRef = React.useRef(new Map());
  const progressQueuesRef = React.useRef(new Map());
  const fileReaderRef = React.useRef(null);

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

  const applyOverview = React.useCallback((nextOverview, nextRevisions = {}) => {
    const safeOverview = Object.fromEntries(
      Object.entries(nextOverview || {}).map(([lecture, map]) => [lecture, { ...(map || {}) }]),
    );
    const safeRevisions = Object.fromEntries(
      Object.entries(nextRevisions || {}).map(([lecture, revision]) => [lecture, Number(revision)]),
    );
    overviewRef.current = safeOverview;
    confirmedRef.current = safeOverview;
    revisionsRef.current = safeRevisions;
    setOverview(safeOverview);
    setRevisions(safeRevisions);
    setBlockedLectures(new Set());
    setFailedSaves({});
  }, []);

  const applyLecture = React.useCallback((lecture, map, revision) => {
    const snapshot = { ...(map || {}) };
    overviewRef.current = { ...overviewRef.current, [lecture]: snapshot };
    confirmedRef.current = { ...confirmedRef.current, [lecture]: snapshot };
    revisionsRef.current = { ...revisionsRef.current, [lecture]: Number(revision) || 0 };
    setOverview(overviewRef.current);
    setRevisions(revisionsRef.current);
  }, []);

  const loadTeacherData = React.useCallback(
    async (signal) => {
      setError('');
      setTeacher(undefined);
      try {
        const me = await client('/api/teacher/me', { signal });
        const [studentData, attendanceData, progressData] = await Promise.all([
          client('/api/students', { signal }),
          client('/api/attendance', { signal }),
          client('/api/progress', { signal }),
        ]);
        setStudents(studentData.students || []);
        applyOverview(attendanceData.overview || {}, attendanceData.revisions || {});
        setProgress(
          Object.fromEntries((progressData.items || []).map((item) => [item.username, item])),
        );
        setTeacher(me.username || 'teacher');
      } catch (cause) {
        if (isAbortError(cause) || isUnauthorized(cause)) return;
        setError(cause.message || 'Unable to load teacher data');
      }
    },
    [applyOverview, client],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => loadTeacherData(controller.signal));
    return () => controller.abort();
  }, [loadTeacherData]);

  function setLectureSaving(lecture, saving) {
    setSavingLectures((current) => {
      const next = new Set(current);
      if (saving) next.add(lecture);
      else next.delete(lecture);
      return next;
    });
  }

  function setLectureBlocked(lecture, blocked) {
    setBlockedLectures((current) => {
      const next = new Set(current);
      if (blocked) next.add(lecture);
      else next.delete(lecture);
      return next;
    });
  }

  function clearFailedSave(lecture) {
    setFailedSaves((current) => {
      if (!current[lecture]) return current;
      const next = { ...current };
      delete next[lecture];
      return next;
    });
  }

  function recordFailedSave(failure) {
    setFailedSaves((current) => ({ ...current, [failure.lecture]: failure }));
  }

  function restoreConfirmedLecture(lecture) {
    overviewRef.current = {
      ...overviewRef.current,
      [lecture]: { ...(confirmedRef.current[lecture] || {}) },
    };
    setOverview(overviewRef.current);
  }

  async function reloadLecture(lecture) {
    const result = await client(`/api/attendance?lecture=${lecture}`);
    applyLecture(lecture, result.map, result.revision);
    return result;
  }

  function queueForLecture(lecture) {
    if (!queuesRef.current.has(lecture)) {
      queuesRef.current.set(
        lecture,
        createSerializedRequestQueue(({ map }) =>
          client(
            '/api/attendance',
            createAttendanceSnapshotOptions({
              lecture,
              map,
              revision: Number(revisionsRef.current[lecture] || 0),
            }),
          ).then((result) => {
            revisionsRef.current = {
              ...revisionsRef.current,
              [lecture]: Number(result.revision),
            };
            setRevisions(revisionsRef.current);
            return result;
          }),
        ),
      );
    }
    return queuesRef.current.get(lecture);
  }

  function persistLecture(lecture, nextMap, retryPatch = nextMap) {
    const snapshot = { ...nextMap };
    const patch = { ...retryPatch };
    const version = (saveVersionsRef.current.get(lecture) || 0) + 1;
    saveVersionsRef.current.set(lecture, version);
    clearFailedSave(lecture);
    setLectureSaving(lecture, true);
    setAttendanceStatus(`Saving lecture ${lecture}…`);
    return queueForLecture(lecture)
      .enqueue({ map: snapshot })
      .then(() => {
        confirmedRef.current = { ...confirmedRef.current, [lecture]: snapshot };
        overviewRef.current = { ...overviewRef.current, [lecture]: snapshot };
        setOverview(overviewRef.current);
        if (saveVersionsRef.current.get(lecture) === version) {
          clearFailedSave(lecture);
          setLectureBlocked(lecture, false);
          setAttendanceStatus(`Lecture ${lecture} saved.`);
        }
      })
      .catch(async (cause) => {
        if (isAbortError(cause) || isUnauthorized(cause)) throw cause;
        queueForLecture(lecture).clearPending(cause);
        if (saveVersionsRef.current.get(lecture) !== version) throw cause;
        if (cause.status === 409) {
          try {
            await reloadLecture(lecture);
            setLectureBlocked(lecture, false);
            setAttendanceStatus(`Lecture ${lecture} changed on the server.`);
            recordFailedSave({
              lecture,
              patch,
              needsReload: false,
              message: `Lecture ${lecture} changed on the server. Latest values were reloaded.`,
            });
          } catch (reloadError) {
            restoreConfirmedLecture(lecture);
            setLectureBlocked(lecture, true);
            setAttendanceStatus(`Unable to reload lecture ${lecture}.`);
            recordFailedSave({
              lecture,
              patch,
              needsReload: true,
              message: reloadError.message || `Unable to reload lecture ${lecture}`,
            });
          }
        } else {
          restoreConfirmedLecture(lecture);
          setAttendanceStatus(`Lecture ${lecture} was not saved.`);
          recordFailedSave({
            lecture,
            patch,
            needsReload: false,
            message: cause.message || `Unable to save lecture ${lecture}`,
          });
        }
        throw cause;
      })
      .finally(() => {
        if (saveVersionsRef.current.get(lecture) === version) {
          setLectureSaving(lecture, false);
        }
      });
  }

  function updateAttendance({ lecture, username, present }) {
    const nextMap = { ...(overviewRef.current[lecture] || {}), [username]: present };
    overviewRef.current = { ...overviewRef.current, [lecture]: nextMap };
    setOverview(overviewRef.current);
    persistLecture(lecture, nextMap, { [username]: present }).catch(() => undefined);
  }

  async function retryAttendanceSave(lecture) {
    const failure = failedSaves[lecture];
    if (!failure) return;
    if (failure.needsReload) {
      setLectureSaving(lecture, true);
      setAttendanceStatus(`Reloading lecture ${lecture}…`);
      try {
        await reloadLecture(lecture);
        setLectureBlocked(lecture, false);
      } catch (cause) {
        restoreConfirmedLecture(lecture);
        setAttendanceStatus(`Unable to reload lecture ${lecture}.`);
        recordFailedSave({
          ...failure,
          message: cause.message || `Unable to reload lecture ${lecture}`,
        });
        setLectureSaving(lecture, false);
        return;
      }
    }
    const nextMap = { ...(overviewRef.current[lecture] || {}), ...failure.patch };
    overviewRef.current = { ...overviewRef.current, [lecture]: nextMap };
    setOverview(overviewRef.current);
    persistLecture(lecture, nextMap, failure.patch).catch(() => undefined);
  }

  function handleAttendanceFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    function showImportError(message) {
      setImportDraft(null);
      setImportError(message);
    }
    if (fileReaderRef.current) {
      showImportError('A CSV file is already being read.');
      return;
    }
    if (typeof file.size === 'number' && file.size > MAX_CSV_INPUT_BYTES) {
      showImportError(`CSV file exceeds the maximum size of ${MAX_CSV_INPUT_BYTES} bytes.`);
      return;
    }
    const reader = new FileReader();
    fileReaderRef.current = reader;
    const finishReading = () => {
      if (fileReaderRef.current === reader) fileReaderRef.current = null;
    };
    reader.onload = () => {
      try {
        setImportDraft(
          parseAttendanceCsv(String(reader.result || ''), {
            knownUsernames: new Set(students.map((student) => student.username)),
          }),
        );
        setImportError('');
      } catch (cause) {
        showImportError(cause.message || 'Unable to parse CSV');
      } finally {
        finishReading();
      }
    };
    reader.onerror = () => {
      finishReading();
      showImportError(reader.error?.message || 'Unable to read CSV file');
    };
    reader.onabort = () => {
      finishReading();
      showImportError('CSV file reading was cancelled.');
    };
    try {
      reader.readAsText(file);
    } catch (cause) {
      finishReading();
      showImportError(cause.message || 'Unable to read CSV file');
    }
  }

  async function confirmImport() {
    if (!importDraft?.entries.length) return;
    const grouped = new Map();
    for (const entry of importDraft.entries) {
      if (!grouped.has(entry.lecture)) grouped.set(entry.lecture, []);
      grouped.get(entry.lecture).push(entry);
    }
    setImportError('');
    try {
      await Promise.all(
        [...grouped.entries()].map(([lecture, entries]) => {
          const nextMap = { ...(overviewRef.current[lecture] || {}) };
          const patch = {};
          for (const entry of entries) {
            nextMap[entry.username] = entry.present;
            patch[entry.username] = entry.present;
          }
          overviewRef.current = { ...overviewRef.current, [lecture]: nextMap };
          setOverview(overviewRef.current);
          return persistLecture(lecture, nextMap, patch);
        }),
      );
      setImportDraft(null);
    } catch (cause) {
      if (!isAbortError(cause) && !isUnauthorized(cause)) {
        setImportError(cause.message || 'Unable to persist CSV import');
      }
    }
  }

  function handleRosterFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (fileReaderRef.current) {
      setRosterStatus('A CSV file is already being read.');
      return;
    }
    if (typeof file.size === 'number' && file.size > MAX_CSV_INPUT_BYTES) {
      setRosterDraft(null);
      setRosterStatus(`CSV file exceeds the maximum size of ${MAX_CSV_INPUT_BYTES} bytes.`);
      return;
    }
    const reader = new FileReader();
    fileReaderRef.current = reader;
    const finishReading = () => {
      if (fileReaderRef.current === reader) fileReaderRef.current = null;
    };
    reader.onload = () => {
      try {
        const csv = String(reader.result || '');
        setRosterDraft({ csv, ...parseTeacherRosterCsv(csv) });
        setRosterStatus('');
      } catch (cause) {
        setRosterDraft(null);
        setRosterStatus(cause.message || 'Unable to parse roster CSV');
      } finally {
        finishReading();
      }
    };
    reader.onerror = () => {
      finishReading();
      setRosterDraft(null);
      setRosterStatus(reader.error?.message || 'Unable to read roster CSV');
    };
    reader.onabort = () => {
      finishReading();
      setRosterDraft(null);
      setRosterStatus('Roster CSV reading was cancelled.');
    };
    reader.readAsText(file);
  }

  async function confirmRosterImport() {
    const hasErrors = rosterDraft?.diagnostics.some(({ severity }) => severity === 'error');
    if (!rosterDraft?.students.length || hasErrors || rosterBusy) return;
    setRosterBusy(true);
    setRosterStatus('Replacing active roster…');
    try {
      const result = await client('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: rosterDraft.csv }),
      });
      setStudents(result.students || []);
      setQuery('');
      setParallel('all');
      setRosterDraft(null);
      setRosterStatus(`Active roster replaced with ${result.count || 0} students.`);
    } catch (cause) {
      if (!isUnauthorized(cause)) {
        setRosterStatus(cause.message || 'Unable to replace the active roster');
      }
    } finally {
      setRosterBusy(false);
    }
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
      /* local session still ends */
    }
    setTeacher(null);
    setStudents([]);
    applyOverview({}, {});
  }

  const normalizedQuery = query.trim().toLocaleLowerCase('cs');
  const parallels = [...new Set(students.map((student) => student.parallel).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, undefined, { numeric: true }),
  );
  const filtered = students.filter((student) => {
    const searchable = [
      student.firstName,
      student.lastName,
      `${student.firstName || ''} ${student.lastName || ''}`,
      student.username,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('cs');
    return (
      (!normalizedQuery || searchable.includes(normalizedQuery)) &&
      (parallel === 'all' || student.parallel === parallel)
    );
  });
  const disabledLectures = new Set([...savingLectures, ...blockedLectures]);
  const attendanceBusy = disabledLectures.size > 0;
  const failedSaveEntries = Object.values(failedSaves).sort(
    (left, right) => left.lecture - right.lecture,
  );

  if (teacher === undefined) {
    return (
      <TeacherWorkspace
        activeSection="attendance"
        description="Review attendance and maintain the assignment record for each student."
        title="Attendance & student records"
      >
        <section className={styles.statusPanel} role="status" aria-live="polite">
          {error ? (
            <div role="alert">
              <p className={styles.error}>{error}</p>
              <button
                className={styles.secondaryButton}
                onClick={() => loadTeacherData()}
                type="button"
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
        activeSection="attendance"
        description="Review attendance and maintain the assignment record for each student."
        title="Attendance & student records"
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
      actions={
        <button className={styles.secondaryButton} onClick={logout} type="button">
          Logout
        </button>
      }
      activeSection="attendance"
      description="Review attendance and maintain the assignment record for each student."
      title="Attendance & student records"
      username={teacher}
    >
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.stack}>
        <section className={styles.panel} aria-labelledby="attendance-filters-title">
          <div className={styles.recordHeaderPlain}>
            <div>
              <p className={styles.sectionLabel}>Roster view</p>
              <h2 id="attendance-filters-title">Find students</h2>
            </div>
            <p className={styles.statusLine} role="status" aria-live="polite">
              {attendanceStatus}
            </p>
          </div>
          <div className={styles.filterGrid}>
            <label className={styles.field} htmlFor="attendance-search">
              Search name or username
              <input
                id="attendance-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className={styles.field} htmlFor="attendance-parallel">
              Parallel
              <select
                id="attendance-parallel"
                value={parallel}
                onChange={(event) => setParallel(event.target.value)}
              >
                <option value="all">All parallels</option>
                {parallels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {failedSaveEntries.map((failure) => (
            <p className={styles.error} key={failure.lecture} role="alert">
              {failure.message}{' '}
              <button
                className={styles.secondaryButton}
                onClick={() => retryAttendanceSave(failure.lecture)}
                type="button"
              >
                {failure.needsReload ? 'Reload and retry' : 'Retry'} lecture {failure.lecture}
              </button>
            </p>
          ))}
        </section>

        <LectureAttendanceMatrix
          disabledLectures={disabledLectures}
          onToggle={updateAttendance}
          overview={overview}
          students={filtered}
        />

        <section className={styles.panel} aria-labelledby="roster-import-title">
          <div className={styles.recordHeaderPlain}>
            <div>
              <p className={styles.sectionLabel}>Student roster</p>
              <h2 id="roster-import-title">Replace active roster</h2>
              <p className={styles.muted}>Upload the course CSV to replace the active roster.</p>
            </div>
            <label className={styles.secondaryButton}>
              Upload roster CSV
              <input
                aria-label="Student roster CSV"
                accept=".csv,text/csv"
                className="sr-only"
                disabled={rosterBusy}
                onChange={handleRosterFile}
                type="file"
              />
            </label>
          </div>
          {rosterStatus ? (
            <p className={styles.statusLine} role="status" aria-live="polite">
              {rosterStatus}
            </p>
          ) : null}
          {rosterDraft ? (
            <section
              aria-labelledby="roster-import-preview-title"
              className={styles.importPreview}
              role="region"
            >
              <div>
                <p className={styles.sectionLabel}>Review before replacement</p>
                <h3 id="roster-import-preview-title">Roster import preview</h3>
                <p className={styles.muted}>
                  {rosterDraft.students.length} students · Parallels:{' '}
                  {[...new Set(rosterDraft.students.map((student) => student.parallel))]
                    .filter(Boolean)
                    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
                    .join(', ') || 'none'}
                </p>
              </div>
              {rosterDraft.diagnostics.length ? (
                <ul className={styles.diagnosticList}>
                  {rosterDraft.diagnostics.map((diagnostic, index) => (
                    <li key={`${diagnostic.line}-${index}`}>
                      Line {diagnostic.line}: {diagnostic.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className={styles.buttonRow}>
                <button
                  className={styles.primaryButton}
                  disabled={
                    rosterBusy ||
                    !rosterDraft.students.length ||
                    rosterDraft.diagnostics.some(({ severity }) => severity === 'error')
                  }
                  onClick={confirmRosterImport}
                  type="button"
                >
                  Replace active roster
                </button>
                <button
                  className={styles.secondaryButton}
                  disabled={rosterBusy}
                  onClick={() => setRosterDraft(null)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : null}
        </section>

        <section className={styles.panel} aria-labelledby="attendance-actions-title">
          <div className={styles.recordHeaderPlain}>
            <div>
              <p className={styles.sectionLabel}>Data exchange</p>
              <h2 id="attendance-actions-title">Attendance CSV</h2>
              <p className={styles.muted}>Export or import attendance by lecture number.</p>
            </div>
            <div className={styles.buttonRow}>
              <button
                className={styles.primaryButton}
                disabled={attendanceBusy}
                onClick={() => {
                  const rows = students.flatMap((student) =>
                    LECTURES.map((lecture) => ({
                      username: student.username,
                      present: Boolean(overview[lecture]?.[student.username]),
                      lecture,
                    })),
                  );
                  const blob = new Blob([serializeAttendanceCsv(rows)], {
                    type: 'text/csv;charset=utf-8',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'attendance_by_lecture.csv';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                type="button"
              >
                Export CSV
              </button>
              <label className={styles.secondaryButton}>
                Import CSV
                <input
                  accept=".csv,text/csv"
                  className="sr-only"
                  disabled={attendanceBusy}
                  onChange={handleAttendanceFile}
                  type="file"
                />
              </label>
            </div>
          </div>
          {importError ? (
            <p className={styles.error} role="alert">
              {importError}
            </p>
          ) : null}
        </section>

        <AttendanceImportPreview
          disabled={attendanceBusy}
          draft={importDraft}
          onCancel={() => setImportDraft(null)}
          onConfirm={confirmImport}
        />

        <section className={styles.panel} aria-labelledby="student-records-title">
          <div className={styles.recordHeaderPlain}>
            <div>
              <p className={styles.sectionLabel}>Assignments</p>
              <h2 id="student-records-title">Student records</h2>
            </div>
            <p className={styles.muted}>
              {filtered.length} of {students.length} students shown
            </p>
          </div>
          <ul className={styles.studentList} aria-label="Student records">
            {filtered.map((student) => (
              <AttendanceStudentRow
                key={student.username}
                onSaveProgress={saveProgressPatch}
                progress={progress[student.username]}
                student={student}
              />
            ))}
          </ul>
        </section>
      </div>
    </TeacherWorkspace>
  );
}
