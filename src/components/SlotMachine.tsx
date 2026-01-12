import { useState, useEffect, useRef } from "react";
import { SYMBOLS, type SpinResult, type GameState } from "../hooks/useGameState";
import { Trophy, Gamepad2, User } from "lucide-react";
import "./SlotMachine.css";

interface SlotMachineProps {
  gameState: GameState;
  isSpinning: boolean;
  currentResult: SpinResult | null;
  spinId: number; // Unique ID for each spin
  animatedSpinId: number; // Track which spinId has been animated
  setAnimatedSpinId: (id: number) => void; // Mark as animated
  canSpin: boolean;
  timeUntilNextSpin: string;
  spin: () => Promise<SpinResult | null>;
  error?: string | null;
  onNavigate?: (tab: "leaderboard" | "game" | "profile") => void;
}

export function SlotMachine({
  gameState,
  isSpinning,
  currentResult,
  spinId,
  animatedSpinId,
  setAnimatedSpinId,
  spin,
  error,
  onNavigate,
}: SlotMachineProps) {
  // 3x3 grid of symbols - all visible at once
  const [displayGrid, setDisplayGrid] = useState<string[][]>([
    ["7", "💎", "💰"],
    ["🍒", "🍒", "7"],
    ["💎", "🍀", "🍒"]
  ]);
  const [showWin, setShowWin] = useState(false);
  const [spinningColumns, setSpinningColumns] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const spinningRef = useRef<[boolean, boolean, boolean]>([false, false, false]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]); // Track all timers
  const currentResultRef = useRef<SpinResult | null>(null); // Store result for timers
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Update the result ref when currentResult changes (for timers to access)
  useEffect(() => {
    currentResultRef.current = currentResult;
  }, [currentResult]);

  // Handle spin animation - triggered when BOTH spinId changes AND currentResult is available
  useEffect(() => {
    // Skip if spinId is 0 (initial state) or we've already animated this spinId
    if (spinId === 0 || spinId === animatedSpinId) {
      // Still ensure spinning is stopped if we're not animating
      if (spinningRef.current.some(spinning => spinning)) {
        spinningRef.current = [false, false, false];
        setSpinningColumns([false, false, false]);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      return;
    }
    
    // Wait for currentResult to be available before starting animation
    if (!currentResult) {
      return;
    }
    
    // Mark this spinId as animated (persists in parent hook, survives tab changes)
    setAnimatedSpinId(spinId);
    
    // Clear any existing animation first - CRITICAL: Stop all spinning and clear everything
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
    
    // Ensure all columns are stopped before starting new animation
    spinningRef.current = [false, false, false];
    setSpinningColumns([false, false, false]);
      
    setShowWin(false);

    // All 3 columns start spinning at the same time
    spinningRef.current = [true, true, true];
    setSpinningColumns([true, true, true]);

    // Stop columns one by one (1 second gap between each stop)
    // First wheel stops after 1 second
    timersRef.current.push(setTimeout(() => {
      spinningRef.current = [false, true, true];
      setSpinningColumns([false, true, true]);
      const result = currentResultRef.current;
      if (result) {
        setDisplayGrid((prev) => {
          const newGrid = prev.map(row => [...row]);
          newGrid[1][0] = result.symbols[0];
          newGrid[0][0] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          newGrid[2][0] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          return newGrid;
        });
      }
    }, 1000));

    // Second wheel stops after 2 seconds
    timersRef.current.push(setTimeout(() => {
      spinningRef.current = [false, false, true];
      setSpinningColumns([false, false, true]);
      const result = currentResultRef.current;
      if (result) {
        setDisplayGrid((prev) => {
          const newGrid = prev.map(row => [...row]);
          newGrid[1][1] = result.symbols[1];
          newGrid[0][1] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          newGrid[2][1] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          return newGrid;
        });
      }
    }, 2000));

    // Third wheel stops after 3 seconds
    timersRef.current.push(setTimeout(() => {
      spinningRef.current = [false, false, false];
      setSpinningColumns([false, false, false]);
      const result = currentResultRef.current;
      if (result) {
        setDisplayGrid((prev) => {
          const newGrid = prev.map(row => [...row]);
          newGrid[1][2] = result.symbols[2];
          newGrid[0][2] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          newGrid[2][2] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          return newGrid;
        });

        // Show win popup if points > 0
        setTimeout(() => {
          if (result.points > 0) {
            setShowWin(true);
            setTimeout(() => setShowWin(false), 3000);
          }
        }, 300);
      }
    }, 3000));

    // Continuous animation - update symbols for spinning columns
    intervalRef.current = setInterval(() => {
      setDisplayGrid((prev) => {
        return prev.map((row) => 
          row.map((symbol, colIndex) => {
            if (spinningRef.current[colIndex]) {
              return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            }
            return symbol;
          })
        );
      });
    }, 80); // Fast update for smooth spinning

    // Cleanup interval after all stops - CRITICAL: This MUST run to stop spinning
    timersRef.current.push(setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Ensure spinning state is stopped
      spinningRef.current = [false, false, false];
      setSpinningColumns([false, false, false]);
    }, 3500));

    // Cleanup function - CRITICAL: Always stop spinning when effect re-runs or unmounts
    return () => {
      // Stop all spinning immediately
      spinningRef.current = [false, false, false];
      setSpinningColumns([false, false, false]);
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Clear all timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, [spinId, currentResult]); // Depend on spinId and currentResult - animatedSpinId is only checked, not reacted to

  const handleSpin = async () => {
    if (isSpinning) return;
    setShowWin(false);
    try {
      await spin();
    } catch (err) {
      // Error is handled in useGameState hook
    }
  };

  const getWinMessage = () => {
    if (!currentResult) return null;
    return `C ${currentResult.points}`;
  };

  return (
    <div className="slot-machine-screen">
      {/* Top Header */}
      <header className="game-top-header">
        <div className="top-header-left">
          <div className="header-logo">
            <span className="logo-777">777</span>
          </div>
        </div>
        <div className="top-header-right">
          <div className="header-points">
            <span className="points-value">{gameState.totalPoints.toLocaleString()}</span>
            <span className="points-label">pts</span>
          </div>
        </div>
      </header>


      {/* Slot Machine */}
      <div className="slot-machine-wrapper">
        <div className="slot-machine-new">
          <div className="machine-inner">
            {/* 3x3 Grid */}
            <div className="grid-container">
              <div className={`symbols-grid ${spinningColumns.some(s => s) ? "spinning" : ""}`}>
                {/* Spotlight overlay for middle row */}
                <div className="spotlight-overlay"></div>
                
                {displayGrid.map((row, rowIndex) => (
                  <div key={rowIndex} className={`grid-row ${rowIndex === 1 ? "highlight-row" : ""}`}>
                    {row.map((symbol, colIndex) => (
                      <div 
                        key={colIndex} 
                        className={`grid-cell ${rowIndex === 1 ? "win-row" : ""} ${spinningColumns[colIndex] ? "spinning-col" : ""}`}
                        data-column={colIndex}
                      >
                        <span className="grid-symbol">{symbol}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Vertical Slider */}
              <div className="slider-container">
                <div className="slider-track">
                  <div 
                    className={`slider-handle ${isSpinning ? "moving" : ""}`}
                    style={{ top: isSpinning ? "30%" : "66%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Win Overlay */}
            {showWin && currentResult && currentResult.points > 0 && (
              <div className="win-overlay">
                <div className="win-text-small">you won</div>
                <div className="win-amount">{getWinMessage()}</div>
              </div>
            )}

          </div>

          {/* Stats Bar */}
          <div className="machine-stats-bar">
            <div className="stats-left">
              <span className="spins-left">SPINS TODAY: {gameState.spinsToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spin Button */}
      <div className="spin-button-section">
        {error && (
          <div className="error-message" style={{
            color: '#ff4444',
            padding: '8px',
            marginBottom: '8px',
            textAlign: 'center',
            fontSize: '12px',
            background: 'rgba(255, 68, 68, 0.1)',
            borderRadius: '4px',
          }}>
            ⚠️ {error}
          </div>
        )}
        <button 
          className={`spin-btn ${isSpinning ? "spinning" : ""}`}
          onClick={handleSpin}
          disabled={isSpinning}
        >
          {isSpinning ? "SPINNING..." : "SPIN"}
        </button>
      </div>

      {/* Details Button */}
      <div className="details-section">
        <button className="details-btn" onClick={() => setShowHowToPlay(true)}>
          <span className="details-text">details</span>
        </button>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="how-to-play-modal" onClick={() => setShowHowToPlay(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowHowToPlay(false)}>
              ✕
            </button>
            
            <h2 className="modal-title">Game Details</h2>
            
            <div className="instructions">
              <div className="instruction-item">
                <div className="instruction-number">1</div>
                <div className="instruction-text">
                  <strong>Click SPIN</strong> to spin the three reels. All reels start spinning simultaneously.
                </div>
              </div>
              
              <div className="instruction-item">
                <div className="instruction-number">2</div>
                <div className="instruction-text">
                  <strong>Watch the reels stop</strong> one by one (1 second apart). The middle row determines your result.
                </div>
              </div>
              
              <div className="instruction-item">
                <div className="instruction-number">3</div>
                <div className="instruction-text">
                  <strong>Match symbols</strong> to win points. Three matching symbols = highest payout. Two matching = partial payout. Single 7 = bonus points.
                </div>
              </div>
              
              <div className="instruction-item">
                <div className="instruction-number">4</div>
                <div className="instruction-text">
                  <strong>Track your progress</strong> - Check your profile for stats and recent spins. View the leaderboard to compete with others.
                </div>
              </div>
            </div>

            <div className="payouts-section">
              <h3 className="payouts-title">Point System</h3>
              
              <div className="payouts-category">
                <h4 className="payouts-category-title">🎰 Triple Match (All 3 Match)</h4>
                <div className="payouts-list">
                  <div className="payout-item jackpot">
                    <span className="payout-symbols">7 7 7</span>
                    <span className="payout-amount">777 pts</span>
                  </div>
                  <div className="payout-item">
                    <span className="payout-symbols">💎 💎 💎</span>
                    <span className="payout-amount">200 pts</span>
                  </div>
                  <div className="payout-item">
                    <span className="payout-symbols">🍀 🍀 🍀</span>
                    <span className="payout-amount">100 pts</span>
                  </div>
                  <div className="payout-item">
                    <span className="payout-symbols">⭐ ⭐ ⭐</span>
                    <span className="payout-amount">75 pts</span>
                  </div>
                  <div className="payout-item">
                    <span className="payout-symbols">🔔 🔔 🔔</span>
                    <span className="payout-amount">50 pts</span>
                  </div>
                  <div className="payout-item">
                    <span className="payout-symbols">🍋 🍋 🍋</span>
                    <span className="payout-amount">30 pts</span>
                  </div>
                  <div className="payout-item">
                    <span className="payout-symbols">🍒 🍒 🍒</span>
                    <span className="payout-amount">20 pts</span>
                  </div>
                </div>
              </div>

              <div className="payouts-category">
                <h4 className="payouts-category-title">🎯 Double Match (2 Match)</h4>
                <div className="payouts-list">
                  <div className="payout-item small">
                    <span className="payout-symbols">7 7 (any position)</span>
                    <span className="payout-amount">25 pts</span>
                  </div>
                  <div className="payout-item small">
                    <span className="payout-symbols">💎 💎</span>
                    <span className="payout-amount">15 pts</span>
                  </div>
                  <div className="payout-item small">
                    <span className="payout-symbols">🍀 🍀</span>
                    <span className="payout-amount">10 pts</span>
                  </div>
                  <div className="payout-item small">
                    <span className="payout-symbols">⭐ ⭐</span>
                    <span className="payout-amount">8 pts</span>
                  </div>
                  <div className="payout-item small">
                    <span className="payout-symbols">🔔 🔔</span>
                    <span className="payout-amount">5 pts</span>
                  </div>
                  <div className="payout-item small">
                    <span className="payout-symbols">🍋 🍋</span>
                    <span className="payout-amount">3 pts</span>
                  </div>
                  <div className="payout-item small">
                    <span className="payout-symbols">🍒 🍒</span>
                    <span className="payout-amount">2 pts</span>
                  </div>
                </div>
              </div>

              <div className="payouts-category">
                <h4 className="payouts-category-title">⭐ Special Bonus</h4>
                <div className="payouts-list">
                  <div className="payout-item small">
                    <span className="payout-symbols">Single 7 (any position)</span>
                    <span className="payout-amount">5 pts</span>
                  </div>
                  <div className="payout-item small">
                    <span className="payout-symbols">No match</span>
                    <span className="payout-amount">0 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="game-nav slot-nav">
        <div className="nav-content">
          <button
            className="nav-tab"
            onClick={() => onNavigate?.("leaderboard")}
          >
            <span className="nav-icon"><Trophy size={20} /></span>
            <span className="nav-label">Ranks</span>
          </button>
          <button
            className="nav-tab active"
          >
            <span className="nav-icon"><Gamepad2 size={20} /></span>
            <span className="nav-label">Play</span>
          </button>
          <button
            className="nav-tab"
            onClick={() => onNavigate?.("profile")}
          >
            <span className="nav-icon"><User size={20} /></span>
            <span className="nav-label">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
