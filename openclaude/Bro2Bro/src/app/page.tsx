'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import BroButton from '@/components/bro/BroButton';
import BroTypeSelector from '@/components/bro/BroTypeSelector';
import UserSuggestions from '@/components/bro/UserSuggestions';
import StreakWidget from '@/components/bro/StreakWidget';
import FeedPreview from '@/components/feed/FeedPreview';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { BroType } from '@/types';
import { useState } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<BroType>('RESPECT');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20 bg-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-dark-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-black text-gradient">Bro2Bro</h1>
          <StreakWidget />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero Section with Big Bro Button */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 py-4"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BroButton broType={selectedType} />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-dark-text">
              Send a Bro
            </h2>
            <p className="text-sm text-dark-muted">
              Tap the button to send an instant bro
            </p>
          </div>
        </motion.section>

        {/* Bro Type Selector */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <BroTypeSelector selected={selectedType} onSelect={setSelectedType} />
        </motion.section>

        {/* Quick Suggestions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-card rounded-2xl p-4 border border-dark-border"
        >
          <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
            <span className="text-bro-400">🎯</span>
            Who to Bro?
          </h3>
          <UserSuggestions limit={3} />
        </motion.section>

        {/* Feed Preview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-card rounded-2xl p-4 border border-dark-border"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
              <span className="text-bro-400">🔥</span>
              Trending Bros
            </h3>
            <button
              onClick={() => router.push('/feed')}
              className="text-xs text-bro-400 hover:text-bro-300 transition-colors"
            >
              View All
            </button>
          </div>
          <FeedPreview limit={3} />
        </motion.section>

        {/* Nearby Bros */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-dark-card rounded-2xl p-4 border border-dark-border"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
              <span className="text-bro-400">📍</span>
              Nearby Bros
            </h3>
            <button
              onClick={() => router.push('/nearby')}
              className="text-xs text-bro-400 hover:text-bro-300 transition-colors"
            >
              View Map
            </button>
          </div>
          <p className="text-sm text-dark-muted text-center py-4">
            Enable location to find bros nearby
          </p>
        </motion.section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
