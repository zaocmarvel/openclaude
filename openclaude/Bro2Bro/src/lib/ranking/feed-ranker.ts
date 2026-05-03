/**
 * Viral Feed Ranking System
 *
 * Similar to TikTok/Instagram algorithms, this system ranks content
 * based on engagement velocity, recency, and user behavior.
 */

interface RankingFactors {
  reactions: number;
  ageHours: number;
  engagementRate: number;
  trendingRank?: number;
  views?: number;
  comments?: number;
  shares?: number;
  authority?: number; // User's follower count / credibility
  contentFreshness?: number;
  userAffinity?: number; // How likely current user is to engage
}

interface RankedItem {
  id: string;
  score: number;
  factors: RankingFactors;
}

/**
 * Calculate feed ranking score using multiple factors
 */
export function calculateFeedRanking(bro: {
  _count?: { reactions: number };
  reactionCount?: number;
  engagementScore?: number;
  trendingRank?: number;
  createdAt: Date | string;
  engagementMetrics?: {
    reactionCount: number;
    viewCount: number;
    engagementRate: number;
    trendingScore: number;
    viralCoefficent: number;
    ageHours: number;
  };
}): number {
  const metrics = bro.engagementMetrics;

  if (!metrics) {
    // Fallback calculation
    const reactions = bro.reactionCount || bro._count?.reactions || 0;
    const ageHours = (Date.now() - new Date(bro.createdAt).getTime()) / (1000 * 60 * 60);
    return calculateScore({
      reactions,
      ageHours,
      engagementRate: reactions > 0 ? reactions / Math.max(ageHours, 1) : 0,
    });
  }

  return calculateScore({
    reactions: metrics.reactionCount,
    ageHours: metrics.ageHours,
    engagementRate: metrics.engagementRate,
    trendingRank: bro.trendingRank || undefined,
    views: metrics.viewCount,
  });
}

/**
 * Core ranking algorithm
 *
 * Formula inspired by Reddit's "Hot" algorithm and TikTok's engagement velocity:
 * Score = (Engagement_Velocity * Recency_Decay * Quality_Score) + Trending_Boost
 */
function calculateScore(factors: RankingFactors): number {
  const {
    reactions,
    ageHours,
    engagementRate,
    trendingRank,
    views = Math.max(reactions * 10, 1),
    userAffinity = 0.5,
  } = factors;

  // 1. Engagement Velocity
  // Higher reactions in shorter time = higher velocity
  const reactionVelocity = reactions / Math.max(ageHours, 0.5);

  // 2. Engagement Rate (quality indicator)
  // What % of viewers engage with the content
  const actualEngagementRate = reactions / views;
  const qualityBonus = actualEngagementRate > 0.1 ? 1.5 : 1.0; // Boost for high engagement %

  // 3. Recency Decay (sigmoid function for smooth decay)
  // Content stays relevant longer initially, then decays
  // 24h = 0.5 weight, 48h = 0.25 weight, 72h+ = minimal weight
  const recencyDecay = 1 / (1 + Math.exp((ageHours - 24) / 12));

  // 4. Trending Boost
  // Pre-ranked content gets additional boost
  let trendingBoost = 1.0;
  if (trendingRank === 1) trendingBoost = 3.0;
  else if (trendingRank === 2) trendingBoost = 2.5;
  else if (trendingRank === 3) trendingBoost = 2.0;
  else if (trendingRank && trendingRank <= 10) trendingBoost = 1.5;

  // 5. User Affinity
  // Personalized ranking based on similar interests
  const affinityMultiplier = 0.5 + userAffinity; // 0.5 to 1.5

  // Final score calculation
  const baseScore = reactionVelocity * recencyDecay * qualityBonus * trendingBoost;
  const finalScore = baseScore * affinityMultiplier;

  return Math.round(finalScore * 1000) / 1000;
}

/**
 * Personalized ranking for user feeds
 * Takes into account user's past behavior
 */
