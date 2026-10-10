import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/Hub';
import './styles.css';
import './app/layout.css';
import './games/balatro/ui/styles.css';
import './games/balatro/ui/cards.css';
import './games/balatro/ui/shop.css';
import './app/adventure.css';
import './games/battlegrounds/ui/styles.css';
import './games/spire/ui/styles.css';
import './shared/art/FeatureArt.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
