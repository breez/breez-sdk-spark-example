import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initWasm } from './services/wasmLoader';

async function init() {
  try {
    // Initialize WASM module
    await initWasm();

    // Render the app
    ReactDOM.createRoot(document.getElementById('root')!).render(

      <App />

    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('root')!.innerHTML = `
      <div style="color: red; padding: 20px; text-align: center;">
        <h2>Failed to load application</h2>
        <p>There was an error initializing the wallet. Please refresh and try again.</p>
      </div>
    `;
  }
}

init();
