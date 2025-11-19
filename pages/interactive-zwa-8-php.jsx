import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_8_php_presentation.jsx'), { ssr: false });

export default function InteractiveZwa8PhpPage() {
  return <App />;
}





