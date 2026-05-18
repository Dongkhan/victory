import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import BrowserNotice from './components/BrowserNotice.jsx';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// window.dhtalk 은 Electron preload 가 주입한다. 일반 브라우저로 열면 없다.
if (window.dhtalk) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  root.render(<BrowserNotice />);
}
