import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_2_forms_presentation.jsx'), { ssr: false });

export default function InteractiveZwa2FormsPage() {
  return <App />;
}


