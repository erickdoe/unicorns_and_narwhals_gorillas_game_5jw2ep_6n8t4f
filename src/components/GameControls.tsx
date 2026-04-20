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

  // Format wind to an absolute integer and determine arrow direction
  const windValue = Math.round(wind);
  const absWind = Math.abs(windValue);
  let windArrow = '↔';

  if (windValue > 0) {
    windArrow = '→';
  } else if (windValue < 0) {
    windArrow = '←';
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg p-6 rounded-xl backdrop-blur-sm bg-white/10 shadow-lg border border-white/20 flex flex-col items-center space-y-4">
      {!gameOver && (
        <>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{playerEmoji}</span>
              <span className="text-lg font-bold text-white">
                {currentPlayer.name}
              </span>
            </div>
          </div>

          <div className="w-full flex flex-col items-center space-y-2">
            <div className="w-full flex justify-between items-center">
              <label htmlFor="angle" className="text-white font-semibold">Angle: {angle}°</label>
              <input
                id="angle"
                type="range"
                min="0"
                max="90"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-1/2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #a78bfa ${angle}%, #f472b6 ${angle}%)` }}
              />
            </div>
            <div className="w-full flex justify-between items-center">
              <label htmlFor="power" className="text-white font-semibold">Power: {power}%</label>
              <input
                id="power"
                type="range"
                min="0"
                max="100"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
                className="w-1/2 h-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #60a5fa ${power}%, #22d3ee ${power}%)` }}
              />
            </div>
          </div>

          <div className="w-full flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-white font-semibold">
                Wind: {absWind} <span className="text-2xl ml-1">{windArrow}</span>
              </span>
            </div>
            <button
              onClick={handleLaunch}
              className="px-6 py-2 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-full shadow-lg transform transition duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={gameOver}
            >
              Launch!
            </button>
          </div>
        </>
      )}
      {gameOver && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
          <p className="text-2xl font-semibold text-white">
            Winner: {currentPlayer.name} ({currentPlayer.isUnicorn ? 'Unicorn' : 'Narwhal'})
          </p>
        </div>
      )}
    </div>
  );
};

export default GameControls;
