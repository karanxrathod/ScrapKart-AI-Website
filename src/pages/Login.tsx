import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { signInWithGoogle } from '../firebase';
import { motion } from 'motion/react';
import { Recycle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { setGuest, user, isGuest } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user || isGuest) {
      navigate('/dashboard');
    }
  }, [user, isGuest, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        // User intentionally closed the popup, no need to show an error
        setError('');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-[30px] max-w-md w-full text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="neu-convex p-4 rounded-full text-[var(--color-mint)]">
            <Recycle size={48} />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">ScrapKart AI</h1>
        <p className="text-[var(--color-navy)] opacity-70 mb-8">Smart waste management & recycling</p>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full neu-convex py-3 px-6 rounded-full font-semibold mb-4 hover:neu-pressed transition-all flex items-center justify-center gap-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 opacity-30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[var(--color-soft-white)] text-gray-500">Or</span>
          </div>
        </div>
        
        <button 
          onClick={() => setGuest(true)}
          className="w-full neu-flat py-3 px-6 rounded-full font-semibold hover:neu-pressed transition-all text-gray-600"
        >
          Continue as Guest
        </button>

        <button
          onClick={() => navigate('/signup')}
          className="w-full mt-3 text-sm font-semibold text-[var(--color-mint)] hover:opacity-80 transition-opacity"
        >
          New here? Create an account
        </button>
      </motion.div>
    </div>
  );
}
