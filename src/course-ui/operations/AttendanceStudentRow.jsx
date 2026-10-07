import ProgressEditor from './ProgressEditor.jsx';
import StudentRecord from './StudentRecord.jsx';
import styles from './operations.module.css';

export default function AttendanceStudentRow({ student, progress, onSaveProgress }) {
  return (
    <li>
      <StudentRecord
        firstName={student.firstName}
        lastName={student.lastName}
        parallel={student.parallel}
        username={student.username}
      >
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
