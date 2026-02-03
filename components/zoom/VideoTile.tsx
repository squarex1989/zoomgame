'use client';

import React from 'react';
import { Player, TEAM_COLOR_HEX, TeamColor } from '@/lib/game/types';

interface VideoTileProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rectangle' | 'circle';
  isActive?: boolean;
  isMuted?: boolean;
  teamColor?: TeamColor;
  onClick?: () => void;
  className?: string;
}

export function VideoTile({
  player,
  size = 'md',
  shape = 'rectangle',
  isActive = false,
  isMuted = false,
  teamColor,
  onClick,
  className = '',
}: VideoTileProps) {
  const sizeStyles = {
    sm: shape === 'circle' ? 'w-12 h-12' : 'w-32 h-24',
    md: shape === 'circle' ? 'w-20 h-20' : 'w-48 h-36',
    lg: shape === 'circle' ? 'w-32 h-32' : 'w-64 h-48',
  };

  const borderColor = teamColor ? TEAM_COLOR_HEX[teamColor] : (isActive ? '#22C55E' : '#3D3D3D');

  // 圆形小头像使用外层容器来放置标签
  if (shape === 'circle' && size === 'sm') {
    return (
      <div className="relative">
        {/* 主头像 */}
        <div
          onClick={onClick}
          className={`
            relative overflow-hidden bg-[#1A1A1A] rounded-full
            ${sizeStyles[size]}
            ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
            ${className}
          `}
          style={{
            border: `3px solid ${borderColor}`,
            boxShadow: isActive ? `0 0 20px ${borderColor}40` : 'none',
          }}
        >
          <img
            src={player.avatar}
            alt={player.name}
            className="w-full h-full object-cover rounded-full"
          />
          {/* 名字标签 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-full py-0.5 px-1">
            <div className="flex items-center justify-center">
              <span className="text-white font-medium truncate text-[10px]">
                {player.name.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>
        
        {/* Host 标签 - 放在圆圈外面左上角 */}
        {player.isHost && (
          <div className="absolute -top-2 -left-2 bg-[#0E72ED] text-white text-[8px] px-1.5 py-0.5 rounded shadow-lg font-bold z-10">
            Host
          </div>
        )}
        
        {/* Ready 标签 - 放在圆圈外面右上角 */}
        {player.isReady && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden bg-[#1A1A1A] 
        ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'}
        ${sizeStyles[size]}
        ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
        ${className}
      `}
      style={{
        border: `3px solid ${borderColor}`,
        boxShadow: isActive ? `0 0 20px ${borderColor}40` : 'none',
      }}
    >
      {/* 头像 */}
      <img
        src={player.avatar}
        alt={player.name}
        className={`w-full h-full object-cover ${shape === 'circle' ? 'rounded-full' : ''}`}
      />

      {/* 名字标签 */}
      <div className={`
        absolute bottom-0 left-0 right-0 
        bg-gradient-to-t from-black/80 to-transparent
        ${shape === 'circle' ? 'rounded-b-full py-1' : 'py-2 px-3'}
      `}>
        <div className="flex items-center justify-center gap-1">
          <div className={`w-3 h-3 flex-shrink-0 ${isMuted ? 'text-red-500' : 'text-white'}`}>
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05H19zm-4 .16L9 5.18V5a3 3 0 0 1 6 0v6.16zM4.27 3L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .2 0 .39-.02.58-.06l1.74 1.74A5.98 5.98 0 0 1 12 17c-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c.57-.07 1.12-.21 1.63-.4l5.1 5.1 1.27-1.27L4.27 3z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V22h-2v-6.07z"/>
              </svg>
            )}
          </div>
          <span className="text-white text-xs font-medium truncate">
            {player.name.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* 主持人标志 */}
      {player.isHost && (
        <div className="absolute top-1 left-1 bg-[#0E72ED] text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
          Host
        </div>
      )}

      {/* 准备状态 */}
      {player.isReady && (
        <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
          Ready
        </div>
      )}
    </div>
  );
}
