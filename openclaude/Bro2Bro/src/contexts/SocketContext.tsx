'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { initializeSocket, disconnectSocket, onBroReceived, onReaction, onNotification, onStreakUpdate } from '@/lib/socket';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: unknown | null;
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const token = session.user as { id: string };
      const socket = initializeSocket(token.id);

      if (socket) {
        socket.on('connect', () => {
          setIsConnected(true);
          setConnectionError(null);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        socket.on('connect_error', (error: Error) => {
          setConnectionError(error.message);
          setIsConnected(false);
        });

        // Listen for incoming bros
        const cleanupBroReceived = onBroReceived((bro) => {
          toast.success('You received a new bro!', {
            icon: '🔥',
          });
        });

        // Listen for reactions
        const cleanupReaction = onReaction((data) => {
          toast.success('Someone reacted to your bro!', {
            icon: '👊',
          });
        });

        // Listen for notifications
        const cleanupNotification = onNotification((notification) => {
          const notif = notification as { title: string };
          toast(notif.title, {
            icon: '🔔',
          });
        });

        // Listen for streak updates
        const cleanupStreakUpdate = onStreakUpdate((streak) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((streak as { isExpiringSoon?: boolean }).isExpiringSoon) {
            toast('Your streak is about to expire!', {
              icon: '⏰',
            });
          }
        });

        return () => {
          cleanupBroReceived();
          cleanupReaction();
          cleanupNotification();
          cleanupStreakUpdate();
          disconnectSocket();
        };
      }
    }

    return () => {
      disconnectSocket();
    };
  }, [session, status]);

  return (
    <SocketContext.Provider value={{ socket: null, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
