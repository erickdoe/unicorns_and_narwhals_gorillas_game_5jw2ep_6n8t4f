import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { Player } from '../types/game';

interface SplashMenuProps {
  onStartGame: () => void;
  winner?: Player | null;
}

const SplashMenu: React.FC<SplashMenuProps> = ({ onStartGame, winner }) => {
  const isVictory = !!winner;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-lg bg-black/50 animate-fade-in">
      <div className={`text-center p-12 rounded-3xl shadow-2xl border-4 border-white/40 transform transition duration-500 hover:scale-105 ${
        isVictory 
          ? 'bg-gradient-to-br from-yellow-600 to-orange-700' 
          : 'bg-gradient-to-br from-purple-700 to-pink-800'
      }`}>
        <div className="mb-6 animate-bounce">
          {isVictory ? (
            <Trophy size={72} className="text-yellow-300 inline-block" />
          ) : (
            <Sparkles size={72} className="text-yellow-300 inline-block" />
          )}
        </div>
        
        <h1 className="text-6xl font-extrabold mb-4 text-white tracking-tight">
          {isVictory ? `${winner?.name} WINS!` : 'Unicorns & Narwhals'}
        </h1>
        
        <p className="text-2xl font-semibold text-yellow-300 mb-8">
          {isVictory ? 'A magical victory achieved!' : 'The Ultimate Magical Duel!'}
        </p>
        
        <button
          onClick={onStartGame}
          className="px-12 py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full shadow-xl transform transition duration-300 hover:scale-110 text-2xl tracking-wide focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-opacity-50"
        >
          {isVictory ? 'Play Again?' : 'Start New Game'}
        </button>
      </div>
    </div>
  );
};

export default SplashMenu;
