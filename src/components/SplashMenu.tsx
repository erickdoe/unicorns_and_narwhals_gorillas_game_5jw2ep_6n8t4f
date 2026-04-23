import React, { useState } from 'react';
import { Sparkles, Trophy, User, Users, Globe } from 'lucide-react';
import { Player } from '../types/game';

interface SplashMenuProps {
  onStartGame: () => void;
  onSelectMode: (mode: 'single' | 'multi' | 'online', roomId?: string) => void;
  winner?: Player | null;
}

const SplashMenu: React.FC<SplashMenuProps> = ({ onStartGame, onSelectMode, winner }) => {
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [roomId, setRoomId] = useState('');
  const isVictory = !!winner;

  const handleStartClick = () => {
    setShowModeSelection(true);
  };

  if (showRoomInput) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-lg bg-black/50 animate-fade-in">
        <div className="text-center p-12 rounded-3xl shadow-2xl border-4 border-white/40 bg-gradient-to-br from-indigo-700 to-purple-800 transform transition duration-500">
          <h2 className="text-4xl font-extrabold mb-6 text-white tracking-tight">Join Online Room</h2>
          <input 
            type="text" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID (e.g. magic-123)"
            className="w-full px-6 py-4 bg-white/20 border-2 border-white/30 rounded-xl text-white text-xl text-center focus:outline-none focus:border-yellow-400 transition-colors mb-6"
          />
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowRoomInput(false)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (roomId.trim()) {
                  onSelectMode('online', roomId.trim());
                }
              }}
              className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl transition-all shadow-lg"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

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

            <button
              onClick={() => {
                setShowModeSelection(false);
                setShowRoomInput(true);
              }}
              className="group flex flex-col items-center justify-center px-8 py-6 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-2xl transition-all duration-300 hover:scale-105 hover:border-yellow-400"
            >
              <Globe size={48} className="text-yellow-300 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">Online Duel</span>
              <span className="text-sm text-gray-300 mt-1">Play over Internet</span>
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
