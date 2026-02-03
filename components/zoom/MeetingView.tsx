'use client';

import React from 'react';
import { VideoTile } from './VideoTile';
import { Player } from '@/lib/game/types';

interface MeetingViewProps {
  players: Player[];
  currentPlayerId: string | null;
  activePlayerId?: string;
}

export function MeetingView({ players, currentPlayerId, activePlayerId }: MeetingViewProps) {
  // 找到当前说话/活跃的玩家（这里模拟第一个玩家是主说话人）
  const mainSpeaker = players.find(p => p.id === activePlayerId) || players[0];
  const otherPlayers = players.filter(p => p.id !== mainSpeaker?.id);

  if (players.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0D]">
        <div className="text-gray-500 text-lg">等待参与者加入...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0D0D0D] p-4 overflow-hidden">
      {/* 顶部小视频条 */}
      {otherPlayers.length > 0 && (
        <div className="flex justify-center gap-3 mb-4 overflow-x-auto pb-2">
          {otherPlayers.slice(0, 5).map(player => (
            <VideoTile
              key={player.id}
              player={player}
              size="sm"
              isActive={player.id === currentPlayerId}
            />
          ))}
          {otherPlayers.length > 5 && (
            <div className="flex items-center justify-center w-32 h-24 bg-[#1A1A1A] rounded-xl border border-[#3D3D3D]">
              <span className="text-gray-400 text-sm">+{otherPlayers.length - 5} more</span>
            </div>
          )}
        </div>
      )}

      {/* 主视频区域 */}
      {mainSpeaker && (
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-4xl aspect-video bg-[#1A1A1A] rounded-2xl overflow-hidden border-2 border-green-500 shadow-2xl shadow-green-500/10">
            <img
              src={mainSpeaker.avatar}
              alt={mainSpeaker.name}
              className="w-full h-full object-cover"
            />
            
            {/* 名字标签 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-4 px-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V22h-2v-6.07z"/>
                  </svg>
                </div>
                <span className="text-white text-lg font-medium">{mainSpeaker.name}</span>
                {mainSpeaker.isHost && (
                  <span className="bg-[#0E72ED] text-white text-xs px-2 py-0.5 rounded-full">Host</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 网格视图
export function GalleryView({ players, currentPlayerId }: MeetingViewProps) {
  const gridCols = players.length <= 4 ? 2 : players.length <= 9 ? 3 : 4;

  return (
    <div className="flex-1 bg-[#0D0D0D] p-4">
      <div 
        className="h-full grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridAutoRows: '1fr',
        }}
      >
        {players.map(player => (
          <div key={player.id} className="relative bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#3D3D3D]">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-2 px-3">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V22h-2v-6.07z"/>
                  </svg>
                </div>
                <span className="text-white text-sm font-medium truncate">{player.name}</span>
                {player.isHost && (
                  <span className="bg-[#0E72ED] text-white text-xs px-1.5 py-0.5 rounded-full">Host</span>
                )}
              </div>
            </div>

            {player.id === currentPlayerId && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
