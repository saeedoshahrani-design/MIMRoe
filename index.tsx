import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { initFirebase } from './firebase.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';

const processQueue = () => console.log("Processing offline queue...");

async function main() {
  console.log("[Startup] 1. main() called.");
  
  console.log("[Startup] 2. Initializing Firebase...");
  await initFirebase({ enableDebug: true });
  console.log("[Startup] 3. Firebase initialized successfully.");

  window.addEventListener('online', () => {
      console.info("[Connection] Back online. Flushing offline operation queue...");
      processQueue();
  });
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element with id='root' to mount the application to.");
  }
  console.log("[Startup] 4. Found root element.");

  console.log("[Startup] 5. Creating React root...");
  const root = ReactDOM.createRoot(rootElement);
  console.log("[Startup] 6. React root created.");

  console.log("[Startup] 7. Rendering React App...");
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("[Startup] 8. React render initiated.");
}

main().catch(error => {
  console.error("[Startup] A critical error occurred:", error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    let errorDetails = 'No further details could be extracted from the error.';
    try {
      if (error instanceof Error) {
        errorDetails = `Message: ${error.message}\n\nStack Trace:\n${error.stack}`;
      } else {
        errorDetails = `Raw Error: ${JSON.stringify(error, null, 2)}`;
      }
    } catch (e) {
      errorDetails = 'The error object could not be serialized.';
    }

    // Escape HTML to prevent injection issues with the error message
    const escapeHtml = (unsafe: string) => {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif; background-color: #fff8f8; color: #4a5567; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="color: #c53030; font-size: 1.5rem; margin-bottom: 1rem;">Application Failed to Load</h1>
        <p>An unexpected error occurred. Please check the developer console for more details and try refreshing the page.</p>
        <pre style="margin-top: 1.5rem; padding: 1rem; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 0.25rem; text-align: left; max-width: 800px; overflow: auto; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(errorDetails)}</pre>
      </div>
    `;
  }
});