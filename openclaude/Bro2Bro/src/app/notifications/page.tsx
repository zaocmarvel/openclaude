'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Zap, Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { notificationApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/layout/BottomNav';
import { Notification } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const typeIcons: Record<string, typeof Bell> = {
  NEW_BRO: Zap,
  BRO_REACTION: MessageSquare,
  STREAK_UPDATE: Zap,
  STREAK_BROKEN: AlertTriangle,
  GUESS_RESULT: Bell,
  BRO_REVEALED: Bell,
  TRENDING_BRO: Zap,
  SYSTEM: Bell,
};

const typeColors: Record<string, string> = {
  NEW_BRO: 'text-bro-400 bg-bro-500/10',
  BRO_REACTION: 'text-green-400 bg-green-500/10',
  STREAK_UPDATE: 'text-orange-400 bg-orange-500/10',
  STREAK_BROKEN: 'text-red-400 bg-red-500/10',
  GUESS_RESULT: 'text-purple-400 bg-purple-500/10',
  BRO_REVEALED: 'text-yellow-400 bg-yellow-500/10',
  TRENDING_BRO: 'text-pink-400 bg-pink-500/10',
  SYSTEM: 'text-gray-400 bg-gray-500/10',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, page]);

  const loadNotifications = async () => {
    setIsLoadingData(true);
    try {
      const response = await notificationApi.getNotifications({ page, limit: 20 });
      if (response.success && response.data) {
        const data = response.data as { notifications: Notification[]; unreadCount: number; pagination: { hasMore: boolean } };
        setNotifications(prev => page === 1 ? data.notifications : [...prev, ...data.notifications]);
        setUnreadCount(data.unreadCount);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleMarkAsRead = async (notificationIds?: string[]) => {
    try {
      const response = await notificationApi.markAsRead(notificationIds, !notificationIds);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => notificationIds && !notificationIds.includes(n.id) ? n : { ...n, isRead: true })
        );
        setUnreadCount(0);
        toast.success('Marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (notificationIds?: string[]) => {
    try {
      const response = await notificationApi.deleteNotifications(notificationIds, !notificationIds);
      if (response.success) {
        if (!notificationIds) {
          setNotifications(prev => prev.filter(n => !n.isRead));
        } else {
          setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
        }
        toast.success('Deleted');
      }
    } catch (error) {
      toast.error('Failed to delete');
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
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-gradient flex items-center gap-2">
              <Bell className="w-6 h-6 text-bro-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMarkAsRead()}
                className="p-2 text-dark-muted hover:text-bro-400 transition-colors"
                title="Mark all as read"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete()}
                className="p-2 text-dark-muted hover:text-red-400 transition-colors"
                title="Delete read notifications"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications List */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {isLoadingData && notifications.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-dark-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-dark-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-text mb-2">
              No notifications
            </h3>
            <p className="text-dark-muted">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((notification, index) => {
                const Icon = typeIcons[notification.type] || Bell;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => !notification.isRead && handleMarkAsRead([notification.id])}
                    className={`
                      relative p-4 rounded-xl border transition-all cursor-pointer
                      ${notification.isRead
                        ? 'bg-dark-card border-dark-border'
                        : 'bg-dark-card border-bro-500/30 shadow-lg shadow-bro-500/5'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${typeColors[notification.type] || typeColors.SYSTEM}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`
                          font-semibold text-sm
                          ${notification.isRead ? 'text-dark-text' : 'text-dark-text'}
                        `}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-dark-muted mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-dark-muted mt-2">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <div className="w-2.5 h-2.5 bg-bro-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full py-3 bg-dark-card rounded-xl text-bro-400 font-semibold hover:bg-dark-border transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
