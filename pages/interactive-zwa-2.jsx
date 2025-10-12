import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_2_css_presentation.jsx'), { ssr: false });

export default function InteractiveZwa2Page() {
  return <App />;
}



