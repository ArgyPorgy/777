-- 777 Slot Game Database Schema for Neon PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - stores game state for each wallet address
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    total_points BIGINT DEFAULT 0 NOT NULL,
    spins_today INTEGER DEFAULT 0 NOT NULL,
    last_spin_date DATE,
    highest_win BIGINT DEFAULT 0 NOT NULL,
    jackpot_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Spins table - stores individual spin history
CREATE TABLE IF NOT EXISTS spins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) NOT NULL,
    symbols JSONB NOT NULL, -- Array: ["symbol1", "symbol2", "symbol3"]
    points_earned INTEGER DEFAULT 0 NOT NULL,
    match_type VARCHAR(100) NOT NULL,
    is_jackpot BOOLEAN DEFAULT FALSE NOT NULL,
    signature VARCHAR(132), -- Wallet signature for verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_symbols_array CHECK (jsonb_typeof(symbols) = 'array')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_spins_wallet_address ON spins(wallet_address);
CREATE INDEX IF NOT EXISTS idx_spins_created_at ON spins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spins_is_jackpot ON spins(is_jackpot) WHERE is_jackpot = TRUE;

-- Leaderboard view - materialized for better performance (refresh manually or via cron)
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard AS
SELECT 
    u.wallet_address as address,
    u.total_points as points,
    u.jackpot_count as jackpots,
    ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) as rank
FROM users u
WHERE u.total_points > 0
ORDER BY u.total_points DESC, u.created_at ASC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_address ON leaderboard(address);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh leaderboard (call periodically or after updates)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
END;
$$ language 'plpgsql';





