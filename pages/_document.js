// pages/_document.js

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* box-sizing: border-box on every element — this is the actual fix.
            Without it, any element combining width:100%/height:100% with
            padding (very common in fixed-position modal overlays throughout
            this app) gets sized LARGER than 100% because padding is added on
            top of the declared width instead of inside it. That overflow was
            invisible (it's a transparent overlay) but it shifted everything
            centered inside it — every popup/modal in the app — to the right
            by exactly the padding amount. border-box makes width/height
            include padding, which is what every browser default SHOULD do
            for layouts like this. */}
        <style>{`
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            max-width: 100vw;
            overflow-x: hidden;
            touch-action: pan-x pan-y;
            -ms-touch-action: pan-x pan-y;
          }
        `}</style>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />

        <link rel="manifest" href="/manifest.json" />

        <meta name="theme-color" content="#701890" />
        <meta name="msapplication-TileColor" content="#701890" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EntreProMarket" />

        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />

        <meta name="mobile-web-app-capable" content="yes" />

        <meta name="description" content="Entre PRO Market — Connecting vendors with event organizers" />
        <meta name="keywords" content="vendors, organizers, events, marketplace, entrepromarket" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Entre PRO Market" />
        <meta property="og:description" content="Connecting vendors with event organizers" />
        <meta property="og:image" content="/icons/icon-512x512.png" />
        <meta property="og:url" content="https://app.entrepromarket.com" />

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
