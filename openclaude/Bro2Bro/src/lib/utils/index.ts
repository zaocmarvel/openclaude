// Bro2Bro Utility Functions

import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';

// ============================================
// DATE/TIME UTILITIES
// ============================================

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatShortDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, h:mm a');
}

export function getTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = differenceInSeconds(targetDate, now);

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function isWithinLast24Hours(date: Date): boolean {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return date > dayAgo;
}

// ============================================
// LOCATION UTILITIES
// ============================================

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(distance: number): string {
  if (distance < 100) {
    return 'Nearby';
  } else if (distance < 1000) {
    return `${Math.round(distance / 10) * 10}m away`;
  } else if (distance < 10000) {
    return `${(distance / 1000).toFixed(1)}km away`;
  } else {
    return `${Math.round(distance / 1000)}km away`;
  }
}

export function getDirection(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
  const dLon = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  const angle = Math.atan2(dLon, dLat) * 180 / Math.PI;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle + 360) % 360) / 45) % 8;
  return directions[index];
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// ============================================
// STRING UTILITIES
// ============================================

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function generateUsernameSuggestion(base: string): string {
  const sanitized = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  const random = Math.floor(Math.random() * 1000);
  return `${sanitized}${random}`;
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// NUMBER UTILITIES
// ============================================

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export function getPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// ============================================
// ARRAY UTILITIES
// ============================================

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function groupBy<T>(array: T[], keyGetter: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  array.forEach(item => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

// ============================================
// ANIMATION UTILITIES
// ============================================

export function getRandomAnimationDelay(base: number = 0): number {
  return base + Math.random() * 0.5;
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// ============================================
// COLOR UTILITIES
// ============================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));

  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================
// SCORING UTILITIES
// ============================================

export function calculateEngagementScore(
  reactions: number,
  views: number,
  ageHours: number
): number {
  if (views === 0) return 0;

  const engagementRate = reactions / views;
  const recencyBoost = Math.max(0, 1 - ageHours / 24); // Linear decay over 24h
  const viralCoefficent = reactions > 10 ? Math.log10(reactions) : 0;

  return engagementRate * recencyBoost * (1 + viralCoefficent);
}

export function calculateTrendingRank(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  const normalizedScore = score / maxScore;

  // Exponential scoring for trending
  if (normalizedScore > 0.9) return 1;
  if (normalizedScore > 0.7) return 2;
  if (normalizedScore > 0.5) return 3;
  if (normalizedScore > 0.3) return 4;
  if (normalizedScore > 0.1) return 5;
  return 0;
}

// ============================================
// STREAK UTILITIES
// ============================================

export function getStreakMessage(count: number): string {
  if (count >= 365) return 'LEGENDARY BRO STREAK! 🔥';
  if (count >= 100) return 'Century Bros! 🏆';
  if (count >= 50) return 'Half-Century Bros! 💪';
  if (count >= 30) return 'Monthly Bros! 🌟';
  if (count >= 14) return 'Two-Week Bros! 🎯';
  if (count >= 7) return 'Week Bros! 🎉';
  if (count >= 3) return 'Hot Streak! 🔥';
  return `${count} Day Streak! 👊`;
}

export function getStreakColor(count: number): string {
  if (count >= 100) return 'text-yellow-400';
  if (count >= 50) return 'text-orange-400';
  if (count >= 30) return 'text-purple-400';
  if (count >= 7) return 'text-red-400';
  return 'text-blue-400';
}

// ============================================
// SOUND UTILITIES
// ============================================

export const BroSounds: Record<string, { src: string; volume: number }> = {
  aggressive: { src: '/sounds/aggressive.mp3', volume: 0.8 },
  funny: { src: '/sounds/funny.mp3', volume: 0.7 },
  cold: { src: '/sounds/cold.mp3', volume: 0.6 },
  heartbreak: { src: '/sounds/heartbreak.mp3', volume: 0.7 },
  respect: { src: '/sounds/respect.mp3', volume: 0.8 },
  notification: { src: '/sounds/notification.mp3', volume: 0.5 },
  streak: { src: '/sounds/streak.mp3', volume: 0.9 },
  reveal: { src: '/sounds/reveal.mp3', volume: 0.7 },
};

export function playSound(soundKey: string, enabled: boolean = true): void {
  if (!enabled) return;

  const sound = BroSounds[soundKey];
  if (!sound) return;

  try {
    const audio = new Audio(sound.src);
    audio.volume = sound.volume;
    audio.play().catch(() => {
      // Ignore autoplay restrictions
    });
  } catch {
    // Silently fail if audio not supported
  }
}

// ============================================
// LOCAL STORAGE UTILITIES
// ============================================

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail
  }
}

// ============================================
// DEBOUNCE/THROTTLE
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
