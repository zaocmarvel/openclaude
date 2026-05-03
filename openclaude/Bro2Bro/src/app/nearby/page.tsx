'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Users } from 'lucide-react';
import { nearbyApi } from '@/services/api';
import { userApi } from '@/services/api';
import { UserPublicProfile } from '@/types';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface NearbyUserWithDistance {
  user: UserPublicProfile;
  distance: number;
  direction: string;
  isOnline: boolean;
}

interface NearbyData {
  users: NearbyUserWithDistance[];
  clusters: { direction: string; count: number; description: string }[];
  radius: number;
  userLocation: { latitude: number; longitude: number };
}

export default function NearbyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [nearbyData, setNearbyData] = useState<NearbyData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5000);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const requestLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update user location in backend
        try {
          await userApi.updateLocation(latitude, longitude);
        } catch (error) {
          console.error('Failed to update location:', error);
        }

        // Load nearby users
        loadNearbyUsers(latitude, longitude);
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const loadNearbyUsers = async (latitude?: number, longitude?: number) => {
    setIsLoadingData(true);
    try {
      const response = await nearbyApi.getNearby(radius);
      if (response.success && response.data) {
        setNearbyData(response.data);
      }
    } catch (error) {
      console.error('Failed to load nearby users:', error);
      toast.error('Failed to load nearby users');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      requestLocation();
    }
  }, [isAuthenticated, radius]);

  const formatDistance = (meters: number): string => {
    if (meters < 100) return 'Nearby';
    if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
    return `${(meters / 1000).toFixed(1)}km`;
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
          <h1 className="text-xl font-black text-gradient flex items-center gap-2">
            <MapPin className="w-6 h-6 text-bro-400" />
            Nearby Bros
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Location Controls */}
        <div className="bg-dark-card rounded-2xl p-4 border border-dark-border mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-bro-400" />
              <span className="font-semibold text-dark-text">
                Radius: {(radius / 1000).toFixed(1)}km
              </span>
            </div>
            <button
              onClick={requestLocation}
              className="px-3 py-1.5 bg-bro-500 text-white text-sm font-semibold rounded-full hover:bg-bro-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Radius Slider */}
          <input
            type="range"
            min="500"
            max="50000"
            step="500"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2 bg-dark-border rounded-full appearance-none cursor-pointer accent-bro-500"
          />
          <div className="flex justify-between text-xs text-dark-muted mt-1">
            <span>500m</span>
            <span>50km</span>
          </div>
        </div>

        {/* Error Message */}
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4"
          >
            <p className="text-red-400 text-sm">{locationError}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoadingData && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="spinner mb-4" />
            <p className="text-dark-muted text-sm">Finding nearby bros...</p>
          </div>
        )}

        {/* Nearby Users List */}
        {!isLoadingData && nearbyData && (
          <>
            {/* Clusters */}
            {nearbyData.clusters.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-dark-muted mb-2">Clusters</h2>
                <div className="flex flex-wrap gap-2">
                  {nearbyData.clusters.map((cluster, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-bro-500/20 text-bro-400 text-xs font-medium rounded-full"
                    >
                      {cluster.description}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Users Count */}
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-bro-400" />
              <span className="text-dark-text font-semibold">
                {nearbyData.users.length} bro{nearbyData.users.length !== 1 ? 's' : ''} nearby
              </span>
            </div>

            {/* Users Grid */}
            {nearbyData.users.length > 0 ? (
              <div className="grid gap-3">
                {nearbyData.users.map((item, index) => (
                  <motion.div
                    key={item.user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/profile/${item.user.username}`)}
                    className="bg-dark-card rounded-xl p-4 border border-dark-border flex items-center gap-4 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {item.user.image ? (
                        <img
                          src={item.user.image}
                          alt={item.user.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-bro flex items-center justify-center">
                          <span className="text-white font-bold">
                            {item.user.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      {item.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark-card" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-dark-text truncate">
                        {item.user.displayName || item.user.username}
                      </h3>
                      <p className="text-sm text-dark-muted">@{item.user.username}</p>
                    </div>

                    {/* Distance */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-bro-400">
                        {formatDistance(item.distance)}
                      </p>
                      <p className="text-xs text-dark-muted">{item.direction}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-dark-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-text mb-2">
                  No bros nearby
                </h3>
                <p className="text-dark-muted">
                  Try increasing the radius or check back later
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
