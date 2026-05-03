// Bro2Bro TypeScript Type Definitions

// ============================================
// ENUMS
// ============================================

export type BroType = 'AGGRESSIVE' | 'FUNNY' | 'COLD' | 'HEARTBREAK' | 'RESPECT';

export const BroTypeLabels: Record<BroType, string> = {
  AGGRESSIVE: 'Aggressive',
  FUNNY: 'Funny',
  COLD: 'Cold',
  HEARTBREAK: 'Heartbreak',
  RESPECT: 'Respect',
};

export const BroTypeEmojis: Record<BroType, string> = {
  AGGRESSIVE: '',
  FUNNY: '',
  COLD: '',
  HEARTBREAK: '',
  RESPECT: '',
};

export const BroTypeColors: Record<BroType, string> = {
  AGGRESSIVE: 'bg-gradient-aggressive',
  FUNNY: 'bg-gradient-funny',
  COLD: 'bg-gradient-cold',
  HEARTBREAK: 'bg-gradient-heartbreak',
  RESPECT: 'bg-gradient-respect',
};

export type BroStatus = 'PENDING' | 'VIEWED' | 'REACTED' | 'EXPIRED';

export type ReactionType = 'BRO_BACK' | 'LAUGH' | 'IGNORE';

export const ReactionTypeLabels: Record<ReactionType, string> = {
  BRO_BACK: 'Bro Back',
  LAUGH: 'Laugh',
  IGNORE: 'Ignore',
};

export type InteractionType = 'BRO_SENT' | 'BRO_RECEIVED' | 'REACTION_SENT' | 'REACTION_RECEIVED' | 'STREAK_EXTENDED' | 'STREAK_BROKEN' | 'PROFILE_VIEWED';

export type ReportCategory = 'HARASSMENT' | 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'FAKE_ACCOUNT' | 'OTHER';

export type SafetyFlagType = 'RAPID_SENDING' | 'MASS_BRO_ATTACK' | 'REPEATED_UNWANTED_BROS' | 'BOT_BEHAVIOR' | 'LOCATION_ANOMALY';

export type NotificationType = 'NEW_BRO' | 'BRO_REACTION' | 'STREAK_UPDATE' | 'STREAK_BROKEN' | 'GUESS_RESULT' | 'BRO_REVEALED' | 'TRENDING_BRO' | 'SYSTEM';

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  image?: string;
  bio?: string;
  latitude?: number;
  longitude?: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  isAnonymousMode: boolean;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface UserWithStreaks extends User {
  activeStreaks: Streak[];
  totalBrosSent: number;
  totalBrosReceived: number;
}

export interface UserPublicProfile {
  id: string;
  username: string;
  displayName?: string;
  image?: string;
  bio?: string;
  brosSent: number;
  brosReceived: number;
  currentStreak: number;
  bestStreak: number;
  isOnline: boolean;
  distance?: number; // in meters
  lastActiveAt: Date;
}

// ============================================
// BRO TYPES
// ============================================

export interface Bro {
  id: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  type: BroType;
  message?: string;
  isAnonymous: boolean;
  revealedAt?: Date;
  guessedCorrectly?: boolean;
  status: BroStatus;
  viewedAt?: Date;
  reactionCount: number;
  engagementScore: number;
  trendingRank?: number;
  createdAt: Date;
  expiresAt?: Date;
  reactions: Reaction[];
}

export interface BroCreateInput {
  receiverId: string;
  type: BroType;
  message?: string;
  isAnonymous: boolean;
}

export interface BroWithDetails extends Bro {
  sender: User;
  receiver: User;
  reactions: Reaction[];
  userReaction?: Reaction;
}

// ============================================
// REACTION TYPES
// ============================================

export interface Reaction {
  id: string;
  broId: string;
  userId: string;
  user?: User;
  type: ReactionType;
  createdAt: Date;
}

// ============================================
// STREAK TYPES
// ============================================

export interface Streak {
  id: string;
  user1Id: string;
  user2Id: string;
  user1?: User;
  user2?: User;
  count: number;
  bestCount: number;
  lastBroAt: Date;
  expiresAt: Date;
  totalBros: number;
  isActive: boolean;
  timeRemaining: number; // seconds
}

// ============================================
// FEED TYPES
// ============================================

export interface FeedItem {
  id: string;
  bro: BroWithDetails;
  rank: number;
  engagementMetrics: EngagementMetrics;
}

export interface EngagementMetrics {
  reactionCount: number;
  viewCount: number;
  engagementRate: number;
  trendingScore: number;
  viralCoefficent: number;
}

