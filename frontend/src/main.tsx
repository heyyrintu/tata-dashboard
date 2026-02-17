import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { DashboardProvider } from './context/DashboardContext';
import { SnapshotProvider } from './context/SnapshotContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { client } from './lib/appwrite';

// Verify Appwrite SDK connection on startup
client.ping().catch((error) => {
  console.error('Appwrite connection failed:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DashboardProvider>
            <SnapshotProvider>
              <App />
            </SnapshotProvider>
          </DashboardProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
