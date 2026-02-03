import { Room, Player, Team, GomokuState, GameConfig, TEAM_COLORS, BOARD_SIZE, TeamColor } from './game/types';

// 内存存储
class GameStore {
  private rooms: Map<string, Room> = new Map();

  // 房间操作
  createRoom(): Room {
    const roomId = this.generateRoomId();
    
    // 默认配置
    const defaultConfig: GameConfig = { playerCount: 4, playersPerTeam: 2, totalRounds: 3 };

    const room: Room = {
      id: roomId,
      hostId: '', // 第一个加入的玩家会成为 host
      players: new Map(),
      teams: this.createTeams(4, 2), // 默认 4 人游戏，2 人一组
      gameType: 'gomoku',
      gameState: this.createInitialGameState(defaultConfig),
      mode: 'meeting',
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  // 玩家操作
  addPlayer(roomId: string, player: Player): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    room.players.set(player.id, player);
    return true;
  }

  removePlayer(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    // 从队伍中移除
    if (player.teamId !== null) {
      const team = room.teams.find(t => t.id === player.teamId);
      if (team) {
        team.players = team.players.filter(id => id !== playerId);
      }
    }

    room.players.delete(playerId);

    // 如果房间空了，删除房间
    if (room.players.size === 0) {
      this.deleteRoom(roomId);
      return true;
    }

    // 如果主持人离开，转移主持人
    if (playerId === room.hostId) {
      const newHost = room.players.values().next().value;
      if (newHost) {
        newHost.isHost = true;
        room.hostId = newHost.id;
      }
    }

    return true;
  }

  getPlayer(roomId: string, playerId: string): Player | undefined {
    const room = this.rooms.get(roomId);
    return room?.players.get(playerId);
  }

  updatePlayer(roomId: string, playerId: string, updates: Partial<Player>): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    Object.assign(player, updates);
    return true;
  }

  // 队伍操作
  createTeams(playerCount: number, playersPerTeam: number): Team[] {
    const teamCount = playerCount / playersPerTeam;
    return Array.from({ length: teamCount }, (_, i) => ({
      id: i,
      color: TEAM_COLORS[i],
      players: [],
      stoneCount: 0,
      wins: 0,
    }));
  }

  joinTeam(roomId: string, playerId: string, teamId: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    const team = room.teams.find(t => t.id === teamId);
    if (!team) return false;

    // 计算当前配置下每队最大人数
    const config = room.gameState?.config || { playerCount: 4, playersPerTeam: 2, totalRounds: 3 };
    if (team.players.length >= config.playersPerTeam) return false;

    // 先从原来的队伍中移除
    if (player.teamId !== null) {
      const oldTeam = room.teams.find(t => t.id === player.teamId);
      if (oldTeam) {
        oldTeam.players = oldTeam.players.filter(id => id !== playerId);
      }
    }

    // 加入新队伍
    team.players.push(playerId);
    player.teamId = teamId;
    player.isReady = false;

    return true;
  }

  leaveTeam(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player || player.teamId === null) return false;

    const team = room.teams.find(t => t.id === player.teamId);
    if (team) {
      team.players = team.players.filter(id => id !== playerId);
    }

    player.teamId = null;
    player.isReady = false;

    return true;
  }

  // 游戏配置
  configureGame(roomId: string, config: GameConfig): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // 重新创建队伍
    room.teams = this.createTeams(config.playerCount, config.playersPerTeam);

    // 重置所有玩家的队伍和准备状态
    room.players.forEach(player => {
      player.teamId = null;
      player.isReady = false;
    });

    // 初始化游戏状态
    room.gameState = this.createInitialGameState(config);

    return true;
  }

  createInitialGameState(config: GameConfig): GomokuState {
    return {
      board: Array.from({ length: BOARD_SIZE }, () => 
        Array.from({ length: BOARD_SIZE }, () => null)
      ),
      currentRound: 0,
      roundTimeLeft: 5,
      roundMoves: [],
      phase: 'waiting',
      config,
      roundResults: [],
      gameHistory: [],
    };
  }

  // 游戏操作
  startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return false;

    // 检查所有参与者是否都准备好了
    const config = room.gameState.config;
    const requiredPlayers = config.playerCount;
    
    let totalPlayers = 0;
    let allReady = true;

    room.teams.forEach(team => {
      totalPlayers += team.players.length;
      team.players.forEach(playerId => {
        const player = room.players.get(playerId);
        if (!player?.isReady) allReady = false;
      });
    });

    if (totalPlayers !== requiredPlayers || !allReady) return false;

    room.gameState.phase = 'playing';
    room.gameState.currentRound = 1;
    room.gameState.roundTimeLeft = 5;
    room.mode = 'game';

    return true;
  }

  // 落子
  placeStone(roomId: string, playerId: string, position: [number, number]): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return false;
    if (room.gameState.phase !== 'playing') return false;

    const player = room.players.get(playerId);
    if (!player || player.teamId === null) return false;

    const [row, col] = position;
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;

    // 检查该位置是否已经有棋子
    if (room.gameState.board[row][col] !== null) return false;

    // 检查该玩家本回合是否已经落子
    const existingMove = room.gameState.roundMoves.find(m => m.playerId === playerId);
    if (existingMove) {
      // 更新位置
      existingMove.position = position;
      existingMove.timestamp = Date.now();
    } else {
      // 添加新落子
      room.gameState.roundMoves.push({
        playerId,
        teamId: player.teamId,
        position,
        timestamp: Date.now(),
      });
    }

    return true;
  }

  // 获取房间的序列化数据（用于发送给客户端）
  serializeRoom(room: Room): object {
    return {
      id: room.id,
      hostId: room.hostId,
      players: Array.from(room.players.values()),
      teams: room.teams,
      gameType: room.gameType,
      gameState: room.gameState,
      mode: room.mode,
      createdAt: room.createdAt,
    };
  }

  // 获取对特定玩家可见的游戏状态
  getVisibleGameState(room: Room, playerId: string): GomokuState | null {
    if (!room.gameState) return null;

    const player = room.players.get(playerId);
    if (!player) return room.gameState;

    // 在游戏进行中，只显示队友的落子
    if (room.gameState.phase === 'playing' && player.teamId !== null) {
      const visibleMoves = room.gameState.roundMoves.filter(
        move => move.teamId === player.teamId
      );
      return {
        ...room.gameState,
        roundMoves: visibleMoves,
      };
    }

    return room.gameState;
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// 单例导出
export const gameStore = new GameStore();
