'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { streakApi } from '@/services/api';

export default function StreakWidget() {
  const [streaks, setStreaks] = useState<{ activeStreaks: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreaks = async () => {
      try {
        const response = await streakApi.getStreaks('active');
        if (response.success && response.data) {
          setStreaks(response.data.stats);
        }
      } catch (error) {
        console.error('Failed to load streaks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStreaks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card rounded-full animate-pulse">
        <Flame className="w-4 h-4 text-dark-muted" />
        <span className="text-sm font-bold text-dark-muted">...</span>
      </div>
    );
  }

  const activeStreaks = streaks?.activeStreaks || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card rounded-full border border-dark-border"
    >
      <motion.div
        animate={activeStreaks > 0 ? {
          scale: [1, 1.2, 1],
        } : {}}
        transition={{ duration: 1, repeat: activeStreaks > 0 ? Infinity : 0, repeatDelay: 2 }}
      >
        <Flame className={`
          w-4 h-4
          ${activeStreaks > 0 ? 'text-orange-500 fill-orange-500' : 'text-dark-muted'}
        `} />
      </motion.div>
      <span className={`
        text-sm font-bold
        ${activeStreaks > 0 ? 'text-orange-400' : 'text-dark-muted'}
      `}>
        {activeStreaks} Streak{activeStreaks !== 1 ? 's' : ''}
      </span>
    </motion.div>
  );
}
