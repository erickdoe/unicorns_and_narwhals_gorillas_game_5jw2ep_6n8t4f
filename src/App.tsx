import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import GameControls from './components/GameControls';
import SplashMenu from './components/SplashMenu';
import { Player } from './types/game';
import { Sparkles } from 'lucide-react';

// Utility to generate a random smooth landscape
const generateLandscape = (width: number, height: number) => {
  const landscape = new Array(width).fill(0);
  const groundBase = height * 0.7;
  const segments = 10;
  const segmentWidth = width / segments;
  
  // Generate random heights for key points
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    points.push({
      x: i * segmentWidth,
      y: groundBase + (Math.random() * 200 - 100), // Random variance
    });
  }

  // Linear interpolation between points to create the map
  for (let x = 0; x < width; x++) {
    const segmentIndex = Math.floor(x / segmentWidth);
    if (segmentIndex >= segments) {
      landscape[x] = points[segments].y;
      continue;
    }
    
    const p1 = points[segmentIndex];
    const p2 = points[segmentIndex + 1];
    const t = (x - p1.x) / (p2.x - p1.x);
    landscape[x] = p1.y + t * (p2.y - p1.y);
  }
  
  return landscape;
};

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [landscape, setLandscape] = useState<number[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [launchCommand, setLaunchCommand] = useState<{angle: number, power: number, id: number, playerId: number} | null>(null);
  const [wind, setWind] = useState(Math.random() * 2 - 1);

  const initializeGame = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight * 0.8;
    const TILE_SIZE = 32;
    
    // 1. Generate landscape first
    const newLandscape = generateLandscape(width, height);
    setLandscape(newLandscape);

    // 2. Position players on the generated landscape
    const p1X = 80;
    const p2X = width - 160;

    const initialPlayers: Player[] = [
      { 
        id: 1, 
        name: 'Spikehead', // Changed unicorn name
        color: '#9E7FFF', 
        x: p1X, 
        y: newLandscape[p1X] - TILE_SIZE, 
        health: 100, 
        isUnicorn: true 
      },
      { 
        id: 2, 
        name: 'Bluegills', // Changed narwhal name
        color: '#38bdf8', 
        x: p2X, 
        y: newLandscape[p2X] - TILE_SIZE, 
        health: 100, 
        isUnicorn: false 
      },
    ];

    setPlayers(initialPlayers);
    setCurrentPlayerIndex(0);
    setGameOver(false);
    setWinner(null);
    setShowSplash(false);
    setWind(Math.random() * 2 - 1);
    setLaunchCommand(null);
  }, []);

  const handleStartGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  const handleLaunch = useCallback((angle: number, power: number) => {
    const currentPlayer = players[currentPlayerIndex];
    setLaunchCommand({ 
      angle, 
      power, 
      id: Date.now(), 
      playerId: currentPlayer.id 
    });
    
    setWind(Math.random() * 2 - 1);
    setCurrentPlayerIndex(prevIndex => (prevIndex + 1) % players.length);
  }, [players, currentPlayerIndex]);

  const handlePlayerHit = useCallback((playerId: number) => {
    setPlayers(prev => {
      const newPlayers = prev.map(p => p.id === playerId ? { ...p, health: 0 } : p);
      const alivePlayers = newPlayers.filter(p => p.health > 0);
      if (alivePlayers.length === 1) {
        handleGameEnd(alivePlayers[0]);
      }
      return newPlayers;
    });
  }, []);

  const handleGameEnd = useCallback((winningPlayer: Player) => {
    setGameOver(true);
    setWinner(winningPlayer);
    setShowSplash(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // For simplicity, we restart the landscape on resize to avoid stretching
      initializeGame();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeGame]);

  const currentPlayerData = players.length > 0 ? players[currentPlayerIndex] : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-800 to-pink-700 text-white font-sans">
      <header className="absolute top-0 left-0 w-full z-20 p-4 flex items-center justify-between backdrop-blur-sm bg-white/5 shadow-md">
        <div className="flex items-center space-x-3">
          <Sparkles size={36} className="text-yellow-300 animate-pulse" />
          <h1 className="text-3xl font-extrabold tracking-tight">Unicorns & Narwhals</h1>
        </div>
        <nav className="flex space-x-4">
          <a href="#game" className="text-lg hover:text-pink-300 transition duration-300">Game</a>
          <a href="#rules" className="text-lg hover:text-pink-300 transition duration-300">Rules</a>
          <a href="#about" className="text-lg hover:text-pink-300 transition duration-300">About</a>
        </nav>
      </header>

      <main className="relative w-full h-screen flex flex-col items-center justify-center pt-20 pb-40">
        {!showSplash && players.length > 0 && (
          <>
            <GameCanvas
              players={players}
              landscape={landscape}
              launchCommand={launchCommand}
              onPlayerHit={handlePlayerHit}
              onGameEnd={handleGameEnd}
              wind={wind}
            />
            {currentPlayerData && (
              <GameControls
                key={currentPlayerIndex} 
                currentPlayer={currentPlayerData}
                onLaunch={handleLaunch}
                wind={wind} 
                gameOver={gameOver}
              />
            )}
          </>
        )}
        {showSplash && (
          <SplashMenu 
            onStartGame={handleStartGame} 
            winner={winner} 
          />
        )}
      </main>

      <section id="rules" className="relative w-full py-20 px-8 bg-gradient-to-br from-blue-800 to-cyan-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold mb-8 text-white">How to Play</h2>
          <ul className="list-disc list-inside text-left text-xl leading-relaxed text-gray-200 space-y-3 max-w-2xl mx-auto">
            <li>Choose your Unicorn or Narwhal!</li>
            <li>Adjust the angle and power to aim your magical projectile.</li>
            <li>Factor in the wind – it can help or hinder your shot!</li>
            <li>One hit and your opponent is out!</li>
            <li>Be the last creature standing to win!</li>
          </ul>
          <img src="https://images.pexels.com/photos/1642774/pexels-photo-1642774.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Game illustration" className="mt-12 rounded-xl shadow-xl w-full max-w-3xl mx-auto border-4 border-white/30"/>
        </div>
      </section>

      <section id="about" className="relative w-full py-20 px-8 bg-gradient-to-br from-purple-900 to-indigo-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold mb-8 text-white">About the Game</h2>
          <p className="text-xl leading-relaxed text-gray-200 max-w-2xl mx-auto">
            Welcome to Unicorns & Narwhals, a whimsical take on the classic artillery game! Engage in epic duels across fantastical landscapes.
          </p>
          <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Fantasy landscape" className="mt-12 rounded-xl shadow-xl w-full max-w-3xl mx-auto border-4 border-white/30"/>
        </div>
      </section>

      <footer className="relative z-10 p-8 text-center bg-black/30 backdrop-blur-sm">
        <p className="text-gray-300">&copy; 2025 Unicorns & Narwhals. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
