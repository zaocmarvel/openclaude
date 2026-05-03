'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, LogOut, Edit2, Shield, Volume2, Bell } from 'lucide-react';
import { userApi, streakApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/layout/BottomNav';
import toast from 'react-hot-toast';

interface ProfileStats {
  brosSent: number;
  brosReceived: number;
  activeStreaks: number;
  bestStreak: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [profile, setProfile] = useState<{
    username: string;
    displayName?: string;
    email: string;
    bio?: string;
    image?: string;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  } | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const loadProfile = async () => {
    setIsLoadingData(true);
    try {
      const [profileResponse, statsResponse] = await Promise.all([
        userApi.getProfile(),
        streakApi.getStreaks('all'),
      ]);

      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data as {
          username: string;
          displayName?: string;
          email: string;
          bio?: string;
          image?: string;
          soundEnabled: boolean;
          notificationsEnabled: boolean;
        });
      }

      if (statsResponse.success && statsResponse.data) {
        const statsData = statsResponse.data as { stats: ProfileStats };
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const handleToggleSetting = async (setting: 'soundEnabled' | 'notificationsEnabled') => {
    if (!profile) return;

    const newValue = !profile[setting];
    try {
      const response = await userApi.updateProfile({ [setting]: newValue });
      if (response.success) {
        setProfile(prev => prev ? { ...prev, [setting]: newValue } : null);
        toast.success(`${setting === 'soundEnabled' ? 'Sound' : 'Notifications'} ${newValue ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-dark-bg pb-20">
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-dark-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-black text-gradient">Profile</h1>
          <button
            onClick={() => router.push('/settings')}
            className="p-2 text-dark-muted hover:text-dark-text transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-card rounded-2xl p-6 border border-dark-border mb-6"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              {profile?.image ? (
                <img
                  src={profile.image}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-dark-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-bro flex items-center justify-center ring-4 ring-dark-border">
                  <span className="text-white text-3xl font-bold">
                    {profile?.username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <button
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-dark-card border-2 border-dark-border rounded-full flex items-center justify-center text-dark-muted hover:text-dark-text"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-dark-text">
                {profile?.displayName || profile?.username}
              </h2>
              <p className="text-dark-muted">@{profile?.username}</p>
              {profile?.bio && (
                <p className="text-sm text-dark-text mt-2">{profile.bio}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {[
            { label: 'Bros Sent', value: stats?.brosSent || 0, color: 'text-bro-400' },
            { label: 'Bros Received', value: stats?.brosReceived || 0, color: 'text-green-400' },
            { label: 'Active Streaks', value: stats?.activeStreaks || 0, color: 'text-orange-400' },
            { label: 'Best Streak', value: stats?.bestStreak || 0, color: 'text-purple-400' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="bg-dark-card rounded-xl p-4 border border-dark-border"
            >
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-dark-muted">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-card rounded-2xl border border-dark-border mb-6"
        >
          <div className="p-4 border-b border-dark-border">
            <h3 className="font-semibold text-dark-text">Settings</h3>
          </div>

          <div className="divide-y divide-dark-border">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-dark-muted" />
                <span className="text-dark-text">Sound</span>
              </div>
              <button
                onClick={() => handleToggleSetting('soundEnabled')}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${profile?.soundEnabled ? 'bg-bro-500' : 'bg-dark-border'}
                `}
              >
                <motion.div
                  animate={{ x: profile?.soundEnabled ? 24 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-dark-muted" />
                <span className="text-dark-text">Notifications</span>
              </div>
              <button
                onClick={() => handleToggleSetting('notificationsEnabled')}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${profile?.notificationsEnabled ? 'bg-bro-500' : 'bg-dark-border'}
                `}
              >
                <motion.div
                  animate={{ x: profile?.notificationsEnabled ? 24 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {/* Blocked Users */}
            <button
              onClick={() => router.push('/settings/blocked')}
              className="w-full flex items-center justify-between p-4 hover:bg-dark-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-dark-muted" />
                <span className="text-dark-text">Blocked Users</span>
              </div>
              <span className="text-dark-muted">{'>'}</span>
            </button>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-500/10 text-red-400 rounded-xl font-semibold hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </motion.button>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
