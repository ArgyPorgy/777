import { Copy, LogOut, Trophy, Zap, Target, Calendar } from "lucide-react";
import type { GameState } from "../hooks/useGameState";
import "./Profile.css";

interface ProfileProps {
  address: string | undefined;
  gameState: GameState;
  userRank: number | null;
  onDisconnect: () => void;
}

export function Profile({ address, gameState, userRank, onDisconnect }: ProfileProps) {
  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  // Calculate win rate
  const totalSpins = gameState.spinHistory.length;
  const wins = gameState.spinHistory.filter((s) => s.points > 0).length;
  const winRate = totalSpins > 0 ? Math.round((wins / totalSpins) * 100) : 0;

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <header className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-emoji">🎰</span>
        </div>
        
        <div className="profile-info">
          {address && (
            <div className="address-row">
              <code className="address-text">{formatAddress(address)}</code>
              <button className="copy-btn" onClick={copyAddress} title="Copy">
                <Copy size={16} />
              </button>
            </div>
          )}
          
          {userRank && (
            <div className="rank-badge">
              <Trophy size={16} />
              <span>#{userRank}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Points Card */}
      <div className="main-points-card">
        <div className="main-points-icon">
          <Zap size={32} />
        </div>
        <div className="main-points-value">{gameState.totalPoints.toLocaleString()}</div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <Target size={24} />
          <div className="stat-value">{gameState.highestWin}</div>
          <div className="stat-label">Best Win</div>
        </div>

        <div className="stat-card">
          <Trophy size={24} />
          <div className="stat-value">{gameState.jackpotCount}</div>
          <div className="stat-label">Jackpots</div>
        </div>

        <div className="stat-card">
          <Calendar size={24} />
          <div className="stat-value">{totalSpins}</div>
          <div className="stat-label">Total Spins</div>
        </div>
      </div>

      {/* Performance */}
      {totalSpins > 0 && (
        <div className="performance-section">
          <div className="perf-header">
            <span className="perf-title">Win Rate</span>
          </div>
          <div className="perf-container">
            <div className="perf-bar">
              <div className="perf-fill" style={{ width: `${winRate}%` }}></div>
            </div>
            <div className="perf-value">{winRate}%</div>
          </div>
        </div>
      )}

      {/* Recent Spins - Points Only */}
      {gameState.spinHistory.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <span className="history-title">Recent Spins</span>
          </div>
          
          <div className="history-list-compact">
            {gameState.spinHistory.slice(0, 10).map((spin, index) => (
              <div key={index} className={`history-chip ${spin.isJackpot ? "jackpot" : spin.points > 0 ? "win" : "loss"}`}>
                {spin.isJackpot ? (
                  <span className="chip-jackpot">🎰 777</span>
                ) : spin.points > 0 ? (
                  <span className="chip-win">+{spin.points}</span>
                ) : (
                  <span className="chip-loss">0</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disconnect Button */}
      <button className="disconnect-btn" onClick={onDisconnect}>
        <LogOut size={18} />
        <span>Disconnect</span>
      </button>
    </div>
  );
}
