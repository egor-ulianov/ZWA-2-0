import ProgressEditor from './ProgressEditor.jsx';
import StudentRecord from './StudentRecord.jsx';
import styles from './operations.module.css';

export default function AttendanceStudentRow({
  student,
  present,
  saving,
  progress,
  onToggle,
  onSaveProgress,
}) {
  const inputId = `attendance-${student.username}`;
  const control = (
    <label className={styles.checkControl} htmlFor={inputId}>
      <input
        checked={present}
        disabled={saving}
        id={inputId}
        onChange={(event) => onToggle(student.username, event.target.checked)}
        type="checkbox"
      />
      Present
    </label>
  );

  return (
    <li>
      <StudentRecord control={control} username={student.username}>
        <details className={styles.disclosure}>
          <summary>Assignment progress</summary>
          <ProgressEditor
            onSavePatch={onSaveProgress}
            username={student.username}
            value={progress}
          />
        </details>
      </StudentRecord>
    </li>
  );
}
