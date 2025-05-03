import '../styles/globals.css';
import '../styles/tailwind.css';
import '../i18n';
import Providers from '../contexts/Providers';

function App({ Component, pageProps }) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}

export default App;