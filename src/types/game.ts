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
}

export interface GameState {
  players: Player[];
  projectiles: Projectile[];
  turn: number;
  wind: number;
  gameOver: boolean;
  winner: Player | null;
  landscape: number[]; // Added landscape height map
}
