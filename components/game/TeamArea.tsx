'use client';

import React from 'react';
import { Team, Player, TEAM_COLOR_HEX, TeamColor } from '@/lib/game/types';
import { VideoTile } from '../zoom/VideoTile';

interface TeamAreaProps {
  team: Team;
  players: Player[];
  maxPlayers: number;
  currentPlayerId: string | null;
  canJoin: boolean;
  onJoinTeam: () => void;
}

export function TeamArea({
  team,
  players,
  maxPlayers,
  currentPlayerId,
  canJoin,
  onJoinTeam,
}: TeamAreaProps) {
  const emptySlots = maxPlayers - players.length;
  const isCurrentPlayerInTeam = players.some(p => p.id === currentPlayerId);

  return (
    <div
      className="relative p-3 rounded-xl bg-[#1A1A1A]/80 border-2 transition-all duration-300 min-w-[140px]"
      style={{
        borderColor: TEAM_COLOR_HEX[team.color],
        boxShadow: `0 0 20px ${TEAM_COLOR_HEX[team.color]}15`,
      }}
    >
      {/* 队伍标题 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: TEAM_COLOR_HEX[team.color] }}
          />
          <span className="text-white text-sm font-semibold capitalize">{team.color}</span>
        </div>
        <div className="text-xs text-gray-400">
          <span className="text-white font-bold">{team.wins}</span> 胜
        </div>
      </div>

      {/* 玩家格子 */}
      <div className="flex gap-2 justify-center">
        {players.map(player => (
          <VideoTile
            key={player.id}
            player={player}
            size="sm"
            shape="circle"
            teamColor={team.color}
            isActive={player.id === currentPlayerId}
          />
        ))}

        {/* 空位 */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <button
            key={`empty-${index}`}
            onClick={canJoin ? onJoinTeam : undefined}
            disabled={!canJoin}
            className={`
              w-12 h-12 rounded-full border-2 border-dashed
              flex items-center justify-center
              transition-all duration-200
              ${canJoin
                ? 'border-gray-500 hover:border-white hover:bg-white/10 cursor-pointer'
                : 'border-gray-700 cursor-not-allowed'
              }
            `}
            style={{
              borderColor: canJoin ? TEAM_COLOR_HEX[team.color] + '80' : undefined,
            }}
          >
            <svg
              className={`w-5 h-5 ${canJoin ? 'text-gray-400' : 'text-gray-700'}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        ))}
      </div>

      {/* 当前玩家在此队伍的标识 */}
      {isCurrentPlayerInTeam && (
        <div 
          className="absolute -top-1.5 -right-1.5 text-white text-xs px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: TEAM_COLOR_HEX[team.color] }}
        >
          我
        </div>
      )}
    </div>
  );
}

// 旁观者列表
interface SpectatorListProps {
  spectators: Player[];
  currentPlayerId: string | null;
  canJoinGame: boolean;
  onJoinGame: () => void;
}

export function SpectatorList({
  spectators,
  currentPlayerId,
  canJoinGame,
  onJoinGame,
}: SpectatorListProps) {
  const isCurrentPlayerSpectator = spectators.some(s => s.id === currentPlayerId);

  return (
    <div className="bg-[#1A1A1A]/80 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          旁观者 ({spectators.length})
        </h3>
      </div>

      {spectators.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {spectators.map(spectator => (
            <div
              key={spectator.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2D2D2D]
                ${spectator.id === currentPlayerId ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <img
                src={spectator.avatar}
                alt={spectator.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-300">{spectator.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-3">暂无旁观者</p>
      )}

      {isCurrentPlayerSpectator && (
        <button
          onClick={onJoinGame}
          disabled={!canJoinGame}
          className={`
            w-full py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${canJoinGame
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {canJoinGame ? '加入游戏' : '游戏已满'}
        </button>
      )}
    </div>
  );
}
