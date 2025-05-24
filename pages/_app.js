import '../styles/globals.css';
import '../styles/tailwind.css';
import '../i18n';
import Providers from '../contexts/Providers';
import Head from 'next/head';

function App({ Component, pageProps }) {
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