'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BroType } from '@/types';

interface BroButtonProps {
  broType?: BroType;
  onSend?: () => void;
  isSending?: boolean;
}

export default function BroButton({ broType = 'RESPECT', onSend, isSending = false }: BroButtonProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  const typeColors: Record<BroType, string> = {
    AGGRESSIVE: 'bg-gradient-aggressive shadow-aggressive',
    FUNNY: 'bg-gradient-funny shadow-funny',
    COLD: 'bg-gradient-cold shadow-cold',
    HEARTBREAK: 'bg-gradient-heartbreak shadow-heartbreak',
    RESPECT: 'bg-gradient-respect shadow-respect',
  };

  const typeEmojis: Record<BroType, string> = {
    AGGRESSIVE: '',
    FUNNY: '',
    COLD: '',
    HEARTBREAK: '',
    RESPECT: '',
  };

  const handleClick = () => {
    setIsPulsing(true);
    onSend?.();
    setTimeout(() => setIsPulsing(false), 500);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Ripple Effect Ring */}
      <AnimatePresence>
        {isPulsing && (
          <>
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`absolute inset-0 rounded-full ${typeColors[broType]}`}
              style={{ width: 180, height: 180, top: -10, left: -10 }}
            />
            <motion.div
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              className={`absolute inset-0 rounded-full ${typeColors[broType]}`}
              style={{ width: 180, height: 180, top: -10, left: -10 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={handleClick}
        disabled={isSending}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isPulsing ? { scale: [1, 1.1, 1] } : {}}
        className={`
          relative w-40 h-40 rounded-full font-black text-3xl text-white
          transition-all duration-200 overflow-hidden
          ${typeColors[broType]}
          ${isPulsing ? 'animate-pulse' : ''}
          ${isSending ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
          hover:shadow-2xl
        `}
        style={{
          boxShadow: `0 0 30px rgba(var(--tw-shadow-color), 0.5)`,
        }}
      >
        {/* Inner Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />

        {/* Glow Animation */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 30px rgba(255,255,255,0.3)',
              '0 0 50px rgba(255,255,255,0.5)',
              '0 0 30px rgba(255,255,255,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Button Content */}
        <span className="relative z-10 flex flex-col items-center gap-1">
          <span className="text-4xl">{typeEmojis[broType]}</span>
          <span className="text-sm uppercase tracking-wider drop-shadow-lg">
            {isSending ? 'Sending...' : 'BRO'}
          </span>
        </span>
      </motion.button>

      {/* Sparkle Effects */}
      <AnimatePresence>
        {isPulsing && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  scale: 0,
                  opacity: 1,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 100,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 100,
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{ top: '50%', left: '50%' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
