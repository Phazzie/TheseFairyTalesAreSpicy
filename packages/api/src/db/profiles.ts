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
    if (error.code === 'PGRST116') {
      // Profile doesn't exist — create it (defensive, handles trigger failures)
      const { data: newProfile, error: insertError } = await adminClient
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id' })
        .select()
        .single();
      if (insertError) throw new Error(`Failed to create profile: ${insertError.message}`);
      return dbRowToUserProfile(newProfile);
    }
    throw new Error(`Failed to fetch profile for user ${userId}: ${error.message}`);
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

function getNextMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
}

export async function resetGenerationCountIfExpired(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await adminClient
    .from('profiles')
    .update({ monthly_generation_count: 0, monthly_reset_date: getNextMonthStart() })
    .eq('id', userId)
    .lt('monthly_reset_date', now);
  if (error) throw new Error(`Failed to reset generation count: ${error.message}`);
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
