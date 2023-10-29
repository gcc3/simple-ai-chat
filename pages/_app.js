import '../styles/globals.css';
import '../styles/tailwind.css';
import { Provider } from 'react-redux';
import store from '../store';

function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default App;
