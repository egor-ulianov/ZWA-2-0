import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_12_auth_presentation.jsx'), { ssr: false });

export default function InteractiveZwa12AuthPage() {
  return <App />;
}



