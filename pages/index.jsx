import React from 'react';
import Link from 'next/link';
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">ZWA Presentations</h1>
        <p className="text-zinc-600">Select a presentation:</p>
      </header>
      <ul className="space-y-3">
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-1-html5">
            1) ZWA‑1 (HTML5): HTML5 Presentation with Live Playground
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-2-forms">
            2) ZWA‑2 (Forms): Client-side Forms and HTML5 Inputs
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-1/">
            3) ZWA‑3 (Network): Web Presentation with Simulated Linux CLI
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-2">
            4) ZWA‑4: CSS Presentation with Live Playground
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-5-css-ii">
            5) ZWA‑5: CSS II – Layout, Responsivity, Print
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-5-js">
            6) ZWA‑6: JavaScript Basics with Live Playground
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-7">
            7) ZWA‑7: Classes and AJAX
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-8-php">
            8) ZWA‑8: PHP Basics – Malý test #2
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-9">
            9) ZWA‑9: Server-side Forms & CRUD
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-10-sessions-cookies">
            10) ZWA‑10: Session & Cookies in PHP
          </Link>
        </li>
        <li>
          <Link className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/interactive-zwa-11-files-json">
            11) ZWA‑11: Files & JSON in PHP
          </Link>
        </li>
        <li>
          <Link prefetch={false} className="block p-4 rounded-xl bg-white shadow border hover:bg-zinc-50" href="/attendance">
            Attendance (protected)
          </Link>
        </li>
      </ul>
      <Analytics />
    </main>
  );
}


