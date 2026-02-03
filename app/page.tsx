'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError('');
    
    try {
      const response = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push(`/room/${data.roomId}`);
      } else {
        setError('创建房间失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      setError('请输入房间号');
      return;
    }
    router.push(`/room/${joinRoomId.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1A1A2E] to-[#16213E] flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-2">
            <span className="text-[#0E72ED]">zoom</span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {' '}for fun
            </span>
          </h1>
          <p className="text-gray-400 text-lg">多人在线聚会游戏平台</p>
        </div>

        {/* 主卡片 */}
        <div className="bg-[#1A1A1A]/80 backdrop-blur-xl rounded-2xl p-8 border border-[#2D2D2D] shadow-2xl">
          {/* 游戏展示 */}
          <div className="flex justify-center gap-4 mb-8">
            <GameCard icon="⚫" name="多人五子棋" available />
            <GameCard icon="🦆" name="鹅鸭杀" />
            <GameCard icon="🔷" name="Shape On!" />
          </div>

          {/* 创建房间 */}
          <Button
            variant="primary"
            size="lg"
            className="w-full mb-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <span className="animate-spin">◌</span>
                创建中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                创建游戏房间
              </>
            )}
          </Button>

          {/* 分割线 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#2D2D2D]" />
            <span className="text-gray-500 text-sm">或者</span>
            <div className="flex-1 h-px bg-[#2D2D2D]" />
          </div>

          {/* 加入房间 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={joinRoomId}
              onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
              placeholder="输入房间号"
              className="flex-1 bg-[#2D2D2D] border border-[#3D3D3D] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-center tracking-widest"
              maxLength={6}
            />
            <Button variant="secondary" size="lg" onClick={handleJoinRoom}>
              加入
            </Button>
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-red-400 text-sm text-center mt-4">{error}</p>
          )}
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>无需登录，创建房间后分享链接给朋友即可开始游戏</p>
        </div>
      </div>
    </div>
  );
}

function GameCard({ icon, name, available }: { icon: string; name: string; available?: boolean }) {
  return (
    <div
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-xl
        ${available 
          ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30' 
          : 'bg-[#2D2D2D]/50 border border-[#3D3D3D]'
        }
      `}
    >
      <span className="text-3xl">{icon}</span>
      <span className={`text-xs ${available ? 'text-white' : 'text-gray-500'}`}>{name}</span>
      {!available && (
        <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
          Soon
        </span>
      )}
    </div>
  );
}
