import React, { useRef, useEffect } from 'react';
import { Player, Projectile } from '../types/game';

interface GameCanvasProps {
  gameWidth: number;
  gameHeight: number;
  players: Player[];
  landscape: number[];
  launchCommand: { angle: number; power: number; id: number; playerId: number } | null;
  onPlayerHit: (playerId: number) => void;
  onProjectileLanded: (shotId: number) => void;
  onGameEnd: (winner: Player) => void;
  wind: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameWidth, gameHeight, players, landscape, launchCommand, onPlayerHit, onProjectileLanded, onGameEnd, wind }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  
  const callbacksRef = useRef({
    onPlayerHit,
    onProjectileLanded,
    onGameEnd
  });

  useEffect(() => {
    callbacksRef.current = { onPlayerHit, onProjectileLanded, onGameEnd };
  }, [onPlayerHit, onProjectileLanded, onGameEnd]);

  const gameStateRef = useRef({
    players: players,
    landscape: landscape,
    wind: wind,
    projectiles: [] as Projectile[],
    lastLaunchId: 0,
  });

  useEffect(() => {
    gameStateRef.current.players = players;
  }, [players]);

  useEffect(() => {
    gameStateRef.current.landscape = landscape;
  }, [landscape]);

  useEffect(() => {
    gameStateRef.current.wind = wind;
  }, [wind]);

  const TILE_SIZE = 32;
  const GRAVITY = 0.075; 
  const WIND_EFFECT = 0.02;

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x + TILE_SIZE / 2, player.y - 5);
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = projectile.color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const updateGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { players: currentPlayers, landscape: currentLandscape, wind: currentWind, projectiles } = gameStateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#87CEEB'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#228B22'; 
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x < currentLandscape.length; x++) {
      ctx.lineTo(x, currentLandscape[x]);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    currentPlayers.forEach(player => {
      if (player.health > 0) drawPlayer(ctx, player);
    });

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      
      p.vx += currentWind * WIND_EFFECT;
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      const mapX = Math.floor(p.x);
      
      // 1. Terrain Collision
      if (mapX >= 0 && mapX < currentLandscape.length) {
        if (p.y > currentLandscape[mapX]) {
          projectiles.splice(i, 1);
          callbacksRef.current.onProjectileLanded(p.shotId);
          continue;
        }
      } 
      
      // 2. Strict World Boundary Collision (Use gameWidth constant, not canvas.width)
      if (p.x < 0 || p.x > gameWidth) {
        projectiles.splice(i, 1);
        callbacksRef.current.onProjectileLanded(p.shotId);
        continue;
      }

      // 3. Player Collision
      let hit = false;
      for (const player of currentPlayers) {
        if (player.health <= 0) continue;
        if (player.id === p.ownerId) continue;

        if (
          p.x > player.x && p.x < player.x + TILE_SIZE &&
          p.y > player.y && p.y < player.y + TILE_SIZE
        ) {
          callbacksRef.current.onPlayerHit(player.id);
          hit = true;
          break;
        }
      }

      if (hit) {
        projectiles.splice(i, 1);
        callbacksRef.current.onProjectileLanded(p.shotId);
        continue;
      }

      drawProjectile(ctx, p);
    }

    animationFrameId.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    if (launchCommand && launchCommand.id !== gameStateRef.current.lastLaunchId) {
      gameStateRef.current.lastLaunchId = launchCommand.id;
      
      const activePlayer = players.find(p => p.id === launchCommand.playerId); 
      if (!activePlayer) return;

      const angleRad = launchCommand.angle * (Math.PI / 180);
      const powerScale = launchCommand.power / 5;

      const isFiringRight = activePlayer.x < gameWidth / 2;
      const vxMultiplier = isFiringRight ? 1 : -1;

      const newProjectile: Projectile = {
        x: activePlayer.x + TILE_SIZE / 2,
        y: activePlayer.y + TILE_SIZE / 2 - 10,
        vx: Math.cos(angleRad) * powerScale * vxMultiplier,
        vy: -Math.sin(angleRad) * powerScale,
        color: activePlayer.color,
        ownerId: activePlayer.id,
        shotId: launchCommand.id,
      };

      gameStateRef.current.projectiles.push(newProjectile);
    }
  }, [launchCommand, players, gameWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = gameWidth;
      canvas.height = gameHeight;
      
      if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(updateGame);
      }
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    };
  }, [gameWidth, gameHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full max-h-full object-contain"
    />
  );
};

export default GameCanvas;
