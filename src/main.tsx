import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  document.body.innerHTML = `
    <div style="min-height: 100vh; background: #f9fafb; display: flex; align-items: center; justify-content: center; padding: 1rem; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: white; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); padding: 2rem; max-width: 42rem; width: 100%;">
        <h1 style="font-size: 1.5rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">Application Error</h1>
        <p style="color: #374151; margin-bottom: 1rem;">The application failed to start. Please check the browser console for details.</p>
        <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.875rem;">${error}</pre>
      </div>
    </div>
  `;
}
