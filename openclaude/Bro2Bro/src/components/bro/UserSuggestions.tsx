'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Zap, Clock, MapPin, Flame } from 'lucide-react';
import { suggestionsApi } from '@/services/api';
import { BroSuggestion } from '@/types';

interface UserSuggestionsProps {
  limit?: number;
}

export default function UserSuggestions({ limit = 5 }: UserSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<BroSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await suggestionsApi.getSuggestions(false, limit);
        if (response.success && response.data) {
          const data = response.data as { suggestions: BroSuggestion[] };
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg animate-pulse">
            <div className="w-10 h-10 rounded-full bg-dark-border" />
            <div className="flex-1 h-4 bg-dark-border rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-dark-muted">
          No suggestions yet. Start sending bros to build connections!
        </p>
      </div>
    );
  }

  const getReasonIcon = (type: string) => {
    switch (type) {
      case 'interaction_frequency': return <Zap className="w-3 h-3" />;
      case 'recency': return <Clock className="w-3 h-3" />;
      case 'mutual_streak': return <Flame className="w-3 h-3" />;
      case 'location': return <MapPin className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-2">
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={suggestion.user.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg hover:bg-dark-border transition-colors cursor-pointer"
        >
          {/* Avatar */}
          <div className="relative">
            {suggestion.user.image ? (
              <img
                src={suggestion.user.image}
                alt={suggestion.user.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-dark-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-bro flex items-center justify-center ring-2 ring-dark-border">
                <span className="text-white font-bold text-sm">
                  {suggestion.user.username[0].toUpperCase()}
                </span>
              </div>
            )}
            {suggestion.rank <= 3 && (
              <div className={`
                absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
                ${suggestion.rank === 1 ? 'bg-yellow-500 text-black' :
                  suggestion.rank === 2 ? 'bg-gray-400 text-black' :
                  'bg-orange-600 text-white'}
              `}>
                {suggestion.rank}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-dark-text truncate">
              {suggestion.user.displayName || suggestion.user.username}
            </h4>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {suggestion.reasons.slice(0, 2).map((reason, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] text-dark-muted bg-dark-card px-1.5 py-0.5 rounded"
                >
                  {getReasonIcon(reason.type)}
                  {reason.description}
                </span>
              ))}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold text-bro-400">
              {Math.round(suggestion.confidence * 100)}%
            </span>
            <button
              className="px-3 py-1 bg-bro-500 text-white text-xs font-semibold rounded-full hover:bg-bro-600 transition-colors"
            >
              Bro
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
