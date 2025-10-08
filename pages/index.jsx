import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">ZWA Presentations</h1>
        <p className="text-zinc-600">Select a presentation:</p>
      </header>
      <ul className="space-y-3">
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-1/">
            Interactive ZWA‑1: Web Presentation with Simulated Linux CLI
          </Link>
        </li>
      </ul>
    </main>
  );
}


