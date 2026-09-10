import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NplDataProvider } from './context/NplDataContext';
import { client, BYPASS_AUTH } from './lib/appwrite';

// Verify Appwrite SDK connection on startup (skipped when auth is bypassed)
if (!BYPASS_AUTH) {
  client.ping().catch((error) => {
    console.error('Appwrite connection failed:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NplDataProvider>
            <App />
          </NplDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
