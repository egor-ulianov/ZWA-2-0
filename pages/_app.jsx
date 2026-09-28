import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import '@fontsource-variable/manrope';
import '../styles/globals.css';
import '../styles/course-ui.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
