import fs from 'fs';
import path from 'path';

function parseCsvSemicolon(content) {
  const contentNoBom = content.replace(/^\uFEFF/, '');
  const lines = contentNoBom.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0]
    .split(';')
    .map((h, idx) => (idx === 0 ? h.replace(/^\uFEFF/, '') : h).trim());
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const rec = {};
    for (let j = 0; j < header.length; j++) {
      const key = header[j];
      const val = cols[j] ?? '';
      rec[key] = typeof val === 'string' ? val.trim() : val;
    }
    records.push(rec);
  }
  return records;
}

function filterMyStudents(records, teacherName) {
  const teacher = (teacherName || 'Ulianov, Egor').trim();
  const seenUsernames = new Set();
  const result = [];
  for (const r of records) {
    const exerciseTeachers = (r['parallelClass.exercise.teachers'] || '').trim();
    if (!exerciseTeachers.includes(teacher)) continue;
    const username = r['username'] || '';
    if (seenUsernames.has(username)) continue;
    seenUsernames.add(username);
    result.push({
      firstName: r['firstName'] || '',
      lastName: r['lastName'] || '',
      username,
      personalEid: r['personalEid'] || '',
      studyGroup: r['study.group.name'] || '',
      exerciseNumber: r['parallelClass.exercise.number'] || '',
      exerciseTeachers,
      lectureNumber: r['parallelClass.lecture.number'] || '',
      lectureTeachers: r['parallelClass.lecture.teachers'] || ''
    });
  }
  return result;
}

export default function handler(req, res) {
  try {
    const csvPath = path.join(process.cwd(), 'src', 'interactive-zwa-1', 'assets', 'Course_B251_B6B39ZWA.csv');
    const csv = fs.readFileSync(csvPath, 'utf8');
    const records = parseCsvSemicolon(csv);
    const teacher = typeof req.query.teacher === 'string' ? req.query.teacher : undefined;
    const students = filterMyStudents(records, teacher);
    res.status(200).json({ count: students.length, students });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load or parse CSV', details: String(e) });
  }
}


