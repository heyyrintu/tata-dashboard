import Header from '../components/Header';
import { FileUploadNew } from '../components/FileUploadNew';
import { useTheme } from '../context/ThemeContext';
import { BackgroundBeams } from '../components/ui/background-beams';
import { useNavigate } from 'react-router-dom';

export default function UploadPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleUploadSuccess = () => {
    // Navigate to dashboard after successful upload
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className={`min-h-screen relative ${
      theme === 'light'
        ? 'bg-[#F1F1F1]'
        : 'bg-gradient-to-b from-[#0a0e27] to-[#08101e]'
    }`}>
      {/* Background Beams Effect - Only for dark theme */}
      {theme === 'dark' && (
        <div className="absolute inset-0 overflow-hidden">
          <BackgroundBeams className="pointer-events-none" />
        </div>
      )}
      
      {/* Header */}
      <div className="relative z-50">
        <Header />
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <FileUploadNew onClose={handleUploadSuccess} />
        </div>
      </main>
    </div>
  );
}

