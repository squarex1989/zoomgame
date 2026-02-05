'use client';

import React from 'react';

interface HeaderProps {
  roomId: string;
  participantCount: number;
  isGameMode: boolean;
  isConnected?: boolean;
  onGameModeToggle?: () => void;
}

export function Header({ roomId, participantCount, isGameMode, isConnected = true, onGameModeToggle }: HeaderProps) {
  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="bg-[#242424] px-4 py-2 flex items-center justify-between">
      {/* 左侧 - 窗口控制 + 会议标题 */}
      <div className="flex items-center gap-4">
        {/* macOS 窗口控制按钮 */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>

        {/* 会议信息图标 */}
        <div className="flex items-center gap-2 text-gray-300">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span className="text-sm font-medium">
            {isGameMode ? (
              <>
                <span className="text-[#0E72ED]">zoom</span>
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent ml-1">
                  for fun
                </span>
              </>
            ) : (
              `Room ${roomId}`
            )}
          </span>
        </div>
      </div>

      {/* 右侧控制按钮 */}
      <div className="flex items-center gap-3">
        {/* 连接状态 */}
        <div className={`flex items-center gap-1.5 ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>

        {/* Zoom for Fun 按钮 - 仅在 meeting 模式显示 */}
        {!isGameMode && onGameModeToggle && (
          <div className="relative">
            <button
              onClick={onGameModeToggle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.58 16.09l-1.09-7.66A3.996 3.996 0 0 0 16.53 5H7.47a3.996 3.996 0 0 0-3.96 3.43l-1.09 7.66C2.19 17.72 3.37 19 4.99 19H7v-2H4.99l1.07-7.5c.18-1.3 1.29-2.26 2.59-2.26h9.71c1.3 0 2.41.96 2.59 2.26L22.01 17H19v2h3.01c1.62 0 2.8-1.28 2.57-2.91zM10 12h4v2h-4zm0 4h4v2h-4z"/>
              </svg>
              <span>Zoom for Fun</span>
            </button>
            {/* Click me! Badge */}
            <div className="absolute -top-2 -right-2 animate-bounce">
              <div className="relative">
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                  Click me!
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* 更多控制图标 */}
        <button 
          onClick={copyRoomLink}
          className="p-2 hover:bg-[#3D3D3D] rounded-lg transition-colors text-gray-300"
          title="复制房间链接"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </button>

        <button className="p-2 hover:bg-[#3D3D3D] rounded-lg transition-colors text-gray-300">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
        </button>

        <button className="p-2 hover:bg-[#3D3D3D] rounded-lg transition-colors text-gray-300">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
