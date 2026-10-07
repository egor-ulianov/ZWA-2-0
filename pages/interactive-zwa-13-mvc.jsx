import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_13_mvc_presentation.jsx'), { ssr: false });

export default function InteractiveZwa13MvcPage() {
  return <App />;
}
