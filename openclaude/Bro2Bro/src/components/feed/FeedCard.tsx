'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { BroWithDetails, ReactionType } from '@/types';
import { broApi } from '@/services/api';
import toast from 'react-hot-toast';

interface FeedCardProps {
  bro: BroWithDetails;
}

const typeColors: Record<string, { gradient: string; text: string }> = {
  AGGRESSIVE: { gradient: 'from-red-500 to-red-600', text: 'text-red-400' },
  FUNNY: { gradient: 'from-yellow-500 to-orange-500', text: 'text-yellow-400' },
  COLD: { gradient: 'from-cyan-500 to-blue-500', text: 'text-cyan-400' },
  HEARTBREAK: { gradient: 'from-purple-500 to-pink-500', text: 'text-purple-400' },
  RESPECT: { gradient: 'from-green-500 to-emerald-500', text: 'text-green-400' },
};

const typeEmojis: Record<string, string> = {
  AGGRESSIVE: '',
  FUNNY: '',
  COLD: '',
  HEARTBREAK: '',
  RESPECT: '',
};

const reactionEmojis: Record<ReactionType, string> = {
  BRO_BACK: '👊',
  LAUGH: '😂',
  IGNORE: '😶',
};

export default function FeedCard({ bro }: FeedCardProps) {
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    bro.userReaction?.type || null
  );
  const [reactionCount, setReactionCount] = useState(bro.reactionCount);
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = async (type: ReactionType) => {
    try {
      if (userReaction === type) {
        // Remove reaction
        await broApi.removeReaction(bro.id);
        setUserReaction(null);
        setReactionCount(prev => prev - 1);
      } else {
        // Add reaction
        const response = await broApi.reactToBro(bro.id, type);
        if (response.success) {
          setUserReaction(type);
          if (!userReaction) {
            setReactionCount(prev => prev + 1);
          }
          toast.success(`Reacted with ${reactionEmojis[type]}`);
        }
      }
    } catch (error) {
      toast.error('Failed to react');
    }
    setShowReactions(false);
  };

  const colors = typeColors[bro.type] || typeColors.RESPECT;

  return (
    <motion.div
      layout
      className="bg-dark-card rounded-2xl p-4 border border-dark-border overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Sender Avatar */}
        <div className="relative">
          {bro.sender?.image ? (
            <img
              src={bro.sender.image}
              alt={bro.sender.username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-dark-border"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center ring-2 ring-dark-border`}>
              <span className="text-white font-bold text-lg">
                {bro.sender?.username[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info & Type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-dark-text">
              {bro.sender?.displayName || bro.sender?.username}
            </span>
            <span className="text-dark-muted">
              bro'd
            </span>
            <span className="font-bold text-bro-400">
              {bro.receiver?.displayName || bro.receiver?.username}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={`
              inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full
              bg-gradient-to-r ${colors.gradient} text-white shadow-lg
            `}>
              <span>{typeEmojis[bro.type]}</span>
              {bro.type}
            </span>
            <span className="text-xs text-dark-muted">
              {formatRelativeTime(bro.createdAt)}
            </span>
          </div>
        </div>

        {/* Trending Badge */}
        {bro.trendingRank && bro.trendingRank <= 10 && (
          <div className={`
            px-2 py-1 rounded-full text-xs font-bold
            ${bro.trendingRank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-bro-500/20 text-bro-400'}
          `}>
            #{bro.trendingRank}
          </div>
        )}
      </div>

      {/* Message */}
      {bro.message && (
        <div className="mb-4 pl-[60px]">
          <p className="text-dark-text whitespace-pre-wrap text-lg">{bro.message}</p>
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex items-center gap-6 pl-[60px]">
        {/* Reactions */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className={`
              flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-full
              ${userReaction ? 'text-bro-400 bg-bro-500/10' : 'text-dark-muted hover:text-dark-text hover:bg-dark-border'}
            `}
          >
            <Heart className={`w-5 h-5 ${userReaction ? 'fill-current' : ''}`} />
            <span>{reactionCount || 'React'}</span>
          </button>

          {/* Reaction Picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute bottom-full left-0 mb-2 bg-dark-card border border-dark-border rounded-xl p-2 shadow-xl z-10"
              >
                <div className="flex items-center gap-1">
                  {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      className={`
                        p-2 rounded-lg text-2xl hover:scale-125 transition-transform
                        ${userReaction === type ? 'bg-bro-500/20' : 'hover:bg-dark-border'}
                      `}
                    >
                      {reactionEmojis[type]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comments */}
        <button className="flex items-center gap-2 text-sm text-dark-muted hover:text-bro-400 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>

        {/* Share */}
        <button className="flex items-center gap-2 text-sm text-dark-muted hover:text-green-400 transition-colors">
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>

        {/* Views */}
        <div className="flex items-center gap-1 text-sm text-dark-muted ml-auto">
          <Eye className="w-4 h-4" />
          <span>{bro.engagementMetrics?.viewCount || bro.reactionCount * 10}</span>
        </div>
      </div>
    </motion.div>
  );
}
