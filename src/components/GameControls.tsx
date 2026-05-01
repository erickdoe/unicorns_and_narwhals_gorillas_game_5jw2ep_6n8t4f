import React, { useState, useCallback } from 'react';
import { Player } from '../types/game';

interface GameControlsProps {
  currentPlayer: Player;
  onLaunch: (angle: number, power: number) => void;
  wind: number;
  gameOver: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

const GameControls: React.FC<GameControlsProps> = ({ 
  currentPlayer, 
  onLaunch, 
  wind, 
  gameOver, 
  disabled, 
  disabledMessage = "Waiting..." 
}) => {
  const [angle, setAngle] = useState(0);
  const [power, setPower] = useState(0);

  const handleLaunch = useCallback(() => {
    if (gameOver || disabled) return;
    onLaunch(angle, power);
  }, [angle, power, onLaunch, gameOver, disabled]);

  const playerEmoji = currentPlayer.isUnicorn ? '🦄' : '🐳';
  const windValue = Math.round(wind);
  const absWind = Math.abs(windValue);
  let windArrow = '↔';

  if (windValue > 0) {
    windArrow = '→';
  } else if (windValue < 0) {
    windArrow = '←';
  }

  return (
    <div className={`w-full px-4 py-2 md:py-4 backdrop-blur-md bg-white/10 border-t border-white/20 transition-all duration-300 ${disabled ? 'opacity-70' : ''}`}>
      {!gameOver && (
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          {/* Top Row: Info & Wind */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg md:text-2xl">{playerEmoji}</span>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-bold text-white truncate max-w-[100px]">
                  {currentPlayer.name}
                </span>
                {disabled && (
                  <span className="text-[10px] text-yellow-300 font-medium animate-pulse">
                    {disabledMessage}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-[10px] md:text-xs font-bold bg-black/20 px-2 py-1 rounded uppercase tracking-wider">
                Wind: {absWind} {windArrow}
              </div>
              <button
                onClick={handleLaunch}
                className="px-4 py-1.5 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs md:text-sm font-black rounded-full shadow-lg transform transition active:scale-95 disabled:opacity-50"
                disabled={gameOver || disabled}
              >
                LAUNCH
              </button>
            </div>
          </div>

          {/* Bottom Row: Sliders (Side by Side on Mobile) */}
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-purple-200 uppercase">
                <span>Angle</span>
                <span>{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-blue-200 uppercase">
                <span>Power</span>
                <span>{power}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>
          </div>
        </div>
      )}
      
      {gameOver && (
        <div className="text-center py-1">
          <p className="text-sm font-bold text-white">
            Winner: {currentPlayer.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default GameControls;
