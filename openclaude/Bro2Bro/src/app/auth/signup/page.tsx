'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, AtSign } from 'lucide-react';
import { authApi } from '@/services/api';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.password) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      toast.error('Username must be 3-20 characters with only letters, numbers, and underscores');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await authApi.register({
        email: formData.email,
        username: formData.username,
        displayName: formData.displayName || formData.username,
        password: formData.password,
      });

      if (response.success) {
        toast.success('Account created! Please sign in.');
        router.push('/auth/login');
      } else {
        toast.error(response.error || 'Failed to create account');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-8">
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
          <p className="text-dark-muted">Create your account and start bro-ing!</p>
        </div>

        {/* Signup Form */}
        <div className="bg-dark-card rounded-2xl p-6 border border-dark-border">
          <h2 className="text-xl font-bold text-dark-text mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-dark-text placeholder-dark-muted focus:outline-none focus:border-bro-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="coolbro123"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-dark-text placeholder-dark-muted focus:outline-none focus:border-bro-500 transition-colors"
                  required
                />
              </div>
              <p className="text-xs text-dark-muted mt-1">3-20 characters, letters, numbers, underscores only</p>
            </div>

            {/* Display Name Field */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Display Name <span className="text-dark-muted">(optional)</span>
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="How you want to be called"
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-dark-text placeholder-dark-muted focus:outline-none focus:border-bro-500 transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
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
              <p className="text-xs text-dark-muted mt-1">At least 8 characters with uppercase, lowercase, number, and special character</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-10 pr-4 text-dark-text placeholder-dark-muted focus:outline-none focus:border-bro-500 transition-colors"
                  required
                />
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
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-sm text-dark-muted">or</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>

          {/* Google Signup */}
          <button
            onClick={() => window.location.href = '/api/auth/signin/google'}
            className="w-full bg-dark-bg border border-dark-border text-dark-text font-semibold py-3 rounded-xl hover:bg-dark-border transition-colors flex items-center justify-center gap-2"
          >
            <AtSign className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-dark-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-bro-400 hover:text-bro-300 font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
