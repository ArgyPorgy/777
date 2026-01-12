import { useState, useEffect, useCallback, useRef } from "react";
import { getGameState, saveSpin, getLeaderboard, ApiError } from "../utils/api";

// Slot symbols (server generates these, client only displays)
export const SYMBOLS = ["7", "🍒", "🍋", "🔔", "⭐", "💎", "🍀"] as const;
export type Symbol = (typeof SYMBOLS)[number];

// Payout table - for display purposes only (actual payout calculated server-side)
export const PAYOUTS: Record<string, number> = {
  "7-7-7": 777,
  "💎-💎-💎": 200,
  "🍀-🍀-🍀": 100,
  "⭐-⭐-⭐": 75,
  "🔔-🔔-🔔": 50,
  "🍋-🍋-🍋": 30,
  "🍒-🍒-🍒": 20,
  "7-7": 25,
  "💎-💎": 15,
  "🍀-🍀": 10,
  "⭐-⭐": 8,
  "🔔-🔔": 5,
  "🍋-🍋": 3,
  "🍒-🍒": 2,
  "7": 5,
  none: 0,
};

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

// Default game state
const defaultGameState: GameState = {
  totalPoints: 0,
  spinsToday: 0,
  lastSpinDate: null,
  spinHistory: [],
  highestWin: 0,
  jackpotCount: 0,
};

export function useGameState(address: string | undefined) {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentResult, setCurrentResult] = useState<SpinResult | null>(null);
  const [spinId, setSpinId] = useState(0); // Unique ID for each spin
  const [animatedSpinId, setAnimatedSpinId] = useState(0); // Track which spinId has been animated
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to prevent double API calls (React StrictMode calls effects twice)
  const spinInProgressRef = useRef(false);

  // Load game state from API when address changes
  useEffect(() => {
    if (!address) {
      setGameState(defaultGameState);
      setIsLoading(false);
      return;
    }

    const loadState = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const state = await getGameState(address);
        setGameState(state);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load game state");
        setGameState(defaultGameState);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [address]);

  // Load leaderboard on mount only (spin function handles updates after spins)
  useEffect(() => {
    if (!address) return;
    
    const loadLeaderboardData = async () => {
      try {
        const data = await getLeaderboard(50, 0, address);
        setLeaderboard(data.entries || []);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        // Don't show error to user for leaderboard, just log it
      }
    };

    loadLeaderboardData();
  }, [address]); // Only reload on address change, not on points change

  // Check if user can spin (always true for unlimited spins)
  const canSpin = useCallback((): boolean => {
    return !isSpinning && !!address;
  }, [isSpinning, address]);

  // Get time until next spin (not used for unlimited spins)
  const getTimeUntilNextSpin = useCallback((): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }, []);

  // Perform a spin
  const spin = useCallback(async (): Promise<SpinResult | null> => {
    // Prevent double spins
    if (!address || isSpinning || spinInProgressRef.current) {
      return null;
    }

    // Mark spin as in progress immediately (synchronous, before any async)
    spinInProgressRef.current = true;

    try {
      setIsSpinning(true);
      setError(null);
      
      // Send to backend - server generates symbols and calculates payout
      const result = await saveSpin(address);

      // Update with server's authoritative result FIRST (before triggering animation)
      setCurrentResult(result);
      
      // THEN increment spin ID to trigger animation (now result is available)
      setSpinId(prev => prev + 1);

      // Reload game state and leaderboard in background
      getGameState(address).then(setGameState).catch(() => {});
      getLeaderboard(50, 0, address).then(data => setLeaderboard(data.entries || [])).catch(() => {});

      // Reset spinning state after animation completes (matches 3.5s animation)
      setTimeout(() => {
        setIsSpinning(false);
        spinInProgressRef.current = false;
      }, 3600);

      return result;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save spin");
      setIsSpinning(false);
      spinInProgressRef.current = false;
      
      // Show error state
      const errorResult: SpinResult = {
        symbols: ["❌", "❌", "❌"] as [Symbol, Symbol, Symbol],
        points: 0,
        matchType: "Error - tap to retry",
        isJackpot: false,
      };
      setCurrentResult(errorResult);
      
      return null;
    }
  }, [address, isSpinning]);

  // Get user's rank
  const getUserRank = useCallback((): number | null => {
    if (!address) return null;
    const entry = leaderboard.find(
      (e) => e.address.toLowerCase() === address.toLowerCase()
    );
    return entry?.rank || null;
  }, [address, leaderboard]);

  return {
    gameState,
    leaderboard,
    isSpinning,
    currentResult,
    spinId, // Unique ID for each spin - use to key animations
    animatedSpinId, // Track which spinId has been animated
    setAnimatedSpinId, // Allow SlotMachine to mark as animated
    error,
    isLoading,
    canSpin: canSpin(),
    timeUntilNextSpin: getTimeUntilNextSpin(),
    spin,
    getUserRank,
    // Helper to retry failed operations
    retry: useCallback(() => {
      setError(null);
      if (address) {
        getGameState(address)
          .then(setGameState)
          .catch((err) => setError(err.message));
      }
    }, [address]),
  };
}
