/**
 * React Entry Point
 * Wraps the app in StrictMode for development warnings.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { registerSW } from 'virtual:pwa-register';
import { captureInstallPrompt } from './lib/pwa';

// Initialize early PWA prompt listener
captureInstallPrompt();

// Register service worker for offline support and PWA installation
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    console.log('[PWA] Service Worker registered:', swUrl, r);
  },
  onRegisterError(error) {
    console.error('[PWA] Service Worker registration failed:', error);
  },
});

import ErrorBoundary from './components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
