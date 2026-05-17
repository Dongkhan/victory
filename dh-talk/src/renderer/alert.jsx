import React from 'react';
import ReactDOM from 'react-dom/client';
import AlertPulse from './components/AlertPulse.jsx';
import './alert.css';

ReactDOM.createRoot(document.getElementById('alert-root')).render(
  <React.StrictMode>
    <AlertPulse />
  </React.StrictMode>,
);
