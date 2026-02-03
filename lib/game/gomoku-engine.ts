import { 
  GomokuState, 
  Team, 
  RoundMove, 
  RoundResult, 
  TeamColor, 
  BOARD_SIZE, 
  WIN_LENGTH,
  TEAM_COLORS 
} from './types';

export class GomokuEngine {
  /**
   * 解决回合冲突，返回每个位置的判定结果
   */
  static resolveRound(state: GomokuState, teams: Team[]): RoundResult[] {
    const results: RoundResult[] = [];
    
    // 按位置分组
    const positionGroups = new Map<string, RoundMove[]>();
    
    for (const move of state.roundMoves) {
      const key = `${move.position[0]},${move.position[1]}`;
      if (!positionGroups.has(key)) {
        positionGroups.set(key, []);
      }
      positionGroups.get(key)!.push(move);
    }

    // 对每个位置进行判定
    for (const [posKey, moves] of positionGroups) {
      const [row, col] = posKey.split(',').map(Number) as [number, number];
      
      // 跳过已有棋子的位置
      if (state.board[row][col] !== null) {
        continue;
      }

      const result = this.resolvePosition(moves, teams);
      results.push({
        position: [row, col],
        winner: result.winner,
        contested: result.contested,
        message: result.message,
      });
    }

    return results;
  }

  /**
   * 解决单个位置的冲突
   */
  private static resolvePosition(
    moves: RoundMove[], 
    teams: Team[]
  ): { winner: TeamColor | null; contested: boolean; message: string } {
    // 按队伍分组
    const teamMoves = new Map<number, RoundMove[]>();
    
    for (const move of moves) {
      if (!teamMoves.has(move.teamId)) {
        teamMoves.set(move.teamId, []);
      }
      teamMoves.get(move.teamId)!.push(move);
    }

    const teamIds = Array.from(teamMoves.keys());

    // 如果只有一个队伍在该位置落子
    if (teamIds.length === 1) {
      const teamId = teamIds[0];
      const team = teams.find(t => t.id === teamId);
      return {
        winner: team?.color || null,
        contested: false,
        message: `${team?.color} 💪`,
      };
    }

    // 多个队伍争夺，进入三轮判定
    // 第一轮：比较棋盘上的棋子总数，最少的获胜
    const teamStones = teams
      .filter(t => teamIds.includes(t.id))
      .map(t => ({ team: t, count: t.stoneCount }));
    
    const minStones = Math.min(...teamStones.map(t => t.count));
    const minTeams = teamStones.filter(t => t.count === minStones);

    if (minTeams.length === 1) {
      const winner = minTeams[0].team;
      return {
        winner: winner.color,
        contested: true,
        message: `${winner.color} 💪 (棋子最少)`,
      };
    }

    // 第二轮：在棋子数相同的队伍中，比较本回合在该位置投入的棋子数
    const contestingTeamIds = minTeams.map(t => t.team.id);
    const moveCounts = contestingTeamIds.map(teamId => ({
      teamId,
      team: teams.find(t => t.id === teamId)!,
      count: teamMoves.get(teamId)?.length || 0,
    }));

    const maxMoves = Math.max(...moveCounts.map(m => m.count));
    const maxMoveTeams = moveCounts.filter(m => m.count === maxMoves);

    if (maxMoveTeams.length === 1) {
      const winner = maxMoveTeams[0].team;
      return {
        winner: winner.color,
        contested: true,
        message: `${winner.color} 💪 (投入更多)`,
      };
    }

    // 第三轮：仍然相同，该位置不落子
    return {
      winner: null,
      contested: true,
      message: '⚔️ 争夺失败',
    };
  }

  /**
   * 将判定结果应用到棋盘
   */
  static applyResults(state: GomokuState, results: RoundResult[], teams: Team[]): void {
    for (const result of results) {
      if (result.winner) {
        const [row, col] = result.position;
        state.board[row][col] = result.winner;
        
        // 增加队伍棋子计数
        const team = teams.find(t => t.color === result.winner);
        if (team) {
          team.stoneCount++;
        }
      }
    }

    // 清空当前回合落子
    state.roundMoves = [];
  }

  /**
   * 检查胜利条件
   */
  static checkWinCondition(state: GomokuState, teams: Team[]): {
    ended: boolean;
    winner: TeamColor | null;
    lineLength: number;
    message?: string;
  } {
    const lineResults: { color: TeamColor; length: number }[] = [];

    // 检查每个队伍的最长连线
    for (const color of TEAM_COLORS) {
      const maxLine = this.findMaxLine(state.board, color);
      if (maxLine >= WIN_LENGTH) {
        lineResults.push({ color, length: maxLine });
      }
    }

    // 没有队伍达到5连
    if (lineResults.length === 0) {
      return { ended: false, winner: null, lineLength: 0 };
    }

    // 找出最长的连线
    const maxLength = Math.max(...lineResults.map(r => r.length));
    const maxLengthTeams = lineResults.filter(r => r.length === maxLength);

    // 只有一个队伍有最长连线
    if (maxLengthTeams.length === 1) {
      return {
        ended: true,
        winner: maxLengthTeams[0].color,
        lineLength: maxLength,
      };
    }

    // 多个队伍有相同长度的最长连线，游戏继续
    return {
      ended: false,
      winner: null,
      lineLength: maxLength,
      message: `有 ${maxLengthTeams.length} 组率先完成 ${maxLength} 枚连线，比赛仍在继续！`,
    };
  }

  /**
   * 找出指定颜色在棋盘上的最长连线
   */
  private static findMaxLine(board: (TeamColor | null)[][], color: TeamColor): number {
    let maxLine = 0;
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 对角线 \
      [1, -1],  // 对角线 /
    ];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] !== color) continue;

        for (const [dr, dc] of directions) {
          let length = 1;
          let r = row + dr;
          let c = col + dc;

          while (
            r >= 0 && r < BOARD_SIZE &&
            c >= 0 && c < BOARD_SIZE &&
            board[r][c] === color
          ) {
            length++;
            r += dr;
            c += dc;
          }

          maxLine = Math.max(maxLine, length);
        }
      }
    }

    return maxLine;
  }

  /**
   * 创建初始棋盘
   */
  static createEmptyBoard(): (TeamColor | null)[][] {
    return Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null)
    );
  }

  /**
   * 获取可以落子的位置
   */
  static getValidMoves(board: (TeamColor | null)[][]): [number, number][] {
    const moves: [number, number][] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === null) {
          moves.push([row, col]);
        }
      }
    }
    
    return moves;
  }
}
