'use client';

import React from 'react';
import { Player, Team, GomokuState, GameType, TeamColor } from '@/lib/game/types';
import { GomokuBoard } from './GomokuBoard';
import { GomokuControls } from './GomokuControls';
import { TeamArea, SpectatorList } from './TeamArea';
import { GameSelector } from './GameSelector';

interface GameCanvasProps {
  gameType: GameType;
  gameState: GomokuState | null;
  players: Player[];
  teams: Team[];
  currentPlayerId: string | null;
  isHost: boolean;
  onSelectGame: (game: GameType) => void;
  onJoinTeam: (teamId: number) => void;
  onLeaveTeam: () => void;
  onReady: () => void;
  onUnready: () => void;
  onConfigChange: (config: any) => void;
  onStartGame: () => void;
  onPlaceStone: (position: [number, number]) => void;
}

export function GameCanvas({
  gameType,
  gameState,
  players,
  teams,
  currentPlayerId,
  isHost,
  onSelectGame,
  onJoinTeam,
  onLeaveTeam,
  onReady,
  onUnready,
  onConfigChange,
  onStartGame,
  onPlaceStone,
}: GameCanvasProps) {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isInTeam = currentPlayer?.teamId !== null && currentPlayer?.teamId !== undefined;
  const myTeamId = currentPlayer?.teamId ?? null;
  const myTeam = teams.find(t => t.id === myTeamId);
  const myTeamColor = myTeam?.color ?? null;

  // 获取旁观者（不在任何队伍的玩家）
  const spectators = players.filter(p => p.teamId === null);

  // 检查是否还有空位
  const config = gameState?.config || { playerCount: 4, playersPerTeam: 2, totalRounds: 3 };
  const totalSlots = config.playerCount;
  const filledSlots = teams.reduce((sum, t) => sum + t.players.length, 0);
  const hasEmptySlots = filledSlots < totalSlots;

  // 检查当前玩家是否可以加入某个队伍（包括换组）
  const canJoinTeam = (team: Team) => {
    // 游戏进行中不能换组
    if (gameState?.phase === 'playing') return false;
    // 已准备状态不能换组
    if (currentPlayer?.isReady) return false;
    // 已经在这个队伍了
    if (myTeamId === team.id) return false;
    // 目标队伍有空位
    return team.players.length < config.playersPerTeam;
  };

  // 游戏中判断是否轮到我
  const isMyTurn = gameState?.phase === 'playing' && isInTeam;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-[#0D0D0D] via-[#1A1A2E] to-[#0D0D0D] overflow-hidden">
      {/* 顶部游戏选择器 */}
      <div className="flex justify-center py-4">
        <GameSelector currentGame={gameType} onSelectGame={onSelectGame} />
      </div>

      {/* 游戏内容区 */}
      {gameType === 'gomoku' ? (
        <div className="flex-1 flex items-start justify-center gap-6 p-4 overflow-auto">
          {/* 左侧：棋盘 + 队伍 */}
          <div className="flex flex-col items-center gap-4">
            {/* 棋盘 */}
            <GomokuBoard
              board={gameState?.board || Array(15).fill(null).map(() => Array(15).fill(null))}
              currentMoves={gameState?.roundMoves || []}
              roundResults={gameState?.roundResults || []}
              myTeamId={myTeamId}
              myTeamColor={myTeamColor}
              isMyTurn={isMyTurn}
              onPlaceStone={onPlaceStone}
            />
            
            {/* 队伍区域 - 横向排列在棋盘下方 */}
            <div className="flex flex-wrap justify-center gap-3">
              {teams.map(team => (
                <TeamArea
                  key={team.id}
                  team={team}
                  players={players.filter(p => p.teamId === team.id)}
                  maxPlayers={config.playersPerTeam}
                  currentPlayerId={currentPlayerId}
                  canJoin={canJoinTeam(team)}
                  onJoinTeam={() => onJoinTeam(team.id)}
                />
              ))}
            </div>
          </div>

          {/* 右侧：控制面板 */}
          <div className="flex flex-col gap-4 w-72 flex-shrink-0">
            <GomokuControls
              gameState={gameState}
              teams={teams}
              isHost={isHost}
              isInTeam={isInTeam}
              isReady={currentPlayer?.isReady || false}
              onConfigChange={onConfigChange}
              onReady={onReady}
              onUnready={onUnready}
              onStartGame={onStartGame}
            />

            <SpectatorList
              spectators={spectators}
              currentPlayerId={currentPlayerId}
              canJoinGame={hasEmptySlots && gameState?.phase !== 'playing'}
              onJoinGame={() => {
                const availableTeam = teams.find(t => t.players.length < config.playersPerTeam);
                if (availableTeam) onJoinTeam(availableTeam.id);
              }}
            />
          </div>
        </div>
      ) : (
        /* Coming Soon 占位 */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {gameType === 'goose-duck' ? '🦆' : '🔷'}
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">
              {gameType === 'goose-duck' ? '鹅鸭杀' : 'Shape On!'}
            </h2>
            <p className="text-gray-400 text-lg">Coming Soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}
