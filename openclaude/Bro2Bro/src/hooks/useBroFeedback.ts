import { useState, useCallback } from 'react';
import { playSound } from '@/lib/utils';
import { BroType } from '@/types';

interface BroFeedback {
  showAnimation: boolean;
  animationType: 'success' | 'streak' | 'milestone' | null;
  message: string;
}

export function useBroFeedback(soundEnabled: boolean = true) {
  const [feedback, setFeedback] = useState<BroFeedback>({
    showAnimation: false,
    animationType: null,
    message: '',
  });

  const triggerFeedback = useCallback((
    type: BroType,
    streakCount?: number,
    isNewStreak?: boolean
  ) => {
    // Play sound
    playSound(type.toLowerCase(), soundEnabled);

    // Determine animation type
    let animationType: 'success' | 'streak' | 'milestone' = 'success';
    let message = getDefaultMessage(type);

    if (streakCount) {
      if (isNewStreak) {
        animationType = 'milestone';
        message = `New streak started! 🔥`;
      } else if (streakCount >= 7) {
        animationType = 'streak';
        message = `${streakCount} day streak! Keep it going! 🔥`;
      } else {
        animationType = 'streak';
        message = `${streakCount} day streak!`;
      }
    }

    setFeedback({
      showAnimation: true,
      animationType,
      message,
    });

    // Hide after animation
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, showAnimation: false }));
    }, 2000);
  }, [soundEnabled]);

  const hideFeedback = useCallback(() => {
    setFeedback(prev => ({ ...prev, showAnimation: false }));
  }, []);

  return { feedback, triggerFeedback, hideFeedback };
}

function getDefaultMessage(type: BroType): string {
  const messages: Record<BroType, string> = {
    AGGRESSIVE: 'Aggressive Bro sent! 💪',
    FUNNY: 'Funny Bro sent! 😂',
    COLD: 'Cold Bro sent! 🧊',
    HEARTBREAK: 'Heartbreak Bro sent... 💔',
    RESPECT: 'Respect Bro sent! 👊',
  };
  return messages[type];
}

export function useHapticFeedback() {
  const trigger = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' = 'medium') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const patterns: Record<string, number[]> = {
        light: [50],
        medium: [100],
        heavy: [200],
        success: [50, 100, 50],
      };
      navigator.vibrate(patterns[type] || patterns.medium);
    }
  }, []);

  return { trigger };
}

export function useConfetti() {
  const [showConfetti, setShowConfetti] = useState(false);

  const trigger = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  return { showConfetti, trigger };
}
