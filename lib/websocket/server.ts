import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { gameStore } from '../store';
import { 
  WSMessage, 
  Player, 
  RANDOM_NAMES, 
  getAvatarUrl,
  GameConfig,
  getRoundTime,
} from '../game/types';
import { GomokuEngine } from '../game/gomoku-engine';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'url';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string | null;
  playerName: string;
  isAlive: boolean;
}

class GameWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private roundTimers: Map<string, NodeJS.Timeout> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map(); // 断线保护
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    // 处理 WebSocket 升级请求
    server.on('upgrade', (req, socket, head) => {
      const { pathname } = parse(req.url || '', true);
      
      // 只处理 /ws 路径的 WebSocket 请求
      if (pathname === '/ws') {
        this.wss!.handleUpgrade(req, socket, head, (ws) => {
          this.wss!.emit('connection', ws, req);
        });
      } else {
        // 非 /ws 路径，关闭连接
        socket.destroy();
      }
    });

    // 心跳检测：每 25 秒 ping 一次，防止连接被关闭
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((conn, ws) => {
        if (!conn.isAlive) {
          // 上次 ping 没有收到 pong，连接可能已断开
          return ws.terminate();
        }
        conn.isAlive = false;
        ws.ping();
      });
    }, 25000);

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('WebSocket client connected');
      
      // 检查是否有保存的 playerId 和自定义名字
      const { query } = parse(req.url || '', true);
      const savedPlayerId = query.playerId as string;
      const customName = query.name as string;
      
      let playerId: string;
      let playerName: string;
      let isReconnect = false;
      
      // 如果有保存的 playerId，尝试恢复
      if (savedPlayerId && this.disconnectTimers.has(savedPlayerId)) {
        // 取消断线计时器
        const timer = this.disconnectTimers.get(savedPlayerId);
        if (timer) {
          clearTimeout(timer);
          this.disconnectTimers.delete(savedPlayerId);
        }
        playerId = savedPlayerId;
        playerName = customName || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
        isReconnect = true;
        console.log(`Player ${playerId} reconnected`);
      } else {
        playerId = uuidv4();
        // 使用自定义名字或随机名字
        playerName = customName || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      }
      
      const connection: ClientConnection = {
        ws,
        playerId,
        roomId: null,
        playerName,
        isAlive: true,
      };
      
      this.clients.set(ws, connection);

      // 发送玩家信息
      this.send(ws, {
        type: 'STATE_SYNC',
        payload: {
          playerId,
          playerName,
          isReconnect,
        },
      });

      // 心跳响应
      ws.on('pong', () => {
        const conn = this.clients.get(ws);
        if (conn) conn.isAlive = true;
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        const conn = this.clients.get(ws);
        if (conn && conn.roomId) {
          // 设置断线保护计时器，30秒后才真正移除玩家
          const playerId = conn.playerId;
          const roomId = conn.roomId;
          
          // 清除之前的计时器（如果有）
          const existingTimer = this.disconnectTimers.get(playerId);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }
          
          const timer = setTimeout(() => {
            console.log(`Player ${playerId} grace period expired, removing from room`);
            gameStore.removePlayer(roomId, playerId);
            this.disconnectTimers.delete(playerId);
            
            // 通知房间内其他玩家
            this.broadcastToRoom(roomId, {
              type: 'PLAYER_LEFT',
              payload: { playerId },
            });
            this.broadcastRoomState(roomId);
          }, 600000); // 10 分钟保护期
          
          this.disconnectTimers.set(playerId, timer);
        }
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('WebSocket server initialized');
  }

  private handleMessage(ws: WebSocket, message: WSMessage) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    switch (message.type) {
      case 'JOIN_ROOM':
        this.handleJoinRoom(ws, message.payload as { roomId: string });
        break;
      case 'LEAVE_ROOM':
        this.handleLeaveRoom(ws);
        break;
      case 'SELECT_TEAM':
        this.handleSelectTeam(ws, message.payload as { teamId: number });
        break;
      case 'LEAVE_TEAM':
        this.handleLeaveTeam(ws);
        break;
      case 'READY':
        this.handleReady(ws);
        break;
      case 'UNREADY':
        this.handleUnready(ws);
        break;
      case 'CONFIG_GAME':
        this.handleConfigGame(ws, message.payload as GameConfig);
        break;
      case 'START_GAME':
        this.handleStartGame(ws);
        break;
      case 'PLACE_STONE':
        this.handlePlaceStone(ws, message.payload as { position: [number, number] });
        break;
      case 'SKIP_ROUND':
        this.handleSkipRound(ws);
        break;
      case 'SWITCH_MODE':
        this.handleSwitchMode(ws, message.payload as { mode: 'meeting' | 'game' });
        break;
      case 'SET_NAME':
        this.handleSetName(ws, message.payload as { name: string });
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleJoinRoom(ws: WebSocket, payload: { roomId: string }) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    const room = gameStore.getRoom(payload.roomId);
    if (!room) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Room not found' } });
      return;
    }

    // 检查该玩家是否已在房间中（重连情况）
    const existingPlayer = room.players.get(conn.playerId);
    if (existingPlayer) {
      // 重连：恢复玩家名称到连接中
      conn.playerName = existingPlayer.name;
      conn.roomId = payload.roomId;
      console.log(`Player ${conn.playerId} rejoined room ${payload.roomId}`);
      this.sendRoomState(ws, payload.roomId);
      return;
    }

    // 第一个加入的玩家成为 host
    const isHost = room.players.size === 0;

    const player: Player = {
      id: conn.playerId,
      name: conn.playerName,
      avatar: getAvatarUrl(conn.playerName),
      isHost,
      isReady: false,
      teamId: null,
    };

    gameStore.addPlayer(payload.roomId, player);
    conn.roomId = payload.roomId;

    // 如果是第一个玩家，设置为 host
    if (isHost) {
      room.hostId = conn.playerId;
    }

    // 通知房间内其他玩家
    this.broadcastToRoom(payload.roomId, {
      type: 'PLAYER_JOINED',
      payload: { player },
    }, ws);

    // 发送完整房间状态给新玩家
    this.sendRoomState(ws, payload.roomId);
  }

  private handleLeaveRoom(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    const roomId = conn.roomId;
    gameStore.removePlayer(roomId, conn.playerId);
    conn.roomId = null;

    // 通知房间内其他玩家
    this.broadcastToRoom(roomId, {
      type: 'PLAYER_LEFT',
      payload: { playerId: conn.playerId },
    });
  }

  private handleSelectTeam(ws: WebSocket, payload: { teamId: number }) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    const success = gameStore.joinTeam(conn.roomId, conn.playerId, payload.teamId);
    if (success) {
      this.broadcastRoomState(conn.roomId);
    } else {
      this.send(ws, { type: 'ERROR', payload: { message: 'Cannot join team' } });
    }
  }

  private handleLeaveTeam(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    gameStore.leaveTeam(conn.roomId, conn.playerId);
    this.broadcastRoomState(conn.roomId);
  }

  private handleReady(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    gameStore.updatePlayer(conn.roomId, conn.playerId, { isReady: true });
    this.broadcastRoomState(conn.roomId);

    // 检查是否所有人都准备好了
    this.checkAllReady(conn.roomId);
  }

  private handleUnready(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    gameStore.updatePlayer(conn.roomId, conn.playerId, { isReady: false });
    this.broadcastRoomState(conn.roomId);
  }

  private handleConfigGame(ws: WebSocket, config: GameConfig) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    const room = gameStore.getRoom(conn.roomId);
    if (!room || room.hostId !== conn.playerId) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Only host can configure game' } });
      return;
    }

    gameStore.configureGame(conn.roomId, config);
    this.broadcastRoomState(conn.roomId);
  }

  private handleStartGame(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    const room = gameStore.getRoom(conn.roomId);
    if (!room || room.hostId !== conn.playerId) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Only host can start game' } });
      return;
    }

    const success = gameStore.startGame(conn.roomId);
    if (success) {
      this.broadcastToRoom(conn.roomId, {
        type: 'START_GAME',
        payload: {},
      });
      this.startRoundTimer(conn.roomId);
      this.broadcastRoomState(conn.roomId);
    }
  }

  private handlePlaceStone(ws: WebSocket, payload: { position: [number, number] }) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    const success = gameStore.placeStone(conn.roomId, conn.playerId, payload.position);
    if (success) {
      // 只发送给队友
      this.broadcastToTeammates(conn.roomId, conn.playerId);
      
      // 检查是否所有人都落子了
      this.checkAllMoved(conn.roomId);
    }
  }

  private handleSkipRound(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    this.checkAllMoved(conn.roomId);
  }

  private handleSwitchMode(ws: WebSocket, payload: { mode: 'meeting' | 'game' }) {
    const conn = this.clients.get(ws);
    if (!conn || !conn.roomId) return;

    const room = gameStore.getRoom(conn.roomId);
    if (!room || room.hostId !== conn.playerId) {
      this.send(ws, { type: 'ERROR', payload: { message: 'Only host can switch mode' } });
      return;
    }

    room.mode = payload.mode;
    
    if (payload.mode === 'game' && !room.gameState) {
      gameStore.configureGame(conn.roomId, { playerCount: 4, playersPerTeam: 2, totalRounds: 3 });
    }

    this.broadcastToRoom(conn.roomId, {
      type: 'SWITCH_MODE',
      payload: { mode: payload.mode },
    });
    this.broadcastRoomState(conn.roomId);
  }

  private handleSetName(ws: WebSocket, payload: { name: string }) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    const name = payload.name.trim().substring(0, 20); // 限制长度
    if (!name) return;

    conn.playerName = name;

    // 如果在房间中，更新玩家名字
    if (conn.roomId) {
      gameStore.updatePlayer(conn.roomId, conn.playerId, { 
        name,
        avatar: getAvatarUrl(name),
      });
      this.broadcastRoomState(conn.roomId);
    }
  }

  private checkAllReady(roomId: string) {
    const room = gameStore.getRoom(roomId);
    if (!room || !room.gameState) return;

    const config = room.gameState.config;
    let totalPlayers = 0;
    let readyPlayers = 0;

    room.teams.forEach(team => {
      team.players.forEach(playerId => {
        totalPlayers++;
        const player = room.players.get(playerId);
        if (player?.isReady) readyPlayers++;
      });
    });

    if (totalPlayers === config.playerCount && readyPlayers === config.playerCount) {
      gameStore.startGame(roomId);
      this.broadcastToRoom(roomId, {
        type: 'START_GAME',
        payload: {},
      });
      this.startRoundTimer(roomId);
      this.broadcastRoomState(roomId);
    }
  }

  private checkAllMoved(roomId: string) {
    const room = gameStore.getRoom(roomId);
    if (!room || !room.gameState || room.gameState.phase !== 'playing') return;

    const config = room.gameState.config;
    const movedPlayers = room.gameState.roundMoves.length;

    if (movedPlayers >= config.playerCount) {
      this.endRound(roomId);
    }
  }

  private startRoundTimer(roomId: string) {
    const room = gameStore.getRoom(roomId);
    if (!room || !room.gameState) return;

    const existingTimer = this.roundTimers.get(roomId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const roundTime = getRoundTime(room.gameState.currentRound) * 1000;
    
    const timer = setTimeout(() => {
      this.endRound(roomId);
    }, roundTime);

    this.roundTimers.set(roomId, timer);

    this.broadcastToRoom(roomId, {
      type: 'ROUND_START',
      payload: {
        round: room.gameState.currentRound,
        timeLimit: roundTime / 1000,
      },
    });
  }

  private endRound(roomId: string) {
    const room = gameStore.getRoom(roomId);
    if (!room || !room.gameState) return;

    const timer = this.roundTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.roundTimers.delete(roomId);
    }

    room.gameState.phase = 'judging';

    const results = GomokuEngine.resolveRound(room.gameState, room.teams);
    room.gameState.roundResults = results;

    GomokuEngine.applyResults(room.gameState, results, room.teams);

    this.broadcastToRoom(roomId, {
      type: 'ROUND_END',
      payload: { results },
    });

    const gameResult = GomokuEngine.checkWinCondition(room.gameState, room.teams);
    
    if (gameResult.ended) {
      room.gameState.gameHistory.push({
        roundNumber: room.gameState.currentRound,
        winner: gameResult.winner,
        lineLength: gameResult.lineLength,
      });

      if (gameResult.winner) {
        const winningTeam = room.teams.find(t => t.color === gameResult.winner);
        if (winningTeam) winningTeam.wins++;
      }

      const totalGamesPlayed = room.gameState.gameHistory.length;
      if (totalGamesPlayed >= room.gameState.config.totalRounds) {
        room.gameState.phase = 'ended';
        this.broadcastToRoom(roomId, {
          type: 'GAME_END',
          payload: {
            history: room.gameState.gameHistory,
            teams: room.teams,
            finalWinner: this.determineFinalWinner(room.teams),
          },
        });
      } else {
        setTimeout(() => {
          this.startNextGame(roomId);
        }, 3000);
      }
    } else {
      setTimeout(() => {
        this.startNextRound(roomId);
      }, 2000);
    }

    this.broadcastRoomState(roomId);
  }

  private startNextRound(roomId: string) {
    const room = gameStore.getRoom(roomId);
    if (!room || !room.gameState) return;

    room.gameState.currentRound++;
    room.gameState.roundMoves = [];
    room.gameState.roundResults = [];
    room.gameState.phase = 'playing';

    this.startRoundTimer(roomId);
    this.broadcastRoomState(roomId);
  }

  private startNextGame(roomId: string) {
    const room = gameStore.getRoom(roomId);
    if (!room || !room.gameState) return;

    const config = room.gameState.config;
    const history = room.gameState.gameHistory;
    
    // 重置游戏状态
    room.gameState = gameStore.createInitialGameState(config);
    room.gameState.gameHistory = history;
    room.gameState.phase = 'waiting'; // 等待所有人准备
    room.gameState.currentRound = 0;

    // 重置队伍的棋子数量
    room.teams.forEach(team => {
      team.stoneCount = 0;
    });

    // 重置所有玩家的准备状态（但保持队伍）
    room.players.forEach(player => {
      player.isReady = false;
    });

    // 通知所有人一局结束，等待下一局
    this.broadcastToRoom(roomId, {
      type: 'GAME_RESET',
      payload: { 
        message: '本局结束，请准备开始下一局',
        gamesPlayed: history.length,
        totalGames: config.totalRounds,
      },
    });
    
    this.broadcastRoomState(roomId);
  }

  private determineFinalWinner(teams: any[]): string | null {
    const maxWins = Math.max(...teams.map(t => t.wins));
    const winners = teams.filter(t => t.wins === maxWins);
    
    if (winners.length === 1) {
      return winners[0].color;
    }
    return null;
  }

  private broadcastToTeammates(roomId: string, playerId: string) {
    const room = gameStore.getRoom(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player || player.teamId === null) return;

    this.clients.forEach((conn, ws) => {
      if (conn.roomId === roomId) {
        const connPlayer = room.players.get(conn.playerId);
        if (connPlayer && connPlayer.teamId === player.teamId) {
          this.sendRoomState(ws, roomId);
        }
      }
    });
  }

  private sendRoomState(ws: WebSocket, roomId: string) {
    const room = gameStore.getRoom(roomId);
    if (!room) return;

    const conn = this.clients.get(ws);
    if (!conn) return;

    const visibleGameState = gameStore.getVisibleGameState(room, conn.playerId);
    
    this.send(ws, {
      type: 'STATE_SYNC',
      payload: {
        room: {
          ...gameStore.serializeRoom(room),
          gameState: visibleGameState,
        },
        playerId: conn.playerId,
        playerName: conn.playerName,
      },
    });
  }

  private broadcastRoomState(roomId: string) {
    this.clients.forEach((conn, ws) => {
      if (conn.roomId === roomId) {
        this.sendRoomState(ws, roomId);
      }
    });
  }

  private broadcastToRoom(roomId: string, message: any, exclude?: WebSocket) {
    this.clients.forEach((conn, ws) => {
      if (conn.roomId === roomId && ws !== exclude) {
        this.send(ws, message);
      }
    });
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

export const wsServer = new GameWebSocketServer();
