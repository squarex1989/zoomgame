'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/lib/websocket/client';
import { Header } from '@/components/zoom/Header';
import { ControlBar } from '@/components/zoom/ControlBar';
import { MeetingView, GalleryView } from '@/components/zoom/MeetingView';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameType, Player } from '@/lib/game/types';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const router = useRouter();
  
  const {
    playerId,
    playerName,
    room,
    isConnected,
    joinRoom,
    leaveRoom,
    selectTeam,
    leaveTeam,
    ready,
    unready,
    configGame,
    placeStone,
    switchMode,
    setCustomName,
  } = useGameState();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewMode, setViewMode] = useState<'speaker' | 'gallery'>('speaker');
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [hasJoinedOnce, setHasJoinedOnce] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [inputName, setInputName] = useState('');
  const hasCheckedRoom = useRef(false);
  
  // 保存上一次有效的 room 数据，用于重连时保持 UI
  const lastRoomRef = useRef<any>(null);
  if (room) {
    lastRoomRef.current = room;
  }

  // 检查是否需要输入名字
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setInputName(savedName);
      setCustomName(savedName);
    } else {
      setShowNameInput(true);
    }
  }, [setCustomName]);

  // 检查房间是否存在（只执行一次）
  useEffect(() => {
    if (hasCheckedRoom.current || showNameInput) return;
    hasCheckedRoom.current = true;
    
    const checkRoom = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}`);
        const data = await response.json();
        
        if (data.success) {
          setRoomExists(true);
          // 保存房间 ID，让 WebSocket 自动加入
          sessionStorage.setItem('currentRoomId', roomId);
        } else {
          setRoomExists(false);
        }
      } catch (error) {
        setRoomExists(false);
      }
    };

    checkRoom();
  }, [roomId, showNameInput]);

  // 首次连接成功后标记已加入
  useEffect(() => {
    if (isConnected && room && !hasJoinedOnce) {
      setHasJoinedOnce(true);
    }
  }, [isConnected, room, hasJoinedOnce]);

  // 提交名字
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputName.trim();
    if (name) {
      localStorage.setItem('playerName', name);
      setCustomName(name);
      setShowNameInput(false);
      hasCheckedRoom.current = false; // 重新检查房间
    }
  };

  const handleLeave = () => {
    leaveRoom();
    router.push('/');
  };

  const handleSwitchMode = () => {
    const currentRoom = room || lastRoomRef.current;
    if (currentRoom) {
      switchMode(currentRoom.mode === 'meeting' ? 'game' : 'meeting');
    }
  };

  const handleSelectGame = (game: GameType) => {
    // 目前只支持五子棋
    if (game !== 'gomoku') {
      alert('Coming Soon!');
    }
  };

  // 名字输入界面
  if (showNameInput) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="bg-[#1A1A1A] rounded-2xl p-8 w-full max-w-md mx-4 border border-[#2D2D2D]">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👋</div>
            <h2 className="text-white text-2xl font-bold mb-2">欢迎加入</h2>
            <p className="text-gray-400">请输入你的名字</p>
          </div>
          
          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="你的名字"
              className="w-full px-4 py-3 bg-[#2D2D2D] border border-[#3D3D3D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-center text-lg mb-4"
              autoFocus
              maxLength={20}
            />
            <button
              type="submit"
              disabled={!inputName.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              进入房间
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 加载中状态
  if (roomExists === null) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">正在加载房间...</p>
        </div>
      </div>
    );
  }

  // 房间不存在
  if (roomExists === false) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-white text-2xl font-bold mb-2">房间不存在</h2>
          <p className="text-gray-400 mb-6">房间可能已关闭或链接有误</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 使用当前 room 或缓存的 room（用于重连时保持 UI）
  const displayRoom = room || lastRoomRef.current;

  // 首次加载时等待 WebSocket 连接
  if (!hasJoinedOnce && (!isConnected || !displayRoom)) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">正在连接服务器...</p>
        </div>
      </div>
    );
  }

  // 如果完全没有数据（异常情况）
  if (!displayRoom) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">正在重新连接...</p>
        </div>
      </div>
    );
  }

  const players: Player[] = displayRoom.players || [];
  const currentPlayer = players.find((p: Player) => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;
  const isGameMode = displayRoom.mode === 'game';

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* 顶部 Header */}
      <Header
        roomId={roomId}
        participantCount={players.length}
        isGameMode={isGameMode}
        isConnected={isConnected}
        onGameModeToggle={handleSwitchMode}
      />

      {/* 主内容区 */}
      {isGameMode ? (
        <GameCanvas
          gameType={displayRoom.gameType}
          gameState={displayRoom.gameState}
          players={players}
          teams={displayRoom.teams}
          currentPlayerId={playerId}
          isHost={isHost}
          onSelectGame={handleSelectGame}
          onJoinTeam={selectTeam}
          onLeaveTeam={leaveTeam}
          onReady={ready}
          onUnready={unready}
          onConfigChange={configGame}
          onStartGame={() => {}}
          onPlaceStone={placeStone}
        />
      ) : (
        viewMode === 'speaker' ? (
          <MeetingView
            players={players}
            currentPlayerId={playerId}
            activePlayerId={displayRoom.hostId}
          />
        ) : (
          <GalleryView
            players={players}
            currentPlayerId={playerId}
          />
        )
      )}

      {/* 底部控制栏 */}
      <ControlBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isGameMode={isGameMode}
        isHost={isHost}
        participantCount={players.length}
        onMuteToggle={() => setIsMuted(!isMuted)}
        onVideoToggle={() => setIsVideoOff(!isVideoOff)}
        onGameModeToggle={handleSwitchMode}
        onLeave={handleLeave}
      />
    </div>
  );
}
