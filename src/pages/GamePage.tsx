import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useGameState } from "../hooks/useGameState";
import { SlotMachine } from "../components/SlotMachine";
import { Leaderboard } from "../components/Leaderboard";
import { Profile } from "../components/Profile";
import { Trophy, Gamepad2, User } from "lucide-react";
import "./GamePage.css";

type Tab = "leaderboard" | "game" | "profile";

export function GamePage() {
  const [activeTab, setActiveTab] = useState<Tab>("game");
  const { address, disconnect } = useWallet();
  const gameStateHook = useGameState(address);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "leaderboard", label: "Ranks", icon: <Trophy size={20} /> },
    { id: "game", label: "Play", icon: <Gamepad2 size={20} /> },
    { id: "profile", label: "Profile", icon: <User size={20} /> },
  ];

  // For game tab, render full screen slot machine
  if (activeTab === "game") {
    return <SlotMachine {...gameStateHook} onNavigate={setActiveTab} />;
  }

  return (
    <div className="game-page">
      {/* Header */}
      <header className="game-header">
        <div className="header-content">
          <div className="header-logo">
            <span className="logo-777">777</span>
          </div>
          <div className="header-points">
            <span className="points-label">Points</span>
            <span className="points-value">{gameStateHook.gameState.totalPoints.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="game-main">
        {activeTab === "leaderboard" && (
          <Leaderboard 
            entries={gameStateHook.leaderboard} 
            currentAddress={address} 
          />
        )}
        
        {activeTab === "profile" && (
          <Profile 
            address={address}
            gameState={gameStateHook.gameState}
            userRank={gameStateHook.getUserRank()}
            onDisconnect={disconnect}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="game-nav">
        <div className="nav-content">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

