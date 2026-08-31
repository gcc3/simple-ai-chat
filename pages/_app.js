import '../styles/globals.css';
import '../styles/tailwind.css';
import '../i18n';
import Head from 'next/head';
import { useEffect } from 'react';

function App({ Component, pageProps }) {
  useEffect(() => {
    // Prevent pinch-to-zoom on mobile devices
    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventZoom, { passive: false });

    // Unmont
    return () => document.removeEventListener('touchmove', preventZoom);
  }, []);
  
  return (
    <>
      <Head>
        {/* `maximum-scale=1` is what stops iOS Safari from zooming the whole page in when a form
            field smaller than 16px gets focus; `user-scalable=no` matches the pinch-to-zoom
            prevention done in the touchmove handler above. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      
      <Component {...pageProps} />
    </>
  );
}

export default App;
