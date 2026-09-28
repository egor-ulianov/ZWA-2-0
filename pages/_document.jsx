import Document, { Html, Head, Main, NextScript } from 'next/document';

const themeBootstrap = `
(function () {
  var theme = 'light';
  try {
    var stored = window.localStorage.getItem('zwa-theme');
    if (stored === 'dark' || stored === 'light') theme = stored;
  } catch (_) {}
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
})();
`;

export default class MyDocument extends Document {
  render() {
    return (
      <Html data-theme="light" lang="cs" style={{ colorScheme: 'light' }}>
        <Head></Head>
        <body>
          <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
