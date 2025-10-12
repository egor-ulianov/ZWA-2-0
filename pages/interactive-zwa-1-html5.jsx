import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_1_html5_presentation.jsx'), { ssr: false });

export default function InteractiveZwa1Html5Page() {
  return <App />;
}


