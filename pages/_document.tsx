import React from 'react';
import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta
            name="description"
            content="Collect authenticated GitHub repository inventory data and turn it into a concise AI summary."
          />
          <meta property="og:site_name" content="github-sigint-priv" />
          <meta
            property="og:description"
            content="Collect authenticated GitHub repository inventory data and turn it into a concise AI summary."
          />
          <meta property="og:title" content="github-sigint-priv" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="github-sigint-priv" />
          <meta
            name="twitter:description"
            content="Authenticated GitHub repo inventory collection with AI summarization."
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
