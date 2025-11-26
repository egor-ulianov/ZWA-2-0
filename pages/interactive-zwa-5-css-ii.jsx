import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_5_css2_presentation.jsx'), { ssr: false });

export default function InteractiveZwa5CssIiPage() {
  return <App />;
}









