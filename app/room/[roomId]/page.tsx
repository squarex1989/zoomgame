'use client';

import React, { useState, useEffect, use } from 'react';
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
  } = useGameState();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewMode, setViewMode] = useState<'speaker' | 'gallery'>('speaker');
  const [roomExists, setRoomExists] = useState<boolean | null>(null);

  // 检查房间是否存在
  useEffect(() => {
    const checkRoom = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}`);
        const data = await response.json();
        
        if (data.success) {
          setRoomExists(true);
        } else {
          setRoomExists(false);
        }
      } catch (error) {
        setRoomExists(false);
      }
    };

    checkRoom();
  }, [roomId]);

  // 连接成功后加入房间
  useEffect(() => {
    if (isConnected && roomExists && !room) {
      joinRoom(roomId);
    }
  }, [isConnected, roomExists, roomId, room, joinRoom]);

  const handleLeave = () => {
    leaveRoom();
    router.push('/');
  };

  const handleSwitchMode = () => {
    if (room) {
      switchMode(room.mode === 'meeting' ? 'game' : 'meeting');
    }
  };

  const handleSelectGame = (game: GameType) => {
    // 目前只支持五子棋
    if (game !== 'gomoku') {
      alert('Coming Soon!');
    }
  };

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

  // 等待 WebSocket 连接
  if (!isConnected || !room) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">正在连接服务器...</p>
        </div>
      </div>
    );
  }

  const players: Player[] = room.players || [];
  const currentPlayer = players.find((p: Player) => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;
  const isGameMode = room.mode === 'game';

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* 顶部 Header */}
      <Header
        roomId={roomId}
        participantCount={players.length}
        isGameMode={isGameMode}
      />

      {/* 主内容区 */}
      {isGameMode ? (
        <GameCanvas
          gameType={room.gameType}
          gameState={room.gameState}
          players={players}
          teams={room.teams}
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
            activePlayerId={room.hostId}
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
        onMuteToggle={() => setIsMuted(!isMuted)}
        onVideoToggle={() => setIsVideoOff(!isVideoOff)}
        onGameModeToggle={handleSwitchMode}
        onLeave={handleLeave}
      />
    </div>
  );
}
