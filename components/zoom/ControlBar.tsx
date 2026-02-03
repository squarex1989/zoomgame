'use client';

import React from 'react';
import { Button } from '../ui/Button';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isGameMode: boolean;
  isHost: boolean;
  onMuteToggle: () => void;
  onVideoToggle: () => void;
  onGameModeToggle: () => void;
  onLeave: () => void;
}

export function ControlBar({
  isMuted,
  isVideoOff,
  isGameMode,
  isHost,
  onMuteToggle,
  onVideoToggle,
  onGameModeToggle,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="bg-[#1A1A1A] border-t border-[#2D2D2D] px-4 py-3">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* 左侧控制 */}
        <div className="flex items-center gap-2">
          {/* 静音按钮 */}
          <ControlButton
            icon={isMuted ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05H19zm-4 .16L9 5.18V5a3 3 0 0 1 6 0v6.16zM4.27 3L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .2 0 .39-.02.58-.06l1.74 1.74A5.98 5.98 0 0 1 12 17c-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c.57-.07 1.12-.21 1.63-.4l5.1 5.1 1.27-1.27L4.27 3z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V22h-2v-6.07z"/>
              </svg>
            )}
            label={isMuted ? 'Unmute' : 'Mute'}
            isActive={!isMuted}
            onClick={onMuteToggle}
          />

          {/* 视频按钮 */}
          <ControlButton
            icon={isVideoOff ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            )}
            label={isVideoOff ? 'Start Video' : 'Stop Video'}
            isActive={!isVideoOff}
            onClick={onVideoToggle}
          />
        </div>

        {/* 中间控制 */}
        <div className="flex items-center gap-2">
          {/* Zoom for Fun 按钮 */}
          <button
            onClick={onGameModeToggle}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-300
              ${isGameMode 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30' 
                : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30'
              }
            `}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.58 16.09l-1.09-7.66A3.996 3.996 0 0 0 16.53 5H7.47a3.996 3.996 0 0 0-3.96 3.43l-1.09 7.66C2.19 17.72 3.37 19 4.99 19H7v-2H4.99l1.07-7.5c.18-1.3 1.29-2.26 2.59-2.26h9.71c1.3 0 2.41.96 2.59 2.26L22.01 17H19v2h3.01c1.62 0 2.8-1.28 2.57-2.91zM10 12h4v2h-4zm0 4h4v2h-4z"/>
            </svg>
            <span>Zoom for Fun</span>
            {isGameMode && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">ON</span>
            )}
          </button>
        </div>

        {/* 右侧控制 */}
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={onLeave}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ControlButton({ icon, label, isActive, onClick }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-4 py-2 rounded-lg
        transition-colors duration-200
        ${isActive 
          ? 'bg-[#2D2D2D] text-white hover:bg-[#3D3D3D]' 
          : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
        }
      `}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
