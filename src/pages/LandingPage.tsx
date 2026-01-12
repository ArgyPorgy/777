import { ConnectWallet } from "../components/ConnectWallet";
import "./LandingPage.css";

export function LandingPage() {
  return (
    <main className="landing-container">
      <div className="landing-content">
        {/* Decorative elements */}
        <div className="deco-coins">
          <span className="coin coin-1">🪙</span>
          <span className="coin coin-2">💰</span>
          <span className="coin coin-3">🪙</span>
        </div>

        {/* Logo/Title */}
        <header className="landing-header">
          <div className="logo-container">
            <div className="slot-display">
              <span className="slot-number">7</span>
              <span className="slot-number">7</span>
              <span className="slot-number">7</span>
            </div>
          </div>
          
          <h1 className="landing-title">
            <span className="text-gold">Lucky Sevens</span>
          </h1>
          
          <p className="landing-subtitle">
            Spin daily • Climb the ranks • Win glory
          </p>
        </header>

        {/* Features */}
        <div className="features-row">
          <div className="feature-item">
            <span className="feature-icon">🎰</span>
            <span className="feature-text">1 Free Spin Daily</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏆</span>
            <span className="feature-text">Global Leaderboard</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⭐</span>
            <span className="feature-text">Earn Points</span>
          </div>
        </div>

        {/* Connect Section */}
        <section className="connect-section">
          <ConnectWallet />
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p className="footer-text">
            Built on <span className="text-gold">Base</span> • Powered by Farcaster
          </p>
        </footer>
      </div>
    </main>
  );
}




