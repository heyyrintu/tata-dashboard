import { Routes, Route } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import PowerBIDashboard from './pages/PowerBIDashboard';
import UploadPage from './pages/UploadPage';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/powerbi" element={<PowerBIDashboard />} />
      </Routes>
    </Layout>
  );
}

export default App;
