import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/Hub';
import './styles.css';
import './adventure.css';
import './hearth.css';
import './spire.css';
import './shared/art/FeatureArt.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
