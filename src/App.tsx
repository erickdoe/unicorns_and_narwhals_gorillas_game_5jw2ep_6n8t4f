import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import GameControls from './components/GameControls';
import SplashMenu from './components/SplashMenu';
import { Player } from './types/game';
import { Sparkles, RotateCw } from 'lucide-react';

// Fixed internal game resolution to prevent terrain regeneration on resize
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 600;

// Utility to generate a random smooth landscape
const generateLandscape = (width: number, height: number) => {
  const landscape = new Array(width).fill(0);
  const groundBase = height * 0.7;
  const segments = 10;
  const segmentWidth = width / segments;
  
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    points.push({
      x: i * segmentWidth,
      y: groundBase + (Math.random() * 200 - 100),
    });
  }

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

type GameMode = 'single' | 'multi' | null;

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [landscape, setLandscape] = useState<number[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [launchCommand, setLaunchCommand] = useState<{angle: number, power: number, id: number, playerId: number} | null>(null);
  const [wind, setWind] = useState(Math.random() * 2 - 1);
  const [isPortrait, setIsPortrait] = useState(false);
  
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const isInFlight = useRef(false);

  // Track orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const initializeGame = useCallback((mode: GameMode) => {
    const newLandscape = generateLandscape(GAME_WIDTH, GAME_HEIGHT);
    setLandscape(newLandscape);

    const TILE_SIZE = 32;
    const p1X = 80;
    const p2X = GAME_WIDTH - 160;

    const initialPlayers: Player[] = [
      { 
        id: 1, 
        name: 'Doodoo head', 
        color: '#9E7FFF', 
        x: p1X, 
        y: newLandscape[p1X] - TILE_SIZE, 
        health: 100, 
        isUnicorn: true 
      },
      { 
        id: 2, 
        name: 'Blowfish', 
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
    setGameMode(mode);
    setWind(Math.random() * 2 - 1);
    setLaunchCommand(null);
    isInFlight.current = false;
  }, []);

  const handleStartGame = useCallback(() => {
    // This now just triggers the mode selection in SplashMenu
  }, []);

  const handleSelectMode = useCallback((mode: GameMode) => {
    initializeGame(mode);
  }, [initializeGame]);

  const handleLaunch = useCallback((angle: number, power: number) => {
    const currentPlayer = players[currentPlayerIndex];
    setLaunchCommand({ 
      angle, 
      power, 
      id: Date.now(), 
      playerId: currentPlayer.id 
    });
    
    isInFlight.current = true;
    setWind(Math.random() * 2 - 1);
  }, [players, currentPlayerIndex]);

  const handleProjectileLanded = useCallback(() => {
    // Use the flight lock to ensure turns strictly alternate and only switch once per launch
    if (isInFlight.current) {
      isInFlight.current = false;
      setCurrentPlayerIndex(prevIndex => (prevIndex + 1) % players.length);
    }
  }, [players.length]);

  // AI Logic for Single Player
  useEffect(() => {
    if (gameMode === 'single' && currentPlayerIndex === 1 && !gameOver) {
      const aiTimer = setTimeout(() => {
        const aiPlayer = players[1];
        const targetPlayer = players[0];
        
        const dx = targetPlayer.x - aiPlayer.x;
        const dy = targetPlayer.y - aiPlayer.y;
        const distance = Math.abs(dx);
        
        let angle = 45 + (Math.random() * 20 - 10); 
        const basePower = (distance / 10) + (dy / 20);
        const windAdjustment = wind * 15;
        let power = basePower + windAdjustment + (Math.random() * 10 - 5);
        power = Math.max(10, Math.min(100, power));
        
        handleLaunch(angle, power);
      }, 1500);

      return () => clearTimeout(aiTimer);
    }
  }, [currentPlayerIndex, gameMode, gameOver, players, wind, handleLaunch]);

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
    setGameMode(null);
  }, []);

  const currentPlayerData = players.length > 0 ? players[currentPlayerIndex] : null;
  const isAiTurn = gameMode === 'single' && currentPlayerIndex === 1;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-800 to-pink-700 text-white font-sans">
      {/* Orientation Guard */}
      {isPortrait && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center">
          <div className="animate-bounce mb-4">
            <RotateCw size={64} className="text-yellow-300" />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-2">Landscape Mode Required</h2>
          <p className="text-lg text-gray-300">Please rotate your device to play Unicorns & Narwhals</p>
        </div>
      )}

      <header className="absolute top-0 left-0 w-full z-20 p-2 md:p-4 flex items-center justify-between backdrop-blur-sm bg-white/5 shadow-md">
        <div className="flex items-center space-x-2 md:space-x-3">
          <Sparkles size={24} className="text-yellow-300 animate-pulse md:w-9 md:h-9" />
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">Unicorns & Narwhals</h1>
        </div>
      </header>

      <main className="relative w-full h-screen flex flex-col">
        <div 
          ref={canvasContainerRef} 
          className={`flex-1 relative overflow-hidden flex items-center justify-center ${showSplash ? 'invisible' : 'visible'}`}
        >
          {!showSplash && players.length > 0 && (
            <GameCanvas
              gameWidth={GAME_WIDTH}
              gameHeight={GAME_HEIGHT}
              players={players}
              landscape={landscape}
              launchCommand={launchCommand}
              onPlayerHit={handlePlayerHit}
              onProjectileLanded={handleProjectileLanded}
              onGameEnd={handleGameEnd}
              wind={wind}
            />
          )}
        </div>

        {!showSplash && currentPlayerData && (
          <GameControls
            key={currentPlayerIndex} 
            currentPlayer={currentPlayerData}
            onLaunch={handleLaunch}
            wind={wind} 
            gameOver={gameOver}
            disabled={isAiTurn}
          />
        )}

        {showSplash && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <SplashMenu 
              onStartGame={handleStartGame} 
              onSelectMode={handleSelectMode}
              winner={winner} 
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
