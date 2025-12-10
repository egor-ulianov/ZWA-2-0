import React from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../interactive_zwa_11_files_json_presentation.jsx'), { ssr: false });

export default function InteractiveZwa11FilesJsonPage() {
  return <App />;
}





