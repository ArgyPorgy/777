import { sql } from '../db/connection.js';
import { calculatePayout, generateSpinSymbols } from './validation.js';
import type { Symbol, GameState, SpinResult, UserRecord, SpinRecord } from '../types/index.js';

// Get today's date string in UTC (consistent with database)
export function getTodayString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

// Load user game state from database
export async function loadGameState(walletAddress: string): Promise<GameState> {
  try {
    // Default state for new users or errors
    const defaultState: GameState = {
      totalPoints: 0,
      spinsToday: 0,
      lastSpinDate: null,
      spinHistory: [],
      highestWin: 0,
      jackpotCount: 0,
    };

    let users: UserRecord[];
    try {
      users = await sql<UserRecord[]>`
        SELECT * FROM users 
        WHERE wallet_address = ${walletAddress.toLowerCase()}
        LIMIT 1
      `;
    } catch (dbError) {
      console.error('Database error loading user:', dbError);
      return defaultState;
    }

    if (users.length === 0) {
      // Create new user
      try {
        await sql`
          INSERT INTO users (wallet_address)
          VALUES (${walletAddress.toLowerCase()})
          ON CONFLICT (wallet_address) DO NOTHING
        `;
      } catch (insertError) {
        console.error('Error creating user:', insertError);
      }
      return defaultState;
    }

    const user = users[0];
    const today = getTodayString();
    
    // Get last_spin_date as text directly from database to avoid timezone issues
    let lastSpinDateStr: string | null = null;
    try {
      const dateResult = await sql<{ date_text: string | null }[]>`
        SELECT last_spin_date::text as date_text 
        FROM users 
        WHERE wallet_address = ${walletAddress.toLowerCase()}
      `;
      if (dateResult.length > 0 && dateResult[0].date_text) {
        lastSpinDateStr = dateResult[0].date_text;
      }
    } catch (dateError) {
      console.error('Error getting last_spin_date:', dateError);
    }
    
    // Reset spins if new day
    if (lastSpinDateStr !== today) {
      try {
        await sql`
          UPDATE users 
          SET spins_today = 0 
          WHERE wallet_address = ${walletAddress.toLowerCase()}
        `;
        user.spins_today = 0;
      } catch (updateError) {
        console.error('Error resetting spins:', updateError);
      }
    }

    // Load recent spin history (last 50)
    let spinHistory: SpinResult[] = [];
    try {
      const spins = await sql<SpinRecord[]>`
        SELECT * FROM spins 
        WHERE wallet_address = ${walletAddress.toLowerCase()}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      spinHistory = spins.map((spin) => ({
        symbols: spin.symbols,
        points: spin.points_earned,
        matchType: spin.match_type,
        isJackpot: spin.is_jackpot,
      }));
    } catch (spinsError) {
      console.error('Error loading spin history:', spinsError);
    }

    return {
      totalPoints: Number(user.total_points || 0),
      spinsToday: user.spins_today || 0,
      lastSpinDate: user.last_spin_date || null,
      spinHistory,
      highestWin: Number(user.highest_win || 0),
      jackpotCount: user.jackpot_count || 0,
    };
  } catch (error) {
    console.error('Error loading game state:', error);
    // Return default state instead of throwing
    return {
      totalPoints: 0,
      spinsToday: 0,
      lastSpinDate: null,
      spinHistory: [],
      highestWin: 0,
      jackpotCount: 0,
    };
  }
}

// Save spin result to database
export async function saveSpin(
  walletAddress: string,
  _clientSymbols: [Symbol, Symbol, Symbol], // Ignored - server generates its own
  signature?: string
): Promise<SpinResult> {
  // SECURITY: Generate symbols server-side - never trust client
  const symbols = generateSpinSymbols();
  
  // Calculate payout
  const { points, matchType } = calculatePayout(symbols);
  const isJackpot = symbols.every((s) => s === '7');

  try {
    // Ensure user exists first
    try {
      await sql`
        INSERT INTO users (wallet_address)
        VALUES (${walletAddress.toLowerCase()})
        ON CONFLICT (wallet_address) DO NOTHING
      `;
    } catch (userError) {
      console.error('Error ensuring user exists:', userError);
    }

    // Insert spin record
    try {
      await sql`
        INSERT INTO spins (
          wallet_address, 
          symbols, 
          points_earned, 
          match_type, 
          is_jackpot,
          signature
        )
        VALUES (
          ${walletAddress.toLowerCase()},
          ${JSON.stringify(symbols)}::jsonb,
          ${points},
          ${matchType},
          ${isJackpot},
          ${signature || null}
        )
      `;
    } catch (spinError) {
      console.error('Error inserting spin:', spinError);
    }

    // Update user state
    const today = getTodayString();
    try {
      await sql`
        UPDATE users 
        SET 
          total_points = total_points + ${points},
          spins_today = spins_today + 1,
          last_spin_date = ${today}::date,
          highest_win = GREATEST(highest_win, ${points}),
          jackpot_count = jackpot_count + ${isJackpot ? 1 : 0},
          updated_at = NOW()
        WHERE wallet_address = ${walletAddress.toLowerCase()}
      `;
    } catch (updateError) {
      console.error('Error updating user:', updateError);
    }

    // Refresh leaderboard (non-critical)
    try {
      await sql`SELECT refresh_leaderboard()`;
    } catch (error) {
      console.warn('Failed to refresh leaderboard:', error);
    }

    return {
      symbols,
      points,
      matchType,
      isJackpot,
    };
  } catch (error) {
    console.error('Error saving spin:', error);
    // Return result anyway - don't crash the server
    return {
      symbols,
      points,
      matchType,
      isJackpot,
    };
  }
}

// Get leaderboard
export async function getLeaderboard(limit = 50, offset = 0): Promise<Array<{
  address: string;
  points: number;
  rank: number;
  jackpots: number;
}>> {
  try {
    const entries = await sql<Array<{
      address: string;
      points: bigint;
      rank: number;
      jackpots: number;
    }>>`
      SELECT 
        address,
        points::bigint as points,
        rank,
        jackpots
      FROM leaderboard
      ORDER BY rank ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Handle empty results gracefully
    if (!entries || entries.length === 0) {
      return [];
    }

    return entries.map((e) => ({
      address: e.address,
      points: Number(e.points),
      rank: Number(e.rank),  // ROW_NUMBER() returns bigint, convert to number
      jackpots: Number(e.jackpots),
    }));
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    // Return empty array instead of throwing - allows app to work even if leaderboard fails
    return [];
  }
}

// Get user rank
export async function getUserRank(walletAddress: string): Promise<number | null> {
  try {
    const result = await sql<Array<{ rank: bigint }>>`
      SELECT rank 
      FROM leaderboard 
      WHERE address = ${walletAddress.toLowerCase()}
      LIMIT 1
    `;

    return result.length > 0 ? Number(result[0].rank) : null;
  } catch (error) {
    console.error('Error getting user rank:', error);
    return null;
  }
}


