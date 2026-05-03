/**
 * Bro2Bro API Service
 * Centralized API client for all backend requests
 */

import { getSession } from 'next-auth/react';

const API_BASE = '/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const session = await getSession();
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Access token not available in next-auth by default
  // if (session?.accessToken) {
  //   headers.Authorization = `Bearer ${session.accessToken}`;
  // }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; username: string; displayName?: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: data }),
};

// User
export const userApi = {
  getProfile: () => fetchApi('/user/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    fetchApi('/user/profile', { method: 'PUT', body: data }),
  getPublicProfile: (username: string) => fetchApi(`/user/${username}`),
  updateLocation: (latitude: number, longitude: number) =>
    fetchApi('/user/location', { method: 'PUT', body: { latitude, longitude } }),
};

// Bros
export const broApi = {
  getBros: (params?: { type?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/bros${query}`);
  },
  sendBro: (data: { receiverId: string; type: string; message?: string; isAnonymous: boolean }) =>
    fetchApi('/bros', { method: 'POST', body: data }),
  getBro: (id: string) => fetchApi(`/bros/${id}`),
  deleteBro: (id: string) => fetchApi(`/bros/${id}`, { method: 'DELETE' }),
  reactToBro: (broId: string, type: string) =>
    fetchApi(`/bros/${broId}/reactions`, { method: 'POST', body: { type } }),
  removeReaction: (broId: string) =>
    fetchApi(`/bros/${broId}/reactions`, { method: 'DELETE' }),
  guessSender: (broId: string, guessedUserId: string) =>
    fetchApi(`/bros/${broId}/guess`, { method: 'POST', body: { guessedUserId } }),
  getGuessStatus: (broId: string) => fetchApi(`/bros/${broId}/guess`),
};

// Feed
export const feedApi = {
  getFeed: (params?: { type?: string; cursor?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/feed${query}`);
  },
  getTrending: (timeframe?: string) =>
    fetchApi(`/feed/trending${timeframe ? `?timeframe=${timeframe}` : ''}`),
};

// Streaks
export const streakApi = {
  getStreaks: (status?: 'active' | 'all') =>
    fetchApi(`/streaks${status ? `?status=${status}` : ''}`),
  getStreakWithUser: (userId: string) => fetchApi(`/streaks/${userId}`),
};

// Suggestions
export const suggestionsApi = {
  getSuggestions: (includeLocation = false, limit = 10) =>
    fetchApi(`/suggestions?includeLocation=${includeLocation}&limit=${limit}`),
};

// Nearby
export const nearbyApi = {
  getNearby: (radius = 5000, limit = 50) =>
    fetchApi(`/nearby?radius=${radius}&limit=${limit}`),
};

// Notifications
export const notificationApi = {
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/notifications${query}`);
  },
  markAsRead: (notificationIds?: string[], markAllRead = false) =>
    fetchApi('/notifications', {
      method: 'PUT',
      body: { notificationIds, markAllRead },
    }),
  deleteNotifications: (notificationIds?: string[], deleteAllRead = false) =>
    fetchApi('/notifications', {
      method: 'DELETE',
      body: { notificationIds, deleteAllRead },
    }),
};

// Block/Report
export const moderationApi = {
  blockUser: (userId: string, reason?: string) =>
    fetchApi('/block', { method: 'POST', body: { userId, reason } }),
  unblockUser: (userId: string) =>
    fetchApi('/block', { method: 'DELETE', body: { userId } }),
  getBlockedUsers: () => fetchApi('/block'),
  reportUser: (data: { userId: string; category: string; reason?: string; broId?: string }) =>
    fetchApi('/report', { method: 'POST', body: data }),
  getReports: () => fetchApi('/report'),
};

export default {
  auth: authApi,
  user: userApi,
  bro: broApi,
  feed: feedApi,
  streak: streakApi,
  suggestions: suggestionsApi,
  nearby: nearbyApi,
  notification: notificationApi,
  moderation: moderationApi,
};
