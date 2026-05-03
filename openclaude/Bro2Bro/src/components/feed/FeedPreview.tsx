'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { feedApi } from '@/services/api';
import { Bro } from '@/types';

interface FeedPreviewProps {
  limit?: number;
}

const typeColors: Record<string, string> = {
  AGGRESSIVE: 'text-red-400 bg-red-500/10',
  FUNNY: 'text-yellow-400 bg-yellow-500/10',
  COLD: 'text-cyan-400 bg-cyan-500/10',
  HEARTBREAK: 'text-purple-400 bg-purple-500/10',
  RESPECT: 'text-green-400 bg-green-500/10',
};

const typeEmojis: Record<string, string> = {
  AGGRESSIVE: '',
  FUNNY: '',
  COLD: '',
  HEARTBREAK: '',
  RESPECT: '',
};

export default function FeedPreview({ limit = 3 }: FeedPreviewProps) {
  const [bros, setBros] = useState<Bro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const response = await feedApi.getTrending('24h');
        if (response.success && response.data) {
          const data = response.data as { bros: Bro[] };
          setBros(data.bros.slice(0, limit));
        }
      } catch (error) {
        console.error('Failed to load feed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-dark-bg animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-dark-border" />
              <div className="flex-1 h-4 bg-dark-border rounded w-1/3" />
            </div>
            <div className="h-16 bg-dark-border rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (bros.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-dark-muted">
          No trending bros yet. Be the first to make history!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bros.map((bro, index) => (
        <motion.div
          key={bro.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-bro-500/30 transition-colors"
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {bro.sender?.image ? (
              <img
                src={bro.sender.image}
                alt={bro.sender.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-dark-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-bro flex items-center justify-center ring-2 ring-dark-border">
                <span className="text-white font-bold text-sm">
                  {bro.sender?.username[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-dark-text text-sm">
                  {bro.sender?.displayName || bro.sender?.username}
                </span>
                <span className="text-xs text-dark-muted">
                  bro'd
                </span>
                <span className="font-semibold text-bro-400 text-sm truncate">
                  {bro.receiver?.displayName || bro.receiver?.username}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`
                  inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
                  ${typeColors[bro.type]}
                `}>
                  {typeEmojis[bro.type]}
                  {bro.type.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          {bro.message && (
            <p className="text-sm text-dark-text mb-3 whitespace-pre-wrap">
              {bro.message}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-dark-muted">
            <button className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-xs font-medium">{bro.reactionCount || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-bro-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">React</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-green-400 transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-medium">Share</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
