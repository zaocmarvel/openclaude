'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AtSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Welcome back!');
        router.push('/');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      toast.error('Google login failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-4xl font-black text-gradient mb-2"
          >
            Bro2Bro
          </motion.h1>
          <p className="text-dark-muted">Send A Bro. One tap. Instant connection.</p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border">
          <h2 className="text-xl font-bold text-dark-text mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-dark-text placeholder-dark-muted focus:outline-none focus:border-bro-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-12 text-dark-text placeholder-dark-muted focus:outline-none focus:border-bro-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-bro text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-sm text-dark-muted">or</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-dark-bg border border-dark-border text-dark-text font-semibold py-3 rounded-xl hover:bg-dark-border transition-colors flex items-center justify-center gap-2"
          >
            <AtSign className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-dark-muted">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-bro-400 hover:text-bro-300 font-semibold">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
