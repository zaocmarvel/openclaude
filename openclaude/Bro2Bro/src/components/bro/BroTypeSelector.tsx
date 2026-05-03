'use client';

import { motion } from 'framer-motion';
import { BroType } from '@/types';

interface BroTypeSelectorProps {
  selected: BroType;
  onSelect: (type: BroType) => void;
}

const types: { type: BroType; emoji: string; label: string; color: string }[] = [
  { type: 'AGGRESSIVE', emoji: '', label: 'Aggressive', color: 'bg-red-500' },
  { type: 'FUNNY', emoji: '', label: 'Funny', color: 'bg-yellow-500' },
  { type: 'COLD', emoji: '', label: 'Cold', color: 'bg-cyan-500' },
  { type: 'HEARTBREAK', emoji: '', label: 'Heartbreak', color: 'bg-purple-500' },
  { type: 'RESPECT', emoji: '', label: 'Respect', color: 'bg-green-500' },
];

export default function BroTypeSelector({ selected, onSelect }: BroTypeSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {types.map(({ type, emoji, label, color }) => (
        <motion.button
          key={type}
          onClick={() => onSelect(type)}
          whileTap={{ scale: 0.95 }}
          className={`
            flex flex-col items-center gap-2 p-3 rounded-xl transition-all
            ${selected === type
              ? 'bg-dark-border ring-2 ring-bro-500 scale-105'
              : 'bg-dark-bg hover:bg-dark-border'
            }
          `}
        >
          <motion.div
            animate={selected === type ? {
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0],
            } : {}}
            transition={{ duration: 0.5 }}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-2xl
              ${color} bg-opacity-20
              ${selected === type ? 'ring-2 ring-white' : ''}
            `}
          >
            {emoji}
          </motion.div>
          <span className={`
            text-xs font-medium transition-colors
            ${selected === type ? 'text-bro-400' : 'text-dark-muted'}
          `}>
            {label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
