import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Fix for the FOUC issue
                  const theme = localStorage.getItem('theme') || 'light';
                  let bg = '#ffffff'; /* light as default */
                  if (theme === 'dark') bg = '#111111';
                  if (theme === 'terminal') bg = '#000000';
                  document.documentElement.style.backgroundColor = bg;
                  document.documentElement.setAttribute('data-theme', theme);

                  // Update theme-color meta for mobile/PWA
                  const metaTheme = document.querySelector('meta[name="theme-color"]');
                  if (metaTheme) metaTheme.setAttribute('content', bg);
                } catch(e) {}
              })();
            `
          }}
        />

        {/* —-- Core PWA & theming —-- */}
        <meta name="application-name" content="Simple AI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="simple ai - chat" />
        <meta name="description" content="Best PWA App in the world" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FFFFFF" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
