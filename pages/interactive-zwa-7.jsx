import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_7_classes_ajax_presentation.jsx'), { ssr: false });

export default function InteractiveZwa7Page() {
  return <App />;
}



