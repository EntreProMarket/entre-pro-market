// pages/_document.js

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Global reset — browsers apply a default 8px margin to <body> unless
            this is zeroed out. Without it, any full-width element (like the
            purple footer) shows a small gap from the true screen edges.

            touch-action: pan-x pan-y — this is the real lock against native
            browser pinch-zoom/double-tap-zoom. The old `user-scalable=no` /
            `maximum-scale=1` viewport meta directives below are IGNORED by
            modern Chrome on Android for accessibility reasons, so without this
            CSS a stray pinch gesture anywhere on the page (e.g. near an image)
            zooms/pans the whole browser viewport — including fixed elements
            like the header logo — and it doesn't reset until the user manually
            zooms back out. touch-action blocks that at the browser level while
            still allowing normal scroll/pan, and does not interfere with the
            ZoomableLightbox's own JS-driven pinch-zoom (that runs inside a
            fixed full-screen overlay with its own touch handling). */}
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            touch-action: pan-x pan-y;
            -ms-touch-action: pan-x pan-y;
          }
        `}</style>
        {/* Viewport — kept as a first line of defense / hint for browsers that do
            still honor it, but touch-action above is what actually enforces this. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color */}
        <meta name="theme-color" content="#701890" />
        <meta name="msapplication-TileColor" content="#701890" />

        {/* iOS PWA support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EntreProMarket" />

        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />

        {/* Splash screens for iOS */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* SEO */}
        <meta name="description" content="Entre PRO Market — Connecting vendors with event organizers" />
        <meta name="keywords" content="vendors, organizers, events, marketplace, entrepromarket" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Entre PRO Market" />
        <meta property="og:description" content="Connecting vendors with event organizers" />
        <meta property="og:image" content="/icons/icon-512x512.png" />
        <meta property="og:url" content="https://app.entrepromarket.com" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Entre PRO Market" />
        <meta name="twitter:description" content="Connecting vendors with event organizers" />
        <meta name="twitter:image" content="/icons/icon-512x512.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
