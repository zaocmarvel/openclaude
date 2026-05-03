'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Fire, Filter, TrendingUp, Clock, MapPin } from 'lucide-react';
import { feedApi } from '@/services/api';
import { BroWithDetails } from '@/types';
import FeedCard from '@/components/feed/FeedCard';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

type FilterType = 'all' | 'trending' | 'recent' | 'nearby';

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [bros, setBros] = useState<BroWithDetails[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const loadFeed = useCallback(async (reset = false) => {
    setIsLoadingFeed(true);
    try {
      let response;
      if (filter === 'trending') {
        response = await feedApi.getTrending('24h');
      } else {
        response = await feedApi.getFeed({
          type: filter === 'nearby' ? undefined : filter,
          cursor: reset ? undefined : cursor,
        });
      }

      if (response.success && response.data) {
        const newBros = response.data.bros;
        setBros(prev => reset ? newBros : [...prev, ...newBros]);
        setHasMore(response.data.hasMore);
        setCursor(response.data.nextCursor);
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [filter, cursor]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFeed(true);
    }
  }, [filter, isAuthenticated]);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingFeed) {
      loadFeed();
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-dark-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black text-gradient flex items-center gap-2">
              <Fire className="w-6 h-6 text-orange-500" />
              Feed
            </h1>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'all', label: 'All', icon: Fire },
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'recent', label: 'Recent', icon: Clock },
              { id: 'nearby', label: 'Nearby', icon: MapPin },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilter(id as FilterType)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${filter === id
                    ? 'bg-bro-500 text-white'
                    : 'bg-dark-card text-dark-muted hover:text-dark-text'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {bros.map((bro, index) => (
          <motion.div
            key={bro.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <FeedCard bro={bro} />
          </motion.div>
        ))}

        {isLoadingFeed && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-dark-card rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoadingFeed && bros.length === 0 && (
          <div className="text-center py-12">
            <Fire className="w-16 h-16 text-dark-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-text mb-2">
              No bros yet
            </h3>
            <p className="text-dark-muted">
              Be the first to send a bro and start the trend!
            </p>
          </div>
        )}

        {hasMore && !isLoadingFeed && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 bg-dark-card rounded-xl text-bro-400 font-semibold hover:bg-dark-border transition-colors"
          >
            Load more
          </button>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
