// Shared types between frontend and backend

export type Symbol = "7" | "🍒" | "🍋" | "🔔" | "⭐" | "💎" | "🍀";

export interface SpinResult {
  symbols: [Symbol, Symbol, Symbol];
  points: number;
  matchType: string;
  isJackpot: boolean;
}

export interface GameState {
  totalPoints: number;
  spinsToday: number;
  lastSpinDate: string | null;
  spinHistory: SpinResult[];
  highestWin: number;
  jackpotCount: number;
}

export interface LeaderboardEntry {
  address: string;
  points: number;
  rank: number;
  jackpots: number;
}

export interface UserRecord {
  id: string;
  wallet_address: string;
  total_points: number;
  spins_today: number;
  last_spin_date: string | null;
  highest_win: number;
  jackpot_count: number;
  created_at: string;
  updated_at: string;
}

export interface SpinRecord {
  id: string;
  wallet_address: string;
  symbols: [Symbol, Symbol, Symbol];
  points_earned: number;
  match_type: string;
  is_jackpot: boolean;
  signature: string | null;
  created_at: string;
}

export interface SpinRequest {
  symbols: [Symbol, Symbol, Symbol];
  signature?: string;
  timestamp?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}



