'use client';

import React from 'react';

interface HeaderProps {
  roomId: string;
  participantCount: number;
  isGameMode: boolean;
}

export function Header({ roomId, participantCount, isGameMode }: HeaderProps) {
  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="bg-[#1A1A1A] border-b border-[#2D2D2D] px-4 py-2">
      <div className="flex items-center justify-between">
        {/* 左侧 Logo 和房间信息 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold">
              <span className="text-[#0E72ED]">zoom</span>
              {isGameMode && (
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent ml-1">
                  for fun
                </span>
              )}
            </div>
          </div>
          
          <div className="h-6 w-px bg-[#3D3D3D]" />
          
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-mono bg-[#2D2D2D] px-2 py-1 rounded">{roomId}</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
        </div>

        {/* 右侧信息 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span>{participantCount}</span>
          </div>

          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
