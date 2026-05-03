import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}

export function initializeSocket(token: string): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  if (socket) {
    return socket;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function reconnectSocket(): void {
  if (socket) {
    socket.connect();
  }
}

// Event listeners helpers
export function onBroReceived(
  callback: (bro: unknown) => void
): () => void {
  if (!socket) return () => {};
  socket.on('bro:received', callback);
  return () => socket?.off('bro:received', callback);
}

export function onReaction(
  callback: (data: { broId: string; reaction: unknown }) => void
): () => void {
  if (!socket) return () => {};
  socket.on('bro:reaction', callback);
  return () => socket?.off('bro:reaction', callback);
}

export function onStreakUpdate(
  callback: (streak: unknown) => void
): () => void {
  if (!socket) return () => {};
  socket.on('streak:update', callback);
  return () => socket?.off('streak:update', callback);
}

export function onNotification(
  callback: (notification: unknown) => void
): () => void {
  if (!socket) return () => {};
  socket.on('notification:new', callback);
  return () => socket?.off('notification:new', callback);
}

export function onFeedUpdate(
  callback: (bro: unknown) => void
): () => void {
  if (!socket) return () => {};
  socket.on('feed:update', callback);
  return () => socket?.off('feed:update', callback);
}

export function onUserOnline(
  callback: (userId: string) => void
): () => void {
  if (!socket) return () => {};
  socket.on('user:online', callback);
  return () => socket?.off('user:online', callback);
}

export function onUserOffline(
  callback: (userId: string) => void
): () => void {
  if (!socket) return () => {};
  socket.on('user:offline', callback);
  return () => socket?.off('user:offline', callback);
}

// Emit helpers
export function sendBro(
  data: { receiverId: string; type: string; message?: string; isAnonymous: boolean },
  callback: (response: { success: boolean; bro?: unknown; error?: string }) => void
): void {
  socket?.emit('bro:send', data, callback);
}

export function reactToBro(
  data: { broId: string; type: string },
  callback: (response: { success: boolean; reaction?: unknown; error?: string }) => void
): void {
  socket?.emit('bro:react', data, callback);
}

export function updateLocation(location: { latitude: number; longitude: number }): void {
  socket?.emit('user:location', location);
}

export function sendHeartbeat(): void {
  socket?.emit('user:heartbeat');
}

// Start heartbeat interval
let heartbeatInterval: NodeJS.Timeout | null = null;

export function startHeartbeat(interval = 60000): void {
  stopHeartbeat();
  heartbeatInterval = setInterval(sendHeartbeat, interval);
}

export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
