'use client';

import React from 'react';
import { VideoTile } from './VideoTile';
import { Player } from '@/lib/game/types';

interface MeetingViewProps {
  players: Player[];
  currentPlayerId: string | null;
  activePlayerId?: string;
}

// 计算最优的网格布局
function getGridLayout(count: number): { cols: number; rows: number } {
  if (count === 0) return { cols: 1, rows: 1 };
  if (count === 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count === 3) return { cols: 3, rows: 1 };
  if (count === 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 9) return { cols: 3, rows: 3 };
  if (count <= 12) return { cols: 4, rows: 3 };
  if (count <= 16) return { cols: 4, rows: 4 };
  if (count <= 20) return { cols: 5, rows: 4 };
  return { cols: 5, rows: 5 }; // 最多 25 人
}

export function MeetingView({ players, currentPlayerId }: MeetingViewProps) {
  // 限制最多显示 25 人
  const displayPlayers = players.slice(0, 25);
  const { cols, rows } = getGridLayout(displayPlayers.length);

  if (displayPlayers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0D]">
        <div className="text-gray-500 text-lg">等待参与者加入...</div>
      </div>
    );
  }

  // 根据人数计算合适的最大宽度
  const getMaxWidth = () => {
    if (displayPlayers.length === 1) return '800px';
    if (displayPlayers.length <= 3) return '1200px';
    return '100%';
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0D0D0D] p-6 overflow-hidden">
      <div 
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          width: '100%',
          maxWidth: getMaxWidth(),
        }}
      >
        {displayPlayers.map(player => (
          <div 
            key={player.id} 
            className={`
              relative bg-[#1A1A1A] rounded-2xl overflow-hidden 
              border-2 transition-all duration-200 aspect-video
              ${player.id === currentPlayerId ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-[#3D3D3D]'}
            `}
          >
            {/* 头像背景 - 渐变色 + 首字母 */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${getAvatarColor(player.name)} 0%, ${getAvatarColorDark(player.name)} 100%)`,
              }}
            >
              <div 
                className="font-bold text-white/90"
                style={{ 
                  fontSize: displayPlayers.length === 1 ? '10rem' : 
                           displayPlayers.length <= 4 ? '6rem' : 
                           displayPlayers.length <= 9 ? '4rem' : '2.5rem' 
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            {/* 名字标签 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-3 px-4">
              <div className="flex items-center justify-center gap-2">
                <div className={`text-white ${displayPlayers.length <= 4 ? 'w-5 h-5' : 'w-4 h-4'}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V22h-2v-6.07z"/>
                  </svg>
                </div>
                <span className={`text-white font-medium truncate ${displayPlayers.length <= 4 ? 'text-lg' : 'text-sm'}`}>
                  {player.name}
                </span>
                {player.isHost && (
                  <span className="bg-[#0E72ED] text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                    Host
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 超过 25 人的提示 */}
      {players.length > 25 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#2D2D2D] text-gray-300 px-4 py-2 rounded-full text-sm">
          还有 {players.length - 25} 人未显示
        </div>
      )}
    </div>
  );
}

// 根据名字生成头像颜色
function getAvatarColor(name: string): string {
  const colors = [
    '#6366F1', // 紫色
    '#EC4899', // 粉色
    '#14B8A6', // 青色
    '#F97316', // 橙色
    '#8B5CF6', // 紫罗兰
    '#06B6D4', // 蓝绿
    '#EF4444', // 红色
    '#22C55E', // 绿色
    '#F59E0B', // 琥珀
    '#3B82F6', // 蓝色
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function getAvatarColorDark(name: string): string {
  const colors = [
    '#4338CA', // 深紫色
    '#BE185D', // 深粉色
    '#0D9488', // 深青色
    '#C2410C', // 深橙色
    '#6D28D9', // 深紫罗兰
    '#0891B2', // 深蓝绿
    '#B91C1C', // 深红色
    '#15803D', // 深绿色
    '#B45309', // 深琥珀
    '#1D4ED8', // 深蓝色
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// 网格视图（别名，与 MeetingView 相同）
export function GalleryView({ players, currentPlayerId }: MeetingViewProps) {
  return <MeetingView players={players} currentPlayerId={currentPlayerId} />;
}
