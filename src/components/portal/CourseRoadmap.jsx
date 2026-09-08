import Link from 'next/link';

import { getCourseModule } from './courseMetadata.js';
import { portalClassNames } from './portalClasses.js';

function moduleGroups(lessons) {
  const groups = [];

  for (const lesson of lessons) {
    const metadata = getCourseModule(lesson);
    if (!metadata) continue;

    let group = groups.find((candidate) => candidate.module === metadata.module);
    if (!group) {
      group = { module: metadata.module, lessons: [] };
      groups.push(group);
    }
    group.lessons.push({ lesson, metadata });
  }

  return groups;
}

export default function CourseRoadmap({ lessons = [] }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="max-w-3xl">
        <p className={portalClassNames.kicker}>Course catalogue</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Course roadmap</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--portal-text-muted)] md:text-lg">
          A practical route through the foundations, interfaces, and server-side systems that make
          modern web applications work.
        </p>
      </div>

      <div className="mt-12 space-y-12">
        {moduleGroups(lessons).map((group, index) => (
          <section key={group.module} aria-labelledby={`course-module-${index}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--portal-border)] pb-3">
              <h2 id={`course-module-${index}`} className="text-xl font-semibold">
                {group.module}
              </h2>
              <p className="text-sm text-[var(--portal-text-muted)]">
                {group.lessons.length} {group.lessons.length === 1 ? 'lesson' : 'lessons'}
              </p>
            </div>

            <ol className="mt-4 grid gap-4 md:grid-cols-2">
              {group.lessons.map(({ lesson, metadata }) => (
                <li key={lesson.slug}>
                  <article className="portal-panel flex h-full flex-col gap-5 p-5 md:p-6">
                    <div className="flex items-start gap-4">
                      <span className="portal-kicker shrink-0 pt-1" aria-hidden="true">
                        {String(lesson.number).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold leading-7">{lesson.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--portal-text-muted)]">
                          {metadata.focus}
                        </p>
                      </div>
                    </div>
                    <Link
                      className={`${portalClassNames.action} mt-auto w-full sm:w-fit`}
                      href={lesson.href}
                      aria-label={`Open lesson ${lesson.number}: ${lesson.title}`}
                    >
                      Open lesson
                    </Link>
                  </article>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}

export { getCourseModule, moduleGroups };
