import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx'), { ssr: false });

export default function InteractiveZwa1Page() {
  return <App />;
}


