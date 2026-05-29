import type { UserProfile } from '@story/engine';
import { adminClient } from './supabase.js';
import type { Database } from './database.types.js';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ============================================================
// MAPPERS
// ============================================================

function dbRowToUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    subscriptionTier: row.subscription_tier,
    monthlyGenerationCount: row.monthly_generation_count,
    monthlyResetDate: row.monthly_reset_date,
  };
}

// ============================================================
// QUERIES
// ============================================================

export async function getProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile for user ${userId}: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Profile not found for user ${userId}`);
  }

  return dbRowToUserProfile(data);
}

export async function incrementGenerationCount(
  userId: string,
  limit: number,
): Promise<boolean> {
  const { data, error } = await adminClient.rpc('increment_generation_count', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    throw new Error(
      `Failed to increment generation count for user ${userId}: ${error.message}`,
    );
  }

  // The RPC returns true if the update happened (under limit), false if limit was reached
  return data === true;
}

export async function updateSubscriptionTier(
  userId: string,
  tier: 'free' | 'pro',
): Promise<void> {
  const { error } = await adminClient
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('id', userId);

  if (error) {
    throw new Error(
      `Failed to update subscription tier for user ${userId}: ${error.message}`,
    );
  }
}
