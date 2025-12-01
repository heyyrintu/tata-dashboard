import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconMail, IconLock, IconUser, IconLoader2, IconArrowRight } from '@tabler/icons-react';
import { motion } from 'framer-motion';

const LOGO_URL = "https://cdn.dribbble.com/userupload/45564127/file/6c01b78a863edd968c45d2287bcd5854.png?resize=752x470&vertical=center";

export default function AuthPage() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.classList.add('light-theme');
    document.documentElement.classList.add('light-theme');

    return () => {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.remove('light-theme');
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex bg-linear-to-br from-[#fff7f4] via-[#ffe6bc] to-[#fde0d4]">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl bg-[#fde1c6]/70" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl bg-[#fcd0c9]/70" />
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-linear-to-bl from-[#ffe8c7]/70 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-linear-to-tr from-[#ffd3ca]/70 to-transparent rounded-full blur-[120px]" />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo Container */}
          <motion.div 
            className="mb-8 inline-block"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="backdrop-blur-xl p-6 rounded-3xl shadow-2xl bg-white/80 border border-[#fde7d4]">
              <img 
                src={LOGO_URL} 
                alt="Drona Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-[#DE1C1C] via-[#FE7129] to-[#FEA418]">
              DRONA
            </span>
            <span className="text-[#1a1a1a]"> Logitech</span>
          </h1>
          
          <p className="text-xl text-[#4f2520] mb-8 max-w-md">
            Intelligent fleet management and analytics platform for modern enterprises
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              'Real-time fleet tracking & monitoring',
              'Advanced analytics & reporting',
              'Secure role-based access control'
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-linear-to-r from-[#DE1C1C] to-[#FEA418]" />
                <span className="text-sm text-[#5b3328]">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center text-[#84584a] text-sm">
          2025 Drona Technologies. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block backdrop-blur-xl p-4 rounded-2xl mb-4 bg-white/90 border border-[#fde7d4] shadow-lg">
              <img 
                src={LOGO_URL} 
                alt="Drona Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-[#DE1C1C] to-[#FEA418]">
                DRONA
              </span>
              <span className="text-[#1f1f1f]"> Logitech</span>
            </h1>
          </div>

          {/* Auth Card */}
          <div className="backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden bg-white/95 border border-[#fde7d4]">
            {/* Card Header */}
            <div className="px-8 pt-8 pb-6 border-b border-[#fde0d4]">
              <h2 className="text-2xl font-bold mb-1 text-[#1a1a1a]">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-[#8a4b3c]">
                {isLogin ? 'Sign in to access your dashboard' : 'Get started with Drona Logitech'}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="px-8 pt-6">
              <div className="flex rounded-xl p-1 bg-[#fff3e0]">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isLogin
                      ? 'bg-linear-to-r from-[#DE1C1C] to-[#FEA418] text-white shadow-lg shadow-[#de1c1c]/20'
                      : 'text-[#a15a3f] hover:text-[#7c3c29]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    !isLogin
                      ? 'bg-linear-to-r from-[#DE1C1C] to-[#FEA418] text-white shadow-lg shadow-[#de1c1c]/20'
                      : 'text-[#a15a3f] hover:text-[#7c3c29]'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl text-sm flex items-center gap-2 bg-[#fde7e7] border border-[#f9b8b8] text-[#b42318]"
                >
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}

              {/* Name Field (Sign Up only) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium mb-2 text-[#5c2a1f]">
                    Full Name
                  </label>
                  <div className="relative group">
                    <IconUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#c08a7c] group-focus-within:text-[#DE1C1C]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required={!isLogin}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#f5cbb4] bg-white text-[#2a1a18] placeholder-[#c08a7c] focus:border-[#DE1C1C] focus:ring-2 focus:ring-[#DE1C1C]/20 focus:outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[#5c2a1f]">
                  Email Address
                </label>
                <div className="relative group">
                  <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#c08a7c] group-focus-within:text-[#DE1C1C]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#f5cbb4] bg-white text-[#2a1a18] placeholder-[#c08a7c] focus:border-[#DE1C1C] focus:ring-2 focus:ring-[#DE1C1C]/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[#5c2a1f]">
                  Password
                </label>
                <div className="relative group">
                  <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors text-[#c08a7c] group-focus-within:text-[#DE1C1C]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#f5cbb4] bg-white text-[#2a1a18] placeholder-[#c08a7c] focus:border-[#DE1C1C] focus:ring-2 focus:ring-[#DE1C1C]/20 focus:outline-none transition-all"
                  />
                </div>
                {!isLogin && (
                  <p className="mt-2 text-xs text-[#8a4b3c]">
                    Must be at least 8 characters
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 group ${
                  isSubmitting
                    ? 'bg-[#de1c1c]/60 cursor-not-allowed'
                    : 'bg-linear-to-r from-[#DE1C1C] via-[#f45c1c] to-[#FEA418] hover:from-[#c91010] hover:via-[#f24c0f] hover:to-[#fd9715] shadow-lg shadow-[#de1c1c]/20 hover:shadow-[#de1c1c]/35 hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#f5cbb4]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-[#8a4b3c]">
                    {isLogin ? "New to Drona Logitech?" : "Already have an account?"}
                  </span>
                </div>
              </div>

              {/* Toggle Link */}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full py-3 px-4 rounded-xl border border-[#f5cbb4] text-[#8a4b3c] hover:text-[#5c2a1f] hover:bg-[#fff3e0] hover:border-[#f2b98d] transition-all font-medium"
              >
                {isLogin ? 'Create a new account' : 'Sign in to existing account'}
              </button>
            </form>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#a15a3f]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
