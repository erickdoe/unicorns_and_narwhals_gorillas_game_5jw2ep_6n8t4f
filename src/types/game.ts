export interface Player {
  id: number;
  name: string;
  color: string;
  x: number;
  y: number;
  health: number;
  isUnicorn: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  ownerId: number;
  shotId: number;
}

export interface GameState {
  players: Player[];
  projectiles: Projectile[];
  turn: number;
  wind: number;
  gameOver: boolean;
  winner: Player | null;
  landscape: number[];
}

export type OnlineEvent = 
  | { type: 'launch'; payload: { angle: number; power: number; playerId: number } }
  | { type: 'land'; payload: { playerId: number } }
  | { type: 'hit'; payload: { targetId: number } }
  | { type: 'init_game'; payload: { landscape: number[] } };
