import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Recycle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import { useAuth } from '../AuthContext';

export default function Signup() {
  const { user, isGuest } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user || isGuest) {
      navigate('/dashboard');
    }
  }, [user, isGuest, navigate]);

  const handleGoogleSignup = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('');
      } else {
        setError('Failed to create your account. Please try again.');
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
            <Sparkles size={48} />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Create your ScrapKart AI account</h1>
        <p className="text-[var(--color-navy)] opacity-70 mb-8">
          Join the platform to scan scrap, see pricing, and schedule pickups with ease.
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleGoogleSignup}
          className="w-full neu-convex py-3 px-6 rounded-full font-semibold mb-4 hover:neu-pressed transition-all flex items-center justify-center gap-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign up with Google
        </button>

        <button
          onClick={() => navigate('/login')}
          className="w-full neu-flat py-3 px-6 rounded-full font-semibold hover:neu-pressed transition-all text-gray-600 flex items-center justify-center gap-2"
        >
          <Recycle size={18} />
          Already have an account? Login
        </button>
      </motion.div>
    </div>
  );
}
