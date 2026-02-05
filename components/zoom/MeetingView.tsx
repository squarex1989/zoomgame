'use client';

import React from 'react';
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

// 根据名字生成头像颜色
function getAvatarColors(name: string): { bg: string; bgDark: string } {
  const colorPairs = [
    { bg: '#6366F1', bgDark: '#4338CA' }, // 紫色
    { bg: '#EC4899', bgDark: '#BE185D' }, // 粉色
    { bg: '#14B8A6', bgDark: '#0D9488' }, // 青色
    { bg: '#F97316', bgDark: '#C2410C' }, // 橙色
    { bg: '#8B5CF6', bgDark: '#6D28D9' }, // 紫罗兰
    { bg: '#06B6D4', bgDark: '#0891B2' }, // 蓝绿
    { bg: '#EF4444', bgDark: '#B91C1C' }, // 红色
    { bg: '#22C55E', bgDark: '#15803D' }, // 绿色
    { bg: '#F59E0B', bgDark: '#B45309' }, // 琥珀
    { bg: '#3B82F6', bgDark: '#1D4ED8' }, // 蓝色
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colorPairs[Math.abs(hash) % colorPairs.length];
}

export function MeetingView({ players, currentPlayerId, activePlayerId }: MeetingViewProps) {
  // 限制最多显示 25 人
  const displayPlayers = players.slice(0, 25);
  const { cols, rows } = getGridLayout(displayPlayers.length);

  if (displayPlayers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1A1A1A]">
        <div className="text-gray-500 text-lg">等待参与者加入...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1A1A1A] p-3 overflow-hidden flex items-center justify-center">
      <div 
        className="w-full h-full grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {displayPlayers.map((player, index) => {
          const isCurrentUser = player.id === currentPlayerId;
          const isSpeaking = player.id === activePlayerId;
          const colors = getAvatarColors(player.name);
          
          return (
            <div 
              key={player.id} 
              className={`
                relative rounded-xl overflow-hidden 
                transition-all duration-200
                ${isSpeaking ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-[#1A1A1A]' : ''}
              `}
              style={{
                background: `linear-gradient(180deg, ${colors.bg}30 0%, ${colors.bgDark}50 100%)`,
              }}
            >
              {/* 视频内容区 - 头像居中 */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* 圆形头像 */}
                <div 
                  className={`
                    rounded-full flex items-center justify-center overflow-hidden
                    border-4 border-white/20
                    ${displayPlayers.length === 1 ? 'w-48 h-48' : 
                      displayPlayers.length <= 4 ? 'w-32 h-32' : 
                      displayPlayers.length <= 9 ? 'w-24 h-24' : 'w-20 h-20'}
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgDark} 100%)`,
                  }}
                >
                  <span 
                    className="text-white font-bold"
                    style={{ 
                      fontSize: displayPlayers.length === 1 ? '5rem' : 
                               displayPlayers.length <= 4 ? '3rem' : 
                               displayPlayers.length <= 9 ? '2rem' : '1.5rem' 
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* 名字标签 - 底部居左 */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2">
                  {/* 麦克风图标 */}
                  <div className={`
                    flex items-center justify-center rounded
                    ${isCurrentUser ? 'text-red-400' : 'text-white'}
                  `}>
                    {isCurrentUser ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05H19zm-4 .16L9 5.18V5a3 3 0 0 1 6 0v6.16zM4.27 3L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .2 0 .39-.02.58-.06l1.74 1.74A5.98 5.98 0 0 1 12 17c-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c.57-.07 1.12-.21 1.63-.4l5.1 5.1 1.27-1.27L4.27 3z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V22h-2v-6.07z"/>
                      </svg>
                    )}
                  </div>
                  
                  {/* 名字 */}
                  <span className={`
                    text-white font-medium truncate
                    ${displayPlayers.length <= 4 ? 'text-base' : 'text-sm'}
                  `}>
                    {isCurrentUser ? 'You' : player.name}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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

// 网格视图（别名，与 MeetingView 相同）
export function GalleryView({ players, currentPlayerId }: MeetingViewProps) {
  return <MeetingView players={players} currentPlayerId={currentPlayerId} />;
}
