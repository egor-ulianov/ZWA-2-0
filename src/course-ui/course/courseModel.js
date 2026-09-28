import { lessons } from '../../config/lessons.js';

export const COURSE_MODULES = Object.freeze(
  [
    {
      id: 'web-foundations',
      number: 1,
      title: 'Základy webu',
      color: 'coral',
    },
    {
      id: 'presentation-interaction',
      number: 2,
      title: 'Prezentace a interakce',
      color: 'sky',
    },
    {
      id: 'server-foundations',
      number: 3,
      title: 'Základy serveru',
      color: 'mint',
    },
    {
      id: 'state-data',
      number: 4,
      title: 'Stav a data',
      color: 'apricot',
    },
  ].map(Object.freeze),
);

export function getCourseModules(lessonList = lessons) {
  return COURSE_MODULES.map((module) => ({
    ...module,
    lessons: lessonList.filter((lesson) => lesson.moduleId === module.id),
  })).filter((module) => module.lessons.length > 0);
}
