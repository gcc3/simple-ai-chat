import '../styles/globals.css';
import '../styles/tailwind.css';
import '../i18n';
import Providers from '../contexts/Providers';
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
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
      </Head>
      
      <Providers>
        <Component {...pageProps} />
      </Providers>
    </>
  );
}

export default App;
