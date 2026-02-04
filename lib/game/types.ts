// 玩家相关类型
export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  teamId: number | null; // null 表示旁观者
}

// 队伍相关类型
export interface Team {
  id: number;
  color: TeamColor;
  players: string[]; // player ids
  stoneCount: number;
  wins: number;
}

export type TeamColor = 'red' | 'blue' | 'green' | 'yellow';

export const TEAM_COLORS: TeamColor[] = ['red', 'blue', 'green', 'yellow'];

export const TEAM_COLOR_HEX: Record<TeamColor, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
};

// 游戏配置
export interface GameConfig {
  playerCount: 4 | 8;
  playersPerTeam: 2 | 4;
  totalRounds: number; // 1-10
}

// 五子棋相关类型
export interface GomokuState {
  board: (TeamColor | null)[][]; // 15x15 棋盘
  currentRound: number;
  roundTimeLeft: number;
  roundMoves: RoundMove[]; // 当前回合的落子
  phase: GamePhase;
  config: GameConfig;
  roundResults: RoundResult[];
  gameHistory: GameResult[];
}

export type GamePhase = 'waiting' | 'ready' | 'playing' | 'judging' | 'ended';

export interface RoundMove {
  playerId: string;
  teamId: number;
  position: [number, number]; // [row, col]
  timestamp: number;
}

export interface RoundResult {
  position: [number, number];
  winner: TeamColor | null;
  contested: boolean;
  message: string;
}

export interface GameResult {
  roundNumber: number;
  winner: TeamColor | null;
  lineLength: number;
}

// 房间相关类型
export interface Room {
  id: string;
  hostId: string;
  players: Map<string, Player>;
  teams: Team[];
  gameType: GameType;
  gameState: GomokuState | null;
  mode: 'meeting' | 'game';
  createdAt: number;
}

export type GameType = 'gomoku' | 'goose-duck' | 'shape-on';

// WebSocket 消息类型
export type WSMessageType =
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'SELECT_TEAM'
  | 'LEAVE_TEAM'
  | 'READY'
  | 'UNREADY'
  | 'START_GAME'
  | 'CONFIG_GAME'
  | 'PLACE_STONE'
  | 'SKIP_ROUND'
  | 'ROUND_START'
  | 'ROUND_END'
  | 'GAME_END'
  | 'GAME_RESET'
  | 'SWITCH_MODE'
  | 'SET_NAME'
  | 'STATE_SYNC'
  | 'ERROR';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  playerId?: string;
  roomId?: string;
}

// 客户端发送的消息
export interface ClientMessage {
  type: WSMessageType;
  payload: unknown;
}

// 服务器发送的消息
export interface ServerMessage {
  type: WSMessageType;
  payload: unknown;
}

// 随机名字池
export const RANDOM_NAMES = [
  'Roy Green', 'Tracy Brooks', 'Dale Clarke', 'Rosa Griffin',
  'Phil Owen', 'Linda Lucas', 'Logan Kaur', 'Brittany Delaney',
  'Alex Chen', 'Jordan Taylor', 'Casey Morgan', 'Riley Anderson',
  'Quinn Parker', 'Avery Martinez', 'Drew Wilson', 'Cameron Lee',
];

// 头像池（使用 UI Avatars 服务生成）
export function getAvatarUrl(name: string): string {
  const colors = ['0D8ABC', 'F59E0B', '10B981', 'EF4444', '8B5CF6', 'EC4899'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[colorIndex]}&color=fff&size=128`;
}

// 棋盘常量
export const BOARD_SIZE = 15;
export const WIN_LENGTH = 5;

// 回合时间配置
export function getRoundTime(roundNumber: number): number {
  if (roundNumber <= 5) return 5;
  if (roundNumber <= 10) return 10;
  return 15;
}
