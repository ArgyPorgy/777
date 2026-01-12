import { z } from 'zod';
import type { Symbol } from '../types/index.js';

// Symbol validation
export const SYMBOLS = ["7", "🍒", "🍋", "🔔", "⭐", "💎", "🍀"] as const;

export const SymbolSchema = z.enum(SYMBOLS);

// Wallet address validation (Ethereum/Farcaster format)
export const WalletAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format')
  .length(42, 'Wallet address must be 42 characters');

// Validate spin symbols (client sends these but server ignores them for security)
export const SpinSymbolsSchema = z.tuple([
  SymbolSchema,
  SymbolSchema,
  SymbolSchema
]);

// Validate spin request
export const SpinRequestSchema = z.object({
  symbols: SpinSymbolsSchema.optional(), // Optional - server generates its own
  signature: z.string().optional(),
  timestamp: z.number().optional(),
});

// Validate pagination params
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Symbol weights for server-side random generation (higher = more common)
const SYMBOL_WEIGHTS: Record<Symbol, number> = {
  "🍒": 20,  // Most common
  "🍋": 18,
  "🔔": 15,
  "⭐": 12,
  "🍀": 10,
  "💎": 8,
  "7": 17,   // Lucky 7 - moderate chance
};

// Generate random symbol with weighted probability
function getRandomSymbol(previousSymbols: Symbol[] = []): Symbol {
  // If we have 2 matching symbols, small boost for triple (15% chance)
  if (previousSymbols.length === 2 && previousSymbols[0] === previousSymbols[1]) {
    if (Math.random() < 0.15) {
      return previousSymbols[0];
    }
  }
  
  // Regular weighted selection
  const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const [symbol, weight] of Object.entries(SYMBOL_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return symbol as Symbol;
    }
  }

  return "🍒"; // Fallback
}

// Generate symbols server-side (secure - cannot be manipulated by client)
export function generateSpinSymbols(): [Symbol, Symbol, Symbol] {
  const s1 = getRandomSymbol();
  const s2 = getRandomSymbol([s1]);
  const s3 = getRandomSymbol([s1, s2]);
  return [s1, s2, s3];
}

// Payout table
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

export function calculatePayout(
  symbols: [Symbol, Symbol, Symbol]
): { points: number; matchType: string } {
  const [s1, s2, s3] = symbols;

  // Check for triple match
  if (s1 === s2 && s2 === s3) {
    const key = `${s1}-${s2}-${s3}`;
    return { points: PAYOUTS[key] || 0, matchType: key };
  }

  // Check for double match
  if (s1 === s2) {
    const key = `${s1}-${s2}`;
    return { points: PAYOUTS[key] || 0, matchType: `${key} (first two)` };
  }
  if (s2 === s3) {
    const key = `${s2}-${s3}`;
    return { points: PAYOUTS[key] || 0, matchType: `${key} (last two)` };
  }
  if (s1 === s3) {
    const key = `${s1}-${s3}`;
    return { points: PAYOUTS[key] || 0, matchType: `${key} (first & last)` };
  }

  // Check for single 7
  if (s1 === "7" || s2 === "7" || s3 === "7") {
    return { points: PAYOUTS["7"], matchType: "Single 7" };
  }

  return { points: 0, matchType: "No match" };
}

// Verify wallet signature (basic validation - can be enhanced with actual crypto verification)
export function verifySignature(
  address: string,
  message: string,
  signature: string
): boolean {
  // TODO: Implement actual signature verification using ethers.js or viem
  // For now, return true if signature exists (basic check)
  // In production, you should verify the signature cryptographically
  if (!signature || signature.length < 132) {
    return false;
  }
  
  // Basic format check
  return /^0x[a-fA-F0-9]+$/.test(signature);
}


