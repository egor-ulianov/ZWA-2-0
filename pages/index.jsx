import React from 'react';

import { lessons } from '../src/config/lessons.js';
import { CourseOverview } from '../src/course-ui/course/CourseOverview.jsx';

export default function Home() {
  return <CourseOverview lessons={lessons} />;
}
