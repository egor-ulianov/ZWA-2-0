import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <script src="https://cdn.tailwindcss.com"></script>
        </Head>
        <body className="min-h-screen bg-gradient-to-br from-zinc-50 to-sky-50 text-zinc-900">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}


