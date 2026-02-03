'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WSMessage, WSMessageType } from '../game/types';

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (type: WSMessageType, payload: unknown) => void;
  lastMessage: WSMessage | null;
}

export function useWebSocket(
  onMessage?: (message: WSMessage) => void
): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      // 获取已保存的 playerId（用于重连）
      const savedPlayerId = sessionStorage.getItem('playerId') || '';
      
      // 自动检测协议和主机，使用 /ws 路径
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?playerId=${savedPlayerId}`;
      
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 1000); // 快速重连
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const send = useCallback((type: WSMessageType, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { isConnected, send, lastMessage };
}

// 游戏状态管理 Hook
export interface GameState {
  playerId: string | null;
  playerName: string | null;
  room: any | null;
  isConnected: boolean;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    // 从 sessionStorage 恢复状态（如果有的话）
    if (typeof window !== 'undefined') {
      const savedPlayerId = sessionStorage.getItem('playerId');
      const savedPlayerName = sessionStorage.getItem('playerName');
      return {
        playerId: savedPlayerId,
        playerName: savedPlayerName,
        room: null,
        isConnected: false,
      };
    }
    return {
      playerId: null,
      playerName: null,
      room: null,
      isConnected: false,
    };
  });

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'STATE_SYNC':
        const payload = message.payload as any;
        // 保存 playerId 和 playerName 到 sessionStorage，用于重连
        if (payload.playerId) {
          sessionStorage.setItem('playerId', payload.playerId);
        }
        if (payload.playerName) {
          sessionStorage.setItem('playerName', payload.playerName);
        }
        setState(prev => ({
          ...prev,
          playerId: payload.playerId ?? prev.playerId,
          playerName: payload.playerName ?? prev.playerName,
          room: payload.room ?? prev.room,
        }));
        break;
      case 'SWITCH_MODE':
      case 'PLAYER_JOINED':
      case 'PLAYER_LEFT':
        // 这些消息会在后续的 STATE_SYNC 中处理
        break;
      case 'ERROR':
        console.error('Server error:', (message.payload as any).message);
        break;
    }
  }, []);

  const { isConnected, send, lastMessage } = useWebSocket(handleMessage);

  useEffect(() => {
    setState(prev => ({ ...prev, isConnected }));
  }, [isConnected]);

  const joinRoom = useCallback((roomId: string) => {
    send('JOIN_ROOM', { roomId });
  }, [send]);

  const leaveRoom = useCallback(() => {
    send('LEAVE_ROOM', {});
    setState(prev => ({ ...prev, room: null }));
  }, [send]);

  const selectTeam = useCallback((teamId: number) => {
    send('SELECT_TEAM', { teamId });
  }, [send]);

  const leaveTeam = useCallback(() => {
    send('LEAVE_TEAM', {});
  }, [send]);

  const ready = useCallback(() => {
    send('READY', {});
  }, [send]);

  const unready = useCallback(() => {
    send('UNREADY', {});
  }, [send]);

  const configGame = useCallback((config: { playerCount: number; playersPerTeam: number; totalRounds: number }) => {
    send('CONFIG_GAME', config);
  }, [send]);

  const startGame = useCallback(() => {
    send('START_GAME', {});
  }, [send]);

  const placeStone = useCallback((position: [number, number]) => {
    send('PLACE_STONE', { position });
  }, [send]);

  const switchMode = useCallback((mode: 'meeting' | 'game') => {
    send('SWITCH_MODE', { mode });
  }, [send]);

  return {
    ...state,
    isConnected,
    lastMessage,
    joinRoom,
    leaveRoom,
    selectTeam,
    leaveTeam,
    ready,
    unready,
    configGame,
    startGame,
    placeStone,
    switchMode,
  };
}