export function calculatePersonalizedScore(
  bro: {
    id: string;
    type: string;
    senderId: string;
    engagementScore: number;
    reactions: Array<{ userId: string }>;
  },
  currentUserId: string,
  userPreferences: {
    preferredBroTypes: string[];
    interactedUserIds: string[];
    blockedUserIds: string[];
  }
): number {
  let score = bro.engagementScore;

  // Penalize blocked users
  if (userPreferences.blockedUserIds.includes(bro.senderId)) {
    return -Infinity;
  }

  // Boost for preferred bro types
  if (userPreferences.preferredBroTypes.includes(bro.type)) {
    score *= 1.3;
  }

  // Boost for users the current user has interacted with
  if (userPreferences.interactedUserIds.includes(bro.senderId)) {
    score *= 1.4;
  }

  // Small boost for mutual friends (users who liked similar content)
  const mutualReactions = bro.reactions.filter(r =>
    userPreferences.interactedUserIds.includes(r.userId)
  ).length;
  if (mutualReactions > 0) {
    score *= (1 + mutualReactions * 0.1);
  }

  return score;
}

/**
 * ML-based Ranking System Design (Advanced)
 *
 * For a production ML ranking system similar to TikTok:
 */
export interface MLRankingFeatures {
  // Content Features
  contentAge: number;
  contentType: string;
  textLength: number;
  hasMedia: boolean;

  // Engagement Features
  reactionCount: number;
  reactionVelocity: number; // reactions per hour
  engagementRate: number;
  completionRate: number; // For video/audio content
  rewatchRate: number;

  // User Features
  senderFollowerCount: number;
  senderEngagementRate: number;
  senderAuthorityScore: number;

  // Context Features
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  trendingStatus: number; // 0-1

  // User-Content Affinity
  userBroTypePreference: number;
  userSenderHistory: number;
  userEngagementSimilarity: number;
}

/**
 * ML Model Architecture (Conceptual)
 *
 * Input: MLRankingFeatures
 * Model: Gradient Boosted Decision Trees or Deep Neural Network
 * Output: P(like), P(comment), P(share), P(complete)
 *
 * Ranking Score = weighted sum of predicted probabilities
 */
export function mockMLRanking(features: MLRankingFeatures): number {
  // This is a simplified mock of what an ML model would output
  // In production, this would be a trained model serving predictions

  const pLike = sigmoid(
    features.reactionVelocity * 0.5 +
    features.engagementRate * 2 +
    features.userBroTypePreference * 1.5 -
    features.contentAge * 0.1
  );

  const pShare = sigmoid(
    features.engagementRate * 1.5 +
    features.trendingStatus * 2 -
    features.contentAge * 0.05
  );

  // Weighted final score
  return pLike * 0.6 + pShare * 0.4;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Feature Engineering for ML Model
 *
 * These features would be extracted and stored for model training:
 */
export function extractFeatures(bro: unknown, user: unknown, context: unknown): MLRankingFeatures {
  // Placeholder implementation - actual implementation would parse the objects
  return {
    contentAge: 0,
    contentType: 'text',
    textLength: 0,
    hasMedia: false,
    reactionCount: 0,
    reactionVelocity: 0,
    engagementRate: 0,
    completionRate: 0,
    rewatchRate: 0,
    senderFollowerCount: 0,
    senderEngagementRate: 0,
    senderAuthorityScore: 0,
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    trendingStatus: 0,
    userBroTypePreference: 0,
    userSenderHistory: 0,
    userEngagementSimilarity: 0,
  };
}

/**
 * A/B Testing Framework for Ranking Algorithms
 */
export function getRankingAlgorithm(experimentGroup: string): string {
  const algorithms: Record<string, string> = {
    control: 'time_decay',
    variant_a: 'engagement_velocity',
    variant_b: 'ml_personalized',
    variant_c: 'hybrid',
  };

  return algorithms[experimentGroup] || 'time_decay';
}

/**
 * Multi-Armed Bandit for Dynamic Ranking
 * Automatically shifts traffic to best performing ranking
 */
export interface BanditArm {
  name: string;
  pulls: number;
  reward: number;
  upperConfidenceBound: number;
}

export function selectBestRankingAlgorithm(arms: BanditArm[]): string {
  // UCB1 algorithm
  const totalPulls = arms.reduce((sum, arm) => sum + arm.pulls, 0);

  const armsWithUCB = arms.map(arm => ({
    ...arm,
    upperConfidenceBound:
      arm.reward / Math.max(arm.pulls, 1) +
      Math.sqrt((2 * Math.log(totalPulls + 1)) / Math.max(arm.pulls, 1)),
  }));

  const bestArm = armsWithUCB.reduce((best, arm) =>
    arm.upperConfidenceBound > best.upperConfidenceBound ? arm : best
  );

  return bestArm.name;
}
