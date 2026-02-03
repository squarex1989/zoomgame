'use client';

import React, { useState } from 'react';
import { TeamColor, TEAM_COLOR_HEX, BOARD_SIZE, RoundResult, RoundMove } from '@/lib/game/types';

interface GomokuBoardProps {
  board: (TeamColor | null)[][];
  currentMoves: RoundMove[];
  roundResults: RoundResult[];
  myTeamId: number | null;
  myTeamColor: TeamColor | null;
  isMyTurn: boolean;
  onPlaceStone: (position: [number, number]) => void;
}

export function GomokuBoard({
  board,
  currentMoves,
  roundResults,
  myTeamId,
  myTeamColor,
  isMyTurn,
  onPlaceStone,
}: GomokuBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const cellSize = 36;
  const boardPadding = 20;
  const totalSize = BOARD_SIZE * cellSize + boardPadding * 2;

  // 我当前回合的落子位置
  const myMove = currentMoves.find(m => m.teamId === myTeamId);

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn || !myTeamColor) return;
    if (board[row][col] !== null) return;
    onPlaceStone([row, col]);
  };

  return (
    <div className="relative">
      {/* 棋盘背景 */}
      <div
        className="rounded-xl shadow-2xl"
        style={{
          width: totalSize,
          height: totalSize,
          background: 'linear-gradient(135deg, #DEB887 0%, #D2B48C 50%, #C4A574 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 0 60px rgba(0,0,0,0.1)',
        }}
      >
        {/* 网格线 */}
        <svg
          width={totalSize}
          height={totalSize}
          className="absolute top-0 left-0"
        >
          {/* 垂直线 */}
          {Array.from({ length: BOARD_SIZE }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={boardPadding + i * cellSize + cellSize / 2}
              y1={boardPadding + cellSize / 2}
              x2={boardPadding + i * cellSize + cellSize / 2}
              y2={totalSize - boardPadding - cellSize / 2}
              stroke="#000"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          {/* 水平线 */}
          {Array.from({ length: BOARD_SIZE }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={boardPadding + cellSize / 2}
              y1={boardPadding + i * cellSize + cellSize / 2}
              x2={totalSize - boardPadding - cellSize / 2}
              y2={boardPadding + i * cellSize + cellSize / 2}
              stroke="#000"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          {/* 星位点 */}
          {[3, 7, 11].map(row =>
            [3, 7, 11].map(col => (
              <circle
                key={`star-${row}-${col}`}
                cx={boardPadding + col * cellSize + cellSize / 2}
                cy={boardPadding + row * cellSize + cellSize / 2}
                r="4"
                fill="#000"
                opacity="0.4"
              />
            ))
          )}
        </svg>

        {/* 可点击的格子和棋子 */}
        <div
          className="absolute grid"
          style={{
            top: boardPadding,
            left: boardPadding,
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
          }}
        >
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const isHovered = hoveredCell?.[0] === rowIdx && hoveredCell?.[1] === colIdx;
              const isMyMoveHere = myMove?.position[0] === rowIdx && myMove?.position[1] === colIdx;
              const teammateMove = currentMoves.find(
                m => m.teamId === myTeamId && m.position[0] === rowIdx && m.position[1] === colIdx
              );
              const result = roundResults.find(
                r => r.position[0] === rowIdx && r.position[1] === colIdx
              );

              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`
                    relative flex items-center justify-center
                    ${!cell && isMyTurn && myTeamColor ? 'cursor-pointer' : ''}
                  `}
                  onMouseEnter={() => setHoveredCell([rowIdx, colIdx])}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                >
                  {/* 已落子的棋子 */}
                  {cell && (
                    <Stone color={cell} size={cellSize - 8} />
                  )}

                  {/* 当前回合队友的落子预览 */}
                  {!cell && teammateMove && (
                    <Stone
                      color={myTeamColor!}
                      size={cellSize - 8}
                      isPreview
                      isMyMove={teammateMove.playerId === myMove?.playerId}
                    />
                  )}

                  {/* 悬停预览 */}
                  {!cell && !teammateMove && isHovered && isMyTurn && myTeamColor && (
                    <Stone
                      color={myTeamColor}
                      size={cellSize - 8}
                      isPreview
                      isHover
                    />
                  )}

                  {/* 判定结果动画 */}
                  {result && (
                    <ResultToast result={result} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

interface StoneProps {
  color: TeamColor;
  size: number;
  isPreview?: boolean;
  isMyMove?: boolean;
  isHover?: boolean;
}

function Stone({ color, size, isPreview, isMyMove, isHover }: StoneProps) {
  const baseColor = TEAM_COLOR_HEX[color];

  return (
    <div
      className={`
        rounded-full transition-all duration-200
        ${isPreview ? (isHover ? 'opacity-40' : 'opacity-70') : ''}
        ${isMyMove ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}
      `}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${lightenColor(baseColor, 30)} 0%, ${baseColor} 50%, ${darkenColor(baseColor, 30)} 100%)`,
        boxShadow: isPreview
          ? `0 2px 4px rgba(0,0,0,0.2)`
          : `0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
      }}
    />
  );
}

interface ResultToastProps {
  result: RoundResult;
}

function ResultToast({ result }: ResultToastProps) {
  return (
    <div
      className={`
        absolute -top-8 left-1/2 -translate-x-1/2
        px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap
        animate-bounce
        ${result.winner
          ? 'bg-green-500 text-white'
          : 'bg-gray-600 text-gray-300'
        }
      `}
    >
      {result.message}
    </div>
  );
}

// 辅助函数：调亮颜色
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * percent / 100));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// 辅助函数：调暗颜色
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * percent / 100));
  const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * percent / 100));
  const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * percent / 100));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
