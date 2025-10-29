import { Routes, Route } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import PowerBIDashboard from './pages/PowerBIDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainDashboard />} />
      <Route path="/powerbi" element={<PowerBIDashboard />} />
    </Routes>
  );
}

export default App;
