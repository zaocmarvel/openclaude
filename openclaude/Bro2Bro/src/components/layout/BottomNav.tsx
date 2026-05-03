'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Trophy, Users, User, Bell } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Trophy, label: 'Feed', href: '/feed' },
  { icon: Users, label: 'Nearby', href: '/nearby' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState(0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="max-w-lg mx-auto">
        <div className="glass border-t border-dark-border">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center gap-1 px-4 py-2"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-bro-500/20 rounded-xl"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isActive ? 'text-bro-400' : 'text-dark-muted'
                      }`}
                    />
                  </motion.div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isActive ? 'text-bro-400' : 'text-dark-muted'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Notification Badge */}
                  {item.label === 'Notifications' && notifications > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    >
                      {notifications > 9 ? '9+' : notifications}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
