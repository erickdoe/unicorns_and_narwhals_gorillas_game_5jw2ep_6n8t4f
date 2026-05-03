import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import GameControls from './components/GameControls';
import SplashMenu from './components/SplashMenu';
import { Player } from './types/game';
import { Sparkles, RotateCw, User, ShieldCheck } from 'lucide-react';
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
  const [launchCommand, setLaunchCommand] = useState<{angle: number, power: number, id: number, playerId: number, wind: number} | null>(null);
  const [wind, setWind] = useState(Math.random() * 2 - 1);
  const [isPortrait, setIsPortrait] = useState(false);
  
  const [myPlayerIndex, setMyPlayerIndex] = useState<number | null>(null);
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [isInFlight, setIsInFlight] = useState(false);
  
  const supabaseChannel = useRef<any>(null);
  const userIdRef = useRef(Math.random().toString(36).substring(7));
  const launchLock = useRef(false);

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
    setTimeout(() => {
      setIsInFlight(false);
      if (gameMode !== 'online') {
        setCurrentPlayerIndex(prevIndex => (prevIndex + 1) % players.length);
      }
    }, 150);
  }, [players.length, gameMode]);

  const handleOnlineProjectileLanded = useCallback(async () => {
    if (gameMode === 'online' && onlineRoomId && currentPlayerIndex === myPlayerIndex) {
      const nextIndex = (currentPlayerIndex + 1) % players.length;
      
      try {
        await supabase
          .from('game_rooms')
          .update({ current_turn: nextIndex })
          .eq('id', onlineRoomId);
      } catch (error) {
        console.error("Failed to update turn in DB:", error);
      }
    }
    
    if (gameMode !== 'online') {
      handleProjectileLanded();
    }
  }, [gameMode, currentPlayerIndex, myPlayerIndex, players.length, handleProjectileLanded, onlineRoomId]);

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
    if (supabaseChannel.current) {
      supabaseChannel.current.unsubscribe();
      supabaseChannel.current = null;
    }
    
    const { data: roomData } = await supabase
      .from('game_rooms')
      .select('player_count')
      .eq('id', roomId)
      .single();

    if (roomData) {
      const newCount = Math.max(0, roomData.player_count - 1);
      if (newCount === 0) {
        await supabase.from('game_rooms').delete().eq('id', roomId);
      } else {
        await supabase.from('game_rooms').update({ player_count: newCount }).eq('id', roomId);
      }
    }
  }, []);

  const setupOnlineGame = useCallback(async (roomId: string, currentLandscape: number[]) => {
    const { data: roomData } = await supabase
      .from('game_rooms')
      .select('player_count, landscape, current_turn')
      .eq('id', roomId)
      .single();

    const currentCount = roomData?.player_count || 0;
    const newCount = currentCount + 1;
    const existingLandscape = roomData?.landscape ? JSON.parse(roomData.landscape) : null;
    const initialTurn = roomData?.current_turn ?? 0;

    if (existingLandscape) {
      setLandscape(existingLandscape);
      setPlayers(prev => snapPlayersToTerrain(existingLandscape, prev));
    }
    
    setCurrentPlayerIndex(initialTurn);

    await supabase.from('game_rooms').upsert({ 
      id: roomId, 
      player_count: newCount,
      landscape: currentCount === 0 ? JSON.stringify(currentLandscape) : roomData?.landscape,
      current_turn: initialTurn,
      status: newCount >= 2 ? 'playing' : 'waiting'
    });

    const channel = supabase.channel(roomId);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.entries(state)
          .map(([id, data]) => ({ id, ...data[0] }))
          .sort((a, b) => (a.userId || '').localeCompare(b.userId || ''));
        
        const index = users.findIndex(u => u.userId === userIdRef.current);
        if (index !== -1) setMyPlayerIndex(index);
        if (users.length >= 2) setOpponentJoined(true);
      })
      .on('broadcast', { event: 'launch' }, ({ payload }) => {
        // Sync wind from the launcher to ensure identical trajectories
        setWind(payload.wind);
        setLaunchCommand({ ...payload, id: Date.now() });
        setIsInFlight(true);
      })
      .on('broadcast', { event: 'hit' }, ({ payload }) => {
        handlePlayerHit(payload.targetId);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: userIdRef.current, online_at: new Date().toISOString() });
        }
      });

    supabase
      .channel('db-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'game_rooms', 
        filter: `id=eq.${roomId}` 
      }, (payload) => {
        if (payload.new.current_turn !== undefined) {
          setCurrentPlayerIndex(payload.new.current_turn);
          setIsInFlight(false);
          launchLock.current = false;
        }
      })
      .subscribe();

    supabaseChannel.current = channel;
  }, [handlePlayerHit, snapPlayersToTerrain]);

  const initializeGame = useCallback((mode: GameMode, roomId?: string) => {
    const newLandscape = generateLandscape(GAME_WIDTH, GAME_HEIGHT);
    setLandscape(newLandscape);

    const initialPlayers: Player[] = [
      { id: 1, name: 'Doodoo head', color: '#9E7FFF', x: 80, y: 0, health: 100, isUnicorn: true },
      { id: 2, name: 'Blowfish', color: '#38bdf8', x: GAME_WIDTH - 160, y: 0, health: 100, isUnicorn: false },
    ];

    const snappedPlayers = snapPlayersToTerrain(newLandscape, initialPlayers);
    setPlayers(snappedPlayers);
    setCurrentPlayerIndex(0);
    setGameOver(false);
    setWinner(null);
    setShowSplash(false);
    setGameMode(mode);
    setWind(Math.random() * 2 - 1);
    setLaunchCommand(null);
    setIsInFlight(false);
    launchLock.current = false;

    if (mode === 'online' && roomId) {
      setOnlineRoomId(roomId);
      setupOnlineGame(roomId, newLandscape);
    }
  }, [setupOnlineGame, snapPlayersToTerrain]);

  const handleSelectMode = useCallback((mode: GameMode, roomId?: string) => {
    if (onlineRoomId) leaveOnlineRoom(onlineRoomId);
    initializeGame(mode, roomId);
  }, [initializeGame, onlineRoomId, leaveOnlineRoom]);

  const isMyTurn = gameMode === 'online' ? currentPlayerIndex === myPlayerIndex : true;

  const handleLaunch = useCallback((angle: number, power: number) => {
    if (isInFlight || launchLock.current || (gameMode === 'online' && !isMyTurn)) return;

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    // Lock immediately to prevent double-firing
    launchLock.current = true;
    setIsInFlight(true);

    // Determine wind for this specific shot
    const shotWind = Math.random() * 2 - 1;
    setWind(shotWind);

    setLaunchCommand({ 
      angle, 
      power, 
      id: Date.now(), 
      playerId: currentPlayer.id,
      wind: shotWind 
    });

    if (gameMode === 'online' && supabaseChannel.current) {
      supabaseChannel.current.send({
        type: 'broadcast',
        event: 'launch',
        payload: { angle, power, playerId: currentPlayer.id, wind: shotWind }
      });
    }
  }, [players, currentPlayerIndex, gameMode, isInFlight, isMyTurn]);

  useEffect(() => {
    if (gameMode === 'single' && currentPlayerIndex === 1 && !gameOver && !isInFlight) {
      const aiTimer = setTimeout(() => {
        const aiPlayer = players[1];
        const targetPlayer = players[0];
        if (!aiPlayer || !targetPlayer) return;
        handleLaunch(45 + (Math.random() * 20 - 10), (Math.abs(targetPlayer.x - aiPlayer.x) / 10) + (wind * 15) + 20);
      }, 1500);
      return () => clearTimeout(aiTimer);
    }
  }, [currentPlayerIndex, gameMode, gameOver, players, wind, handleLaunch, isInFlight]);

  const currentPlayerData = players[currentPlayerIndex];
  const isAiTurn = gameMode === 'single' && currentPlayerIndex === 1;
  const isOnlineLobby = gameMode === 'online' && !opponentJoined;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-purple-800 to-pink-700 text-white font-sans flex flex-col">
      {isPortrait && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center">
          <RotateCw size={64} className="text-yellow-300 animate-spin-slow mb-4" />
          <h2 className="text-2xl font-bold">Landscape Mode Required</h2>
        </div>
      )}

      <header className="shrink-0 z-20 p-3 flex items-center justify-between backdrop-blur-sm bg-white/5">
        <div className="flex items-center space-x-2">
          <Sparkles size={18} className="text-yellow-300" />
          <h1 className="text-sm md:text-xl font-extrabold tracking-tight">Unicorns & Narwhals</h1>
        </div>
        {gameMode === 'online' && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30 text-[10px] font-bold">
              <ShieldCheck size={12} className="text-green-400" />
              <span>P{myPlayerIndex !== null ? myPlayerIndex + 1 : '?'}</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative flex flex-col min-h-0">
        <div className={`flex-1 relative flex items-center justify-center min-h-0 ${showSplash || isOnlineLobby ? 'invisible' : 'visible'}`}>
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
          <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20">
              <User size={10} />
              <span>{currentPlayerData.name}'s Turn</span>
            </div>
          </div>
        )}

        {!showSplash && !isOnlineLobby && currentPlayerData && (
          <div className="shrink-0">
            <GameControls
              key={currentPlayerIndex} 
              currentPlayer={currentPlayerData}
              onLaunch={handleLaunch}
              wind={wind} 
              gameOver={gameOver}
              disabled={isInFlight || isAiTurn || (gameMode === 'online' && !isMyTurn)}
              disabledMessage={isInFlight ? "In Flight..." : !isMyTurn ? "Opponent's Turn" : "Waiting..."}
            />
          </div>
        )}

        {showSplash && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <SplashMenu onStartGame={() => {}} onSelectMode={handleSelectMode} winner={winner} />
          </div>
        )}

        {isOnlineLobby && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center p-6 bg-white/10 rounded-3xl border-2 border-white/20 animate-pulse">
              <h2 className="text-xl font-bold mb-1">Waiting for Opponent...</h2>
              <p className="text-xs text-gray-300">Room: <span className="text-white font-mono font-bold">{onlineRoomId}</span></p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
