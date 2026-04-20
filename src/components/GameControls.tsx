import React, { useState, useCallback } from 'react';
import { Player } from '../types/game';

interface GameControlsProps {
  currentPlayer: Player;
  onLaunch: (angle: number, power: number) => void;
  wind: number;
  gameOver: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({ currentPlayer, onLaunch, wind, gameOver }) => {
  const [angle, setAngle] = useState(0);
  const [power, setPower] = useState(0);

  const handleLaunch = useCallback(() => {
    if (gameOver) return;
    onLaunch(angle, power);
  }, [angle, power, onLaunch, gameOver]);

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
    <div className="w-full p-2 md:p-6 backdrop-blur-md bg-white/10 shadow-lg border-t border-white/20 transition-all duration-300">
      {!gameOver && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 max-w-6xl mx-auto">
          {/* Player Info - Compact on mobile */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xl md:text-2xl">{playerEmoji}</span>
            <span className="text-sm md:text-lg font-bold text-white truncate max-w-[80px] md:max-w-none">
              {currentPlayer.name}
            </span>
          </div>

          {/* Controls Group - Horizontal on mobile */}
          <div className="flex flex-row md:flex-col items-center justify-center gap-4 md:gap-2 w-full max-w-md">
            <div className="flex items-center space-x-2 w-full">
              <label htmlFor="angle" className="text-xs md:text-white md:font-semibold whitespace-nowrap">
                Ang: {angle}°
              </label>
              <input
                id="angle"
                type="range"
                min="0"
                max="90"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full h-1.5 md:h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #a78bfa ${angle}%, #f472b6 ${angle}%)` }}
              />
            </div>
            <div className="flex items-center space-x-2 w-full">
              <label htmlFor="power" className="text-xs md:text-white md:font-semibold whitespace-nowrap">
                Pow: {power}%
              </label>
              <input
                id="power"
                type="range"
                min="0"
                max="100"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
                className="w-full h-1.5 md:h-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #60a5fa ${power}%, #22d3ee ${power}%)` }}
              />
            </div>
          </div>

          {/* Wind and Launch - Compact on mobile */}
          <div className="flex items-center justify-between md:justify-end space-x-4 shrink-0">
            <div className="flex items-center space-x-1">
              <span className="text-xs md:text-white md:font-semibold">
                Wind: {absWind} <span className="text-lg md:text-2xl ml-1">{windArrow}</span>
              </span>
            </div>
            <button
              onClick={handleLaunch}
              className="px-3 py-1 md:px-6 md:py-2 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs md:text-base font-bold rounded-full shadow-lg transform transition duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
              disabled={gameOver}
            >
              Launch!
            </button>
          </div>
        </div>
      )}
      {gameOver && (
        <div className="text-center py-2">
          <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4">Game Over!</h2>
          <p className="text-lg md:text-2xl font-semibold text-white">
            Winner: {currentPlayer.name} ({currentPlayer.isUnicorn ? 'Unicorn' : 'Narwhal'})
          </p>
        </div>
      )}
    </div>
  );
};

export default GameControls;
