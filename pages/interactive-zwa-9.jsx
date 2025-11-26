import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_9_forms_crud_presentation.jsx'), { ssr: false });

export default function InteractiveZwa9Page() {
  return <App />;
}



