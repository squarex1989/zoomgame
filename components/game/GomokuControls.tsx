'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { GameConfig, GomokuState, Team, getRoundTime } from '@/lib/game/types';

interface GomokuControlsProps {
  gameState: GomokuState | null;
  teams: Team[];
  isHost: boolean;
  isInTeam: boolean;
  isReady: boolean;
  onConfigChange: (config: GameConfig) => void;
  onReady: () => void;
  onUnready: () => void;
  onStartGame: () => void;
}

export function GomokuControls({
  gameState,
  teams,
  isHost,
  isInTeam,
  isReady,
  onConfigChange,
  onReady,
  onUnready,
  onStartGame,
}: GomokuControlsProps) {
  const [playerCount, setPlayerCount] = useState<4 | 8>(4);
  const [playersPerTeam, setPlayersPerTeam] = useState<2 | 4>(2);
  const [totalRounds, setTotalRounds] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);

  const config = gameState?.config;
  const phase = gameState?.phase || 'waiting';

  // 回合倒计时
  useEffect(() => {
    if (phase === 'playing' && gameState) {
      const roundTime = getRoundTime(gameState.currentRound);
      setTimeLeft(roundTime);

      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, gameState?.currentRound]);

  const handleConfigConfirm = () => {
    // 验证配置
    let validPlayersPerTeam = playersPerTeam;
    if (playerCount === 4) {
      validPlayersPerTeam = 2;
    }

    onConfigChange({
      playerCount,
      playersPerTeam: validPlayersPerTeam,
      totalRounds,
    });
  };

  // 计算已准备人数
  const getReadyCount = () => {
    let ready = 0;
    let total = 0;
    teams.forEach(team => {
      total += team.players.length;
    });
    // 这里简化处理，实际需要遍历玩家检查 isReady
    return { ready, total };
  };

  return (
    <div className="bg-[#1A1A1A]/90 rounded-xl p-5 w-80">
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <span className="text-2xl">⚫</span>
        多人五子棋
      </h3>

      {/* 游戏进行中显示 */}
      {phase === 'playing' && (
        <div className="space-y-4">
          {/* 回合倒计时 */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">第 {gameState?.currentRound} 回合</div>
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#2D2D2D"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke={timeLeft <= 3 ? '#EF4444' : '#22C55E'}
                  strokeWidth="8"
                  strokeDasharray={`${(timeLeft / getRoundTime(gameState?.currentRound || 1)) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-white'}`}>
                  {timeLeft}
                </span>
              </div>
            </div>
          </div>

          {/* 游戏进度 */}
          {gameState?.gameHistory && (
            <div className="text-center text-gray-400 text-sm">
              第 {(gameState.gameHistory.length || 0) + 1} / {gameState.config.totalRounds} 局
            </div>
          )}

          {/* 简要规则提示 */}
          <div className="bg-[#2D2D2D]/50 rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <div className="font-medium text-gray-300 mb-1">⚖️ 同位置判定规则</div>
            <p>判定 1：场上棋子最少的队伍在该位置落子</p>
            <p>判定 2：若 1 打平手，在该位置投入更多棋子的队伍落子</p>
            <p>判定 3：若 2 打平手，本回合该位置不落子</p>
          </div>
        </div>
      )}

      {/* 准备阶段显示 */}
      {(phase === 'waiting' || phase === 'ready') && (
        <div className="space-y-4">
          {/* 游戏规则 */}
          <div className="text-gray-400 text-sm space-y-2">
            <div className="font-medium text-white mb-2">📖 基本规则</div>
            <div className="space-y-1">
              <p>1. 每回合所有人都可以落子（最多15秒）</p>
              <p>2. 回合结束判定落子结果</p>
              <p>3. 完成判定前只能看到队友的落子</p>
              <p>4. 最先完成五子连线队伍获胜</p>
            </div>
            
            <div className="font-medium text-white mt-3 mb-2">⚖️ 同位置判定规则</div>
            <div className="space-y-1 text-xs">
              <p>判定 1：场上棋子最少的队伍在该位置落子</p>
              <p>判定 2：若 1 打平手，在该位置投入更多棋子的队伍落子</p>
              <p>判定 3：若 2 打平手，本回合该位置不落子</p>
            </div>
          </div>

          {/* 主持人配置 */}
          {isHost && (
            <div className="border-t border-[#2D2D2D] pt-4 space-y-3">
              <div className="text-white font-medium">游戏配置</div>
              
              {/* 游戏人数 */}
              <div>
                <label className="text-gray-400 text-sm">游戏人数</label>
                <div className="flex gap-2 mt-1">
                  {[4, 8].map(count => (
                    <button
                      key={count}
                      onClick={() => {
                        setPlayerCount(count as 4 | 8);
                        if (count === 4) setPlayersPerTeam(2);
                      }}
                      className={`
                        flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                        ${playerCount === count
                          ? 'bg-purple-600 text-white'
                          : 'bg-[#2D2D2D] text-gray-400 hover:bg-[#3D3D3D]'
                        }
                      `}
                    >
                      {count} 人
                    </button>
                  ))}
                </div>
              </div>

              {/* 每组人数 */}
              {playerCount === 8 && (
                <div>
                  <label className="text-gray-400 text-sm">每组人数</label>
                  <div className="flex gap-2 mt-1">
                    {[2, 4].map(count => (
                      <button
                        key={count}
                        onClick={() => setPlayersPerTeam(count as 2 | 4)}
                        className={`
                          flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                          ${playersPerTeam === count
                            ? 'bg-purple-600 text-white'
                            : 'bg-[#2D2D2D] text-gray-400 hover:bg-[#3D3D3D]'
                          }
                        `}
                      >
                        {count} 人/组
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 总局数 */}
              <div>
                <label className="text-gray-400 text-sm">总局数: {totalRounds}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={totalRounds}
                  onChange={e => setTotalRounds(parseInt(e.target.value))}
                  className="w-full mt-1 accent-purple-600"
                />
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleConfigConfirm}
              >
                确认配置
              </Button>
            </div>
          )}

          {/* 准备按钮 */}
          {isInTeam && (
            <div className="border-t border-[#2D2D2D] pt-4">
              {isReady ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={onUnready}
                >
                  取消准备
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={onReady}
                >
                  准备
                </Button>
              )}
            </div>
          )}

          {/* 局数记录 */}
          {teams.some(t => t.wins > 0) && (
            <div className="border-t border-[#2D2D2D] pt-4">
              <div className="text-gray-400 text-sm mb-2">当前战绩</div>
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between text-sm">
                  <span className="text-white capitalize">{team.color}</span>
                  <span className="text-yellow-500 font-bold">{team.wins} 胜</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 游戏结束显示 */}
      {phase === 'ended' && (
        <div className="text-center space-y-4">
          <div className="text-2xl">🎉</div>
          <div className="text-white font-bold text-xl">游戏结束</div>
          <div className="space-y-2">
            {teams
              .sort((a, b) => b.wins - a.wins)
              .map((team, index) => (
                <div
                  key={team.id}
                  className={`
                    flex items-center justify-between p-2 rounded-lg
                    ${index === 0 ? 'bg-yellow-500/20' : 'bg-[#2D2D2D]'}
                  `}
                >
                  <span className="text-white capitalize">
                    {index === 0 && '🏆 '}
                    {team.color}
                  </span>
                  <span className="text-white font-bold">{team.wins} 胜</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
