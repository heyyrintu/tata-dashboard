import { Navigate } from 'react-router-dom';
import { useAuth, type Capabilities } from '../context/AuthContext';
import { IconLoader2, IconLock } from '@tabler/icons-react';
import { useTheme } from '../context/ThemeContext';

interface RequireCapabilityProps {
  /** Capability the signed-in user must hold, e.g. "upload". */
  capability: keyof Capabilities;
  children: React.ReactNode;
}

/**
 * Route guard.
 *
 * Presentation only: hiding a route stops an ordinary user stumbling into a
 * page they cannot use, it does not protect the endpoint behind it. The
 * matching server-side check is requireCapability('upload') in backend
 * routes/upload.ts, and that is the one that actually enforces anything.
 */
export default function RequireCapability({ capability, children }: RequireCapabilityProps) {
  const { user, isLoading, can } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#0a0e27] to-[#08101e]">
        <IconLoader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!can[capability]) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'light'
          ? 'bg-[#F1F1F1]'
          : 'bg-linear-to-b from-[#0a0e27] to-[#08101e]'
      }`}>
        <div className={`text-center p-8 rounded-2xl ${
          theme === 'light'
            ? 'bg-white border border-gray-200'
            : 'bg-[#0f1629]/80 border border-white/10'
        }`}>
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            theme === 'light'
              ? 'bg-red-100'
              : 'bg-red-500/20'
          }`}>
            <IconLock className={`w-8 h-8 ${
              theme === 'light' ? 'text-red-600' : 'text-red-400'
            }`} />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Access Denied
          </h2>
          <p className={`mb-4 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            You don't have permission to access this page.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
