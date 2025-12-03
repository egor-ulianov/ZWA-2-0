import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_10_sessions_cookies_presentation.jsx'), { ssr: false });

export default function InteractiveZwa10SessionsCookiesPage() {
  return <App />;
}






