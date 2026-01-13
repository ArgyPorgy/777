import { Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardEntry } from "../hooks/useGameState";
import "./Leaderboard.css";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentAddress: string | undefined;
}

export function Leaderboard({ entries, currentAddress }: LeaderboardProps) {
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="rank-icon gold" size={20} />;
      case 2:
        return <Medal className="rank-icon silver" size={20} />;
      case 3:
        return <Award className="rank-icon bronze" size={20} />;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  const getRankClass = (rank: number): string => {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "";
  };

  const isCurrentUser = (address: string): boolean => {
    return currentAddress?.toLowerCase() === address.toLowerCase();
  };

  // Find current user's entry
  const currentUserEntry = entries.find(
    (e) => currentAddress && e.address.toLowerCase() === currentAddress.toLowerCase()
  );

  return (
    <div className="leaderboard-container">
      <header className="leaderboard-header">
        <h2 className="leaderboard-title">
          <Trophy className="title-icon" size={24} />
          <span>Leaderboard</span>
        </h2>
        <p className="leaderboard-subtitle">Top players by total points</p>
      </header>

      {/* Current User Rank Card */}
      {currentUserEntry && (
        <div className="your-rank-card">
          <div className="your-rank-label">Your Rank</div>
          <div className="your-rank-content">
            <div className="your-rank-position">
              <span className="your-rank-number">#{currentUserEntry.rank}</span>
              <span className="your-rank-total">of {entries.length}</span>
            </div>
            <div className="your-rank-points">
              <span className="points-value">{currentUserEntry.points.toLocaleString()}</span>
              <span className="points-label">points</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {entries.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏆</span>
            <p className="empty-text">No players yet</p>
            <p className="empty-subtext">Be the first to spin and claim the top spot!</p>
          </div>
        ) : (
          entries.slice(0, 50).map((entry) => (
            <div
              key={entry.address}
              className={`leaderboard-entry ${getRankClass(entry.rank)} ${
                isCurrentUser(entry.address) ? "current-user" : ""
              }`}
            >
              <div className="entry-rank">{getRankIcon(entry.rank)}</div>
              
              <div className="entry-info">
                <span className="entry-address">
                  {formatAddress(entry.address)}
                  {isCurrentUser(entry.address) && (
                    <span className="you-badge">You</span>
                  )}
                </span>
                {entry.jackpots > 0 && (
                  <span className="entry-jackpots">
                    🎰 {entry.jackpots} jackpot{entry.jackpots > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              
              <div className="entry-points">
                <span className="entry-points-value">{entry.points.toLocaleString()}</span>
                <span className="entry-points-label">pts</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      {entries.length > 0 && (
        <div className="leaderboard-footer">
          <div className="footer-stat">
            <span className="footer-stat-value">{entries.length}</span>
            <span className="footer-stat-label">Players</span>
          </div>
          <div className="footer-stat">
            <span className="footer-stat-value">
              {entries.reduce((sum, e) => sum + e.points, 0).toLocaleString()}
            </span>
            <span className="footer-stat-label">Total Points</span>
          </div>
          <div className="footer-stat">
            <span className="footer-stat-value">
              {entries.reduce((sum, e) => sum + e.jackpots, 0)}
            </span>
            <span className="footer-stat-label">Jackpots</span>
          </div>
        </div>
      )}
    </div>
  );
}






