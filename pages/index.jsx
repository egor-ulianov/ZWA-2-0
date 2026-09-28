import React from 'react';
import Link from 'next/link';

import CourseRoadmap from '../src/components/portal/CourseRoadmap.jsx';
import { CourseApplication } from '../src/course-ui/foundation/CourseApplication.jsx';
import { CourseMasthead } from '../src/course-ui/foundation/CourseMasthead.jsx';
import { lessons } from '../src/config/lessons.js';

export default function Home() {
  return (
    <CourseApplication title="Katalog kurzu" variant="catalog">
      <CourseMasthead contextLabel="Katalog kurzu" />
      <CourseRoadmap lessons={lessons} />
      <footer className="mx-auto flex w-full max-w-6xl justify-end px-4 pb-10 md:px-8">
        <Link
          className="text-sm font-semibold text-[var(--portal-indigo)] underline decoration-[var(--portal-focus)] underline-offset-4"
          href="/attendance"
          prefetch={false}
        >
          Attendance (protected)
        </Link>
      </footer>
    </CourseApplication>
  );
}
