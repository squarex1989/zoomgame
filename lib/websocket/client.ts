'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WSMessage, WSMessageType, WebRTCSignalPayload } from '../game/types';

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (type: WSMessageType, payload: unknown) => void;
  lastMessage: WSMessage | null;
  onWebRTCSignal: (callback: (fromId: string, signal: unknown) => void) => void;
  sendWebRTCSignal: (targetId: string, signal: unknown) => void;
}

export function useWebSocket(
  onMessage?: (message: WSMessage) => void
): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessage);
  const webrtcCallbackRef = useRef<((fromId: string, signal: unknown) => void) | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      // 获取已保存的 playerId 和自定义名字（用于重连）
      const savedPlayerId = sessionStorage.getItem('playerId') || '';
      const savedCustomName = localStorage.getItem('playerName') || '';
      
      // 自动检测协议和主机，使用 /ws 路径
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?playerId=${savedPlayerId}&name=${encodeURIComponent(savedCustomName)}`;
      
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // 自动重新加入之前的房间
        const savedRoomId = sessionStorage.getItem('currentRoomId');
        if (savedRoomId) {
          console.log('Auto-rejoining room:', savedRoomId);
          ws.send(JSON.stringify({ type: 'JOIN_ROOM', payload: { roomId: savedRoomId } }));
        }
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
          
          // 特殊处理 WebRTC 信令消息
          if (message.type === 'WEBRTC_SIGNAL') {
            const payload = message.payload as { fromId: string; signal: unknown };
            webrtcCallbackRef.current?.(payload.fromId, payload.signal);
            return;
          }
          
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

  const onWebRTCSignal = useCallback((callback: (fromId: string, signal: unknown) => void) => {
    webrtcCallbackRef.current = callback;
  }, []);

  const sendWebRTCSignal = useCallback((targetId: string, signal: unknown) => {
    send('WEBRTC_SIGNAL', { targetId, signal });
  }, [send]);

  return { isConnected, send, lastMessage, onWebRTCSignal, sendWebRTCSignal };
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
    // 从 localStorage/sessionStorage 恢复状态
    if (typeof window !== 'undefined') {
      const savedPlayerId = sessionStorage.getItem('playerId');
      const customName = localStorage.getItem('playerName');
      const savedPlayerName = customName || sessionStorage.getItem('playerName');
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
  
  // 自定义名字
  const [customName, setCustomNameState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('playerName');
    }
    return null;
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
        // 只有当数据真正变化时才更新状态，避免不必要的渲染
        setState(prev => {
          const newPlayerId = payload.playerId ?? prev.playerId;
          const newPlayerName = payload.playerName ?? prev.playerName;
          const newRoom = payload.room ?? prev.room;
          
          // 如果数据没变化，返回原状态，避免重新渲染
          if (
            prev.playerId === newPlayerId &&
            prev.playerName === newPlayerName &&
            JSON.stringify(prev.room) === JSON.stringify(newRoom)
          ) {
            return prev;
          }
          
          return {
            ...prev,
            playerId: newPlayerId,
            playerName: newPlayerName,
            room: newRoom,
          };
        });
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

  const { isConnected, send, lastMessage, onWebRTCSignal, sendWebRTCSignal } = useWebSocket(handleMessage);

  useEffect(() => {
    setState(prev => {
      if (prev.isConnected === isConnected) return prev;
      return { ...prev, isConnected };
    });
  }, [isConnected]);

  const joinRoom = useCallback((roomId: string) => {
    // 保存房间 ID，用于重连
    sessionStorage.setItem('currentRoomId', roomId);
    send('JOIN_ROOM', { roomId });
  }, [send]);

  const leaveRoom = useCallback(() => {
    sessionStorage.removeItem('currentRoomId');
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

  const setCustomName = useCallback((name: string) => {
    setCustomNameState(name);
    localStorage.setItem('playerName', name);
    // 如果已连接，发送更新名字的消息
    send('SET_NAME', { name });
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
    setCustomName,
    onWebRTCSignal,
    sendWebRTCSignal,
  };
}
