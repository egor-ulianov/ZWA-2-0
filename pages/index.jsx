import React from 'react';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { lessons } from '../src/config/lessons.js';

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">ZWA Presentations</h1>
        <p className="text-zinc-600">Select a presentation:</p>
      </header>
      <ul className="space-y-3">
        {lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50"
              href={lesson.href}
            >
              {lesson.number}) {lesson.title}
            </Link>
          </li>
        ))}
        <li>
          <Link
            prefetch={false}
            className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50"
            href="/attendance"
          >
            Attendance (protected)
          </Link>
        </li>
      </ul>
      <Analytics />
    </main>
  );
}
