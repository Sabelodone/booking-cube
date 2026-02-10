import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // make sure this includes Tailwind

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

