import styles from './operations.module.css';

export const LECTURES = Array.from({ length: 13 }, (_, index) => index + 1);

function studentName(student) {
  return [student.firstName, student.lastName].filter(Boolean).join(' ') || student.username;
}

export default function LectureAttendanceMatrix({
  students,
  overview,
  disabledLectures,
  onToggle,
}) {
  return (
    <section aria-labelledby="lecture-attendance-title" className={styles.panel} role="region">
      <div className={styles.recordHeaderPlain}>
        <div>
          <p className={styles.sectionLabel}>Attendance</p>
          <h2 id="lecture-attendance-title">Attendance by lecture</h2>
          <p className={styles.muted}>Check each student for every completed lecture.</p>
        </div>
        <p className={styles.muted}>{students.length} students shown</p>
      </div>
      <div className={`${styles.tableScroll} ${styles.attendanceMatrixScroll}`}>
        <table className={styles.attendanceMatrix}>
          <thead>
            <tr>
              <th className={styles.studentColumn} scope="col">
                Student
              </th>
              {LECTURES.map((lecture) => (
                <th key={lecture} scope="col">
                  {lecture}
                </th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const name = studentName(student);
              const presentCount = LECTURES.filter(
                (lecture) => overview[lecture]?.[student.username],
              ).length;
              return (
                <tr key={student.username}>
                  <th className={styles.studentColumn} scope="row">
                    <strong>{name}</strong>
                    {name !== student.username ? <span>{student.username}</span> : null}
                    {student.parallel ? <span>Parallel {student.parallel}</span> : null}
                  </th>
                  {LECTURES.map((lecture) => (
                    <td key={lecture}>
                      <input
                        aria-label={`${name}, lecture ${lecture}`}
                        checked={Boolean(overview[lecture]?.[student.username])}
                        disabled={disabledLectures.has(lecture)}
                        onChange={(event) =>
                          onToggle({
                            lecture,
                            username: student.username,
                            present: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                    </td>
                  ))}
                  <td className={styles.attendanceTotal}>{presentCount} / 13</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
