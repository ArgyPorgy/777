import { useEffect, useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { GamePage } from "./pages/GamePage";
import { Loader } from "./components/Loader";
import { initFarcasterMiniApp } from "./config/farcaster";
import { useWallet } from "./hooks/useWallet";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useWallet();

  useEffect(() => {
    // Initialize Farcaster mini app
    initFarcasterMiniApp();

    // Show loader for 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  // Show landing page if not connected, game page if connected
  return isConnected ? <GamePage /> : <LandingPage />;
}

export default App;