export interface FeedFilters {
  type?: BroType;
  timeframe?: '1h' | '24h' | '7d' | '30d' | 'all';
  location?: 'nearby' | 'global';
  anonymous?: boolean;
}

// ============================================
// SUGGESTION TYPES
// ============================================

export interface BroSuggestion {
  user: UserPublicProfile;
  score: number;
  rank: number;
  reasons: SuggestionReason[];
  predictedBroType?: BroType;
  confidence: number;
}

export interface SuggestionReason {
  type: 'interaction_frequency' | 'recency' | 'response_time' | 'mutual_streak' | 'location' | 'likes_sending';
  weight: number;
  description: string;
}

export interface InteractionPattern {
  userId: string;
  totalInteractions: number;
  avgResponseTime: number;
  lastInteractionAt: Date;
  interactionStrength: number;
}

// ============================================
// LOCATION TYPES
// ============================================

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface NearbyUser {
  user: User;
  distance: number; // in meters
  direction: string; // N, NE, E, SE, S, SW, W, NW
  isOnline: boolean;
}

export interface LocationCluster {
  id: string;
  center: LocationCoordinates;
  radius: number;
  userCount: number;
  hotness: number; // 0-100
  label?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  broId?: string;
  senderId?: string;
  sender?: User;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// ============================================
// ANONYMOUS TYPES
// ============================================

export interface GuessAttempt {
  id: string;
  broId: string;
  userId: string;
  guessedUserId: string;
  isCorrect: boolean;
  createdAt: Date;
}

export interface AnonymousBroReveal {
  broId: string;
  senderId: string;
  sender: User;
  revealedAt: Date;
  guessedCorrectly: boolean;
}

// ============================================
// PERSONALITY TYPES
// ============================================

export interface PersonalityProfile {
  userId: string;
  mostActiveHour?: number;
  leastActiveHour?: number;
  preferredBroType?: BroType;
  aggressiveCount: number;
  funnyCount: number;
  coldCount: number;
  heartbreakCount: number;
  respectCount: number;
  avgResponseTimeMinutes?: number;
  totalResponses: number;
  engagementRate: number;
  viralBrosCount: number;
}

export interface UserPersonalityTraits {
  isEarlyBird: boolean;
  isNightOwl: boolean;
  consistency: number; // 0-100
  enthusiasm: number; // 0-100
  popularity: number; // 0-100
  responsiveness: number; // 0-100
  broTypeDistribution: Record<BroType, number>;
}

// ============================================
// SAFETY TYPES
// ============================================

export interface Block {
  id: string;
  issuerId: string;
  receiverId: string;
  reason?: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  issuerId: string;
  receiverId: string;
  category: ReportCategory;
  reason?: string;
  broId?: string;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  createdAt: Date;
}

export interface SafetyFlag {
  id: string;
  userId: string;
  type: SafetyFlagType;
  severity: number;
  description?: string;
  evidence?: Record<string, unknown>;
  isActive: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface RateLimitStatus {
  action: string;
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

// ============================================
// SOCKET EVENT TYPES
// ============================================

export interface ServerToClientEvents {
  'bro:received': (bro: Bro) => void;
  'bro:reaction': (data: { broId: string; reaction: Reaction }) => void;
  'streak:update': (streak: Streak) => void;
  'streak:broken': (data: { streakId: string; otherUserId: string }) => void;
  'notification:new': (notification: Notification) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  'feed:update': (bro: Bro) => void;
  'trending:update': (trendingBros: Bro[]) => void;
}

export interface ClientToServerEvents {
  'bro:send': (data: BroCreateInput, callback: (response: { success: boolean; bro?: Bro; error?: string }) => void) => void;
  'bro:react': (data: { broId: string; type: ReactionType }, callback: (response: { success: boolean; reaction?: Reaction; error?: string }) => void) => void;
  'user:location': (location: LocationCoordinates) => void;
  'user:typing': (receiverId: string) => void;
  'user:heartbeat': () => void;
}

// ============================================
// AI BOT TYPES
// ============================================

export type BroBotType = 'FUNNY' | 'MOTIVATIONAL' | 'RANDOM';

export interface BroBotMessage {
  id: string;
  type: BroBotType;
  message: string;
  broType: BroType;
  generatedAt: Date;
}

export interface BroBotSettings {
  enabled: boolean;
  type: BroBotType;
  frequency: 'low' | 'medium' | 'high';
  activeHoursStart?: number;
  activeHoursEnd?: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface UserAnalytics {
  userId: string;
  date: Date;
  brosSent: number;
  brosReceived: number;
  reactionsGiven: number;
  reactionsReceived: number;
  streaksMaintained: number;
  streaksBroken: number;
  timeSpentMinutes: number;
  sessionsCount: number;
}
