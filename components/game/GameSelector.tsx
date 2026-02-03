'use client';

import React from 'react';
import { GameType } from '@/lib/game/types';

interface GameSelectorProps {
  currentGame: GameType;
  onSelectGame: (game: GameType) => void;
}

const games: { type: GameType; name: string; icon: string; available: boolean }[] = [
  { type: 'gomoku', name: '多人五子棋', icon: '⚫', available: true },
  { type: 'goose-duck', name: '鹅鸭杀', icon: '🦆', available: false },
  { type: 'shape-on', name: 'Shape On!', icon: '🔷', available: false },
];

export function GameSelector({ currentGame, onSelectGame }: GameSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-xl p-2">
      {games.map(game => (
        <button
          key={game.type}
          onClick={() => game.available && onSelectGame(game.type)}
          disabled={!game.available}
          className={`
            relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${currentGame === game.type
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : game.available
                ? 'bg-[#2D2D2D] text-gray-300 hover:bg-[#3D3D3D]'
                : 'bg-[#2D2D2D]/50 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          <span className="text-lg">{game.icon}</span>
          <span>{game.name}</span>
          {!game.available && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
