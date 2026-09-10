import { Routes, Route, Navigate } from 'react-router-dom';
import Overview from './pages/Overview';
import Deliveries from './pages/Deliveries';
import Throughput from './pages/Throughput';
import Network from './pages/Network';
import Carriers from './pages/Carriers';
import ShipmentsPage from './pages/ShipmentsPage';
import DataQuality from './pages/DataQuality';
import UploadPage from './pages/UploadPage';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RequireCapability from './components/RequireCapability';
import ErrorBoundary from './components/ErrorBoundary';
import { BYPASS_AUTH } from './lib/appwrite';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/auth" element={BYPASS_AUTH ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/deliveries" element={<Deliveries />} />
                  <Route path="/throughput" element={<Throughput />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/carriers" element={<Carriers />} />
                  <Route path="/shipments" element={<ShipmentsPage />} />
                  <Route path="/data-quality" element={<DataQuality />} />
                  <Route
                    path="/upload"
                    element={
                      <RequireCapability capability="upload">
                        <UploadPage />
                      </RequireCapability>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
