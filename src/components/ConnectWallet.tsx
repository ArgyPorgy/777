import { useWallet } from "../hooks/useWallet";
import "./ConnectWallet.css";

export function ConnectWallet() {
  const { connect, connectors, isConnecting } = useWallet();

  const handleConnect = () => {
    if (connectors && connectors[0]) {
      connect({ connector: connectors[0] });
    } else {
      // Fallback for testing outside Farcaster
      console.warn("No wallet connector found - running outside Farcaster?");
    }
  };

  return (
    <div className="connect-wallet-container">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`connect-wallet-btn ${isConnecting ? "loading" : ""}`}
      >
        {isConnecting ? (
          <>
            <span className="spinner"></span>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span className="wallet-icon">🎰</span>
            <span>Connect Wallet to Play</span>
          </>
        )}
      </button>
      
      <p className="connect-hint">
        Connect your Farcaster wallet to start spinning
      </p>
    </div>
  );
}






