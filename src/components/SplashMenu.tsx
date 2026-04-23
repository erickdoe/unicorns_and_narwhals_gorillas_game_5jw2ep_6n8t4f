import React, { useState } from 'react';
import { Sparkles, Trophy, User, Users } from 'lucide-react';
import { Player } from '../types/game';

interface SplashMenuProps {
  onStartGame: () => void;
  onSelectMode: (mode: 'single' | 'multi') => void;
  winner?: Player | null;
}

const SplashMenu: React.FC<SplashMenuProps> = ({ onStartGame, onSelectMode, winner }) => {
  const [showModeSelection, setShowModeSelection] = useState(false);
  const isVictory = !!winner;

  const handleStartClick = () => {
    if (!isVictory) {
      setShowModeSelection(true);
    } else {
      // If it's a victory screen, we just reset and show mode selection
      setShowModeSelection(true);
    }
  };

  if (showModeSelection) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-lg bg-black/50 animate-fade-in">
        <div className="text-center p-12 rounded-3xl shadow-2xl border-4 border-white/40 bg-gradient-to-br from-indigo-700 to-purple-800 transform transition duration-500">
          <h2 className="text-5xl font-extrabold mb-8 text-white tracking-tight">Select Game Mode</h2>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button
              onClick={() => {
                setShowModeSelection(false);
                onSelectMode('single');
              }}
              className="group flex flex-col items-center justify-center px-8 py-6 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-2xl transition-all duration-300 hover:scale-105 hover:border-yellow-400"
            >
              <User size={48} className="text-yellow-300 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">Single Player</span>
              <span className="text-sm text-gray-300 mt-1">You vs Computer</span>
            </button>

            <button
              onClick={() => {
                setShowModeSelection(false);
                onSelectMode('multi');
              }}
              className="group flex flex-col items-center justify-center px-8 py-6 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-2xl transition-all duration-300 hover:scale-105 hover:border-yellow-400"
            >
              <Users size={48} className="text-yellow-300 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">Two Player</span>
              <span className="text-sm text-gray-300 mt-1">Local Duel</span>
            </button>
          </div>

          <button 
            onClick={() => setShowModeSelection(false)}
            className="mt-8 text-gray-400 hover:text-white transition-colors underline underline-offset-4"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

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
          onClick={handleStartClick}
          className="px-12 py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full shadow-xl transform transition duration-300 hover:scale-110 text-2xl tracking-wide focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-opacity-50"
        >
          {isVictory ? 'Play Again?' : 'Start New Game'}
        </button>
      </div>
    </div>
  );
};

export default SplashMenu;
