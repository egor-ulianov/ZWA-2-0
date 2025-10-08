import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../interactive_zwa_1_web_presentation_with_simulated_linux_cli.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

