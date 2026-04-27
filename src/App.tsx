import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import GameControls from './components/GameControls';
import SplashMenu from './components/SplashMenu';
import { Player } from './types/game';
import { Sparkles, RotateCw } from 'lucide-react';
import { supabase } from './lib/supabase';

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

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

type GameMode = 'single' | 'multi' | 'online' | null;

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
  
  const [myPlayerIndex, setMyPlayerIndex] = useState<number | null>(null);
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  
  const [isInFlight, setIsInFlight] = useState(false);
  
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const supabaseChannel = useRef<any>(null);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const snapPlayersToTerrain = useCallback((currentLandscape: number[], currentPlayers: Player[]) => {
    return currentPlayers.map(player => {
      const terrainY = currentLandscape[Math.floor(player.x + TILE_SIZE / 2)] || GAME_HEIGHT;
      return {
        ...player,
        y: terrainY - TILE_SIZE
      };
    });
  }, []);

  const handleGameEnd = useCallback((winningPlayer: Player) => {
    setGameOver(true);
    setWinner(winningPlayer);
    setShowSplash(true);
    setGameMode(null);
  }, []);

  const handlePlayerHit = useCallback((playerId: number) => {
    setPlayers(prev => {
      const newPlayers = prev.map(p => p.id === playerId ? { ...p, health: 0 } : p);
      const alivePlayers = newPlayers.filter(p => p.health > 0);
      if (alivePlayers.length === 1) {
        handleGameEnd(alivePlayers[0]);
      }
      return newPlayers;
    });
  }, [handleGameEnd]);

  const handleProjectileLanded = useCallback(() => {
    setIsInFlight(false);
    // Only update index locally if NOT in online mode
    if (gameMode !== 'online') {
      setCurrentPlayerIndex(prevIndex => (prevIndex + 1) % players.length);
    }
  }, [players.length, gameMode]);

  const handleOnlineProjectileLanded = useCallback(() => {
    if (gameMode === 'online' && supabaseChannel.current && currentPlayerIndex === myPlayerIndex) {
      const nextIndex = (currentPlayerIndex + 1) % players.length;
      supabaseChannel.current.send({
        type: 'broadcast',
        event: 'turn_change',
        payload: { nextIndex }
      });
    }
    handleProjectileLanded();
  }, [gameMode, currentPlayerIndex, myPlayerIndex, players, handleProjectileLanded]);

  const handleOnlinePlayerHit = useCallback((playerId: number) => {
    if (gameMode === 'online' && supabaseChannel.current && currentPlayerIndex === myPlayerIndex) {
      supabaseChannel.current.send({
        type: 'broadcast',
        event: 'hit',
        payload: { targetId: playerId }
      });
    }
    handlePlayerHit(playerId);
  }, [gameMode, currentPlayerIndex, myPlayerIndex, handlePlayerHit]);

  const leaveOnlineRoom = useCallback(async (roomId: string) => {
    if (!roomId) return;
    
    const { data: roomData } = await supabase
      .from('game_rooms')
      .select('player_count')
      .eq('id', roomId)
      .single();

    const currentCount = roomData?.player_count || 0;
    const newCount = Math.max(0, currentCount - 1);

    if (newCount === 0) {
      await supabase.from('game_rooms').delete().eq('id', roomId);
    } else {
      await supabase.from('game_rooms').update({ player_count: newCount }).eq('id', roomId);
    }
  }, []);

  const setupOnlineGame = useCallback(async (roomId: string, currentLandscape: number[]) => {
    const userId = Math.random().toString(36).substring(7);
    
    const { data: roomData } = await supabase
      .from('game_rooms')
      .select('player_count, landscape')
      .eq('id', roomId)
      .single();

    const currentCount = roomData?.player_count || 0;
    const newCount = currentCount + 1;
    const existingLandscape = roomData?.landscape ? JSON.parse(roomData.landscape) : null;

    const landscapeToSave = currentCount === 0 ? JSON.stringify(currentLandscape) : roomData?.landscape;
    
    if (existingLandscape) {
      setLandscape(existingLandscape);
      setPlayers(prev => snapPlayersToTerrain(existingLandscape, prev));
    }

    await supabase.from('game_rooms').upsert({ 
      id: roomId, 
      player_count: newCount,
      landscape: landscapeToSave,
      status: newCount >= 2 ? 'playing' : 'waiting'
    });

    if (newCount >= 2) {
      setOpponentJoined(true);
    }

    supabase
      .channel(`room_status_${roomId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'game_rooms', 
        filter: `id=eq.${roomId}` 
      }, (payload) => {
        if (payload.new.player_count >= 2) {
          setOpponentJoined(true);
        }
      })
      .subscribe();

    const channel = supabase.channel(roomId);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.entries(state)
          .map(([id, data]) => ({
            id,
            ...data[0]
          }))
          .sort((a, b) => (a.userId || '').localeCompare(b.userId || ''));
        
        if (users.length > 0) {
          const index = users.findIndex(u => u.userId === userId);
          if (index !== -1) {
            setMyPlayerIndex(index);
          }
          
          if (users.length >= 2) {
            setOpponentJoined(true);
          }
        }
      })
      .on('broadcast', { event: 'launch' }, ({ payload }) => {
        const { angle, power, playerId } = payload;
        setLaunchCommand({
          angle,
          power,
          id: Date.now(),
          playerId
        });
        setIsInFlight(true);
      })
      .on('broadcast', { event: 'turn_change' }, ({ payload }) => {
        const { nextIndex } = payload;
        setCurrentPlayerIndex(nextIndex);
        setIsInFlight(false);
      })
      .on('broadcast', { event: 'hit' }, ({ payload }) => {
        const { targetId } = payload;
        handlePlayerHit(targetId);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            userId: userId, 
            online_at: new Date().toISOString() 
          });
        }
      });

    supabaseChannel.current = channel;
  }, [handleProjectileLanded, handlePlayerHit, snapPlayersToTerrain]);

  const initializeGame = useCallback((mode: GameMode, roomId?: string) => {
    const newLandscape = generateLandscape(GAME_WIDTH, GAME_HEIGHT);
    setLandscape(newLandscape);

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
    setIsInFlight(false);

    if (mode === 'online' && roomId) {
      setOnlineRoomId(roomId);
      setupOnlineGame(roomId, newLandscape);
    }
  }, [setupOnlineGame]);

  const handleStartGame = useCallback(() => {}, []);

  const handleSelectMode = useCallback((mode: GameMode, roomId?: string) => {
    if (onlineRoomId) {
      leaveOnlineRoom(onlineRoomId);
    }
    initializeGame(mode, roomId);
  }, [initializeGame, onlineRoomId, leaveOnlineRoom]);

  const handleLaunch = useCallback((angle: number, power: number) => {
    if (isInFlight) return;

    const currentPlayer = players[currentPlayerIndex];
    
    setLaunchCommand({ 
      angle, 
      power, 
      id: Date.now(), 
      playerId: currentPlayer.id 
    });
    
    setIsInFlight(true);
    setWind(Math.random() * 2 - 1);

    if (gameMode === 'online' && supabaseChannel.current) {
      supabaseChannel.current.send({
        type: 'broadcast',
        event: 'launch',
        payload: { angle, power, playerId: currentPlayer.id }
      });
    }
  }, [players, currentPlayerIndex, gameMode, isInFlight]);

  useEffect(() => {
    if (gameMode === 'single' && currentPlayerIndex === 1 && !gameOver && !isInFlight) {
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
  }, [currentPlayerIndex, gameMode, gameOver, players, wind, handleLaunch, isInFlight]);

  useEffect(() => {
    return () => {
      if (onlineRoomId) {
        leaveOnlineRoom(onlineRoomId);
      }
    };
  }, [onlineRoomId, leaveOnlineRoom]);

  const currentPlayerData = players.length > 0 ? players[currentPlayerIndex] : null;
  const isAiTurn = gameMode === 'single' && currentPlayerIndex === 1;
  const isOnlineLobby = gameMode === 'online' && !opponentJoined;
  const isMyTurn = gameMode === 'online' && currentPlayerIndex === myPlayerIndex;

  const getDisabledMessage = () => {
    if (isInFlight) return "Projectile in flight...";
    if (gameMode === 'single' && isAiTurn) return "Computer is thinking...";
    if (gameMode === 'online') {
      if (myPlayerIndex === null) return "Connecting to room...";
      if (!isMyTurn) return "Waiting for opponent...";
    }
    return "Waiting...";
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-800 to-pink-700 text-white font-sans">
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
        {gameMode === 'online' && (
          <div className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Room: {onlineRoomId}
          </div>
        )}
      </header>

      <main className="relative w-full h-screen flex flex-col">
        <div 
          ref={canvasContainerRef} 
          className={`flex-1 relative overflow-hidden flex items-center justify-center ${showSplash || isOnlineLobby ? 'invisible' : 'visible'}`}
        >
          {!showSplash && !isOnlineLobby && players.length > 0 && (
            <GameCanvas
              gameWidth={GAME_WIDTH}
              gameHeight={GAME_HEIGHT}
              players={players}
              landscape={landscape}
              launchCommand={launchCommand}
              onPlayerHit={gameMode === 'online' ? handleOnlinePlayerHit : handlePlayerHit}
              onProjectileLanded={gameMode === 'online' ? handleOnlineProjectileLanded : handleProjectileLanded}
              onGameEnd={handleGameEnd}
              wind={wind}
            />
          )}
        </div>

        {!showSplash && !isOnlineLobby && currentPlayerData && (
          <GameControls
            key={currentPlayerIndex} 
            currentPlayer={currentPlayerData}
            onLaunch={handleLaunch}
            wind={wind} 
            gameOver={gameOver}
            disabled={isInFlight || isAiTurn || (gameMode === 'online' && !isMyTurn)}
            disabledMessage={getDisabledMessage()}
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

        {isOnlineLobby && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center p-8 bg-white/10 rounded-3xl border-2 border-white/20 animate-pulse">
              <h2 className="text-3xl font-bold mb-2">Waiting for Opponent...</h2>
              <p className="text-gray-300">Share your Room ID with a friend to start the duel!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
