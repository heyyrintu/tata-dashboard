import { Routes, Route } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import PowerBIDashboard from './pages/PowerBIDashboard';
import UploadPage from './pages/UploadPage';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<MainDashboard />} />
                <Route
                  path="/upload"
                  element={
                    <AdminRoute>
                      <UploadPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/powerbi"
                  element={
                    <AdminRoute>
                      <PowerBIDashboard />
                    </AdminRoute>
                  }
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
