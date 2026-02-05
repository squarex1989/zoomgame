'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center p-4 relative overflow-hidden">
      {/* 装饰性植物 - 左下角 */}
      <div className="absolute bottom-0 left-8">
        <PlantDecoration />
      </div>

      {/* 装饰性时钟 - 左上角 */}
      <div className="absolute top-20 left-20">
        <ClockDecoration />
      </div>

      {/* 装饰性椅子人物 - 右侧 */}
      <div className="absolute bottom-0 right-0 hidden lg:block">
        <PeopleDecoration />
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-3">
            <span className="text-[#4A7C9B]">zoom</span>
            <span className="text-[#E07B67]"> for fun</span>
          </h1>
          <p className="text-[#6B5B4F] text-lg">多人在线聚会游戏平台</p>
        </div>

        {/* 主卡片 */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#E07B67]/10">
          {/* 游戏展示 */}
          <div className="flex justify-center gap-4 mb-8">
            <GameCard icon="⚫" name="多人五子棋" color="#4A7C9B" available />
            <GameCard icon="🦆" name="鹅鸭杀" color="#3D6B4A" />
            <GameCard icon="🔷" name="Shape On!" color="#E07B67" />
          </div>

          {/* 创建房间 */}
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#E07B67] to-[#D4694F] text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 hover:from-[#D4694F] hover:to-[#C25A42] transition-all shadow-lg shadow-[#E07B67]/30 disabled:opacity-70"
          >
            {isCreating ? (
              <>
                <span className="animate-spin text-xl">◌</span>
                创建中...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                创建游戏房间
              </>
            )}
          </button>

          {/* 分割线 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#E8E0D8]" />
            <span className="text-[#A89F95] text-sm">或者加入房间</span>
            <div className="flex-1 h-px bg-[#E8E0D8]" />
          </div>

          {/* 加入房间 */}
          <div className="flex gap-3">
            <input
              type="text"
              value={joinRoomId}
              onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
              placeholder="输入房间号"
              className="flex-1 bg-[#FAF7F4] border-2 border-[#E8E0D8] rounded-xl px-4 py-3 text-[#4A4A4A] placeholder-[#B5A89E] focus:outline-none focus:border-[#E07B67] font-mono text-center tracking-widest text-lg transition-colors"
              maxLength={6}
            />
            <button 
              onClick={handleJoinRoom}
              className="px-6 py-3 bg-[#4A7C9B] text-white rounded-xl font-semibold hover:bg-[#3D6B87] transition-colors"
            >
              加入
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-[#E07B67] text-sm text-center mt-4 flex items-center justify-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </p>
          )}
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-8 text-[#8B7E74] text-sm">
          <p>无需登录，创建房间后分享链接给朋友即可开始游戏</p>
        </div>
      </div>
    </div>
  );
}

function GameCard({ icon, name, color, available }: { icon: string; name: string; color: string; available?: boolean }) {
  return (
    <div
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-transform hover:scale-105
        ${available 
          ? 'bg-gradient-to-br from-white to-[#FAF7F4] border-2 shadow-md' 
          : 'bg-[#FAF7F4] border-2 border-dashed'
        }
      `}
      style={{ borderColor: available ? color : '#D4CCC4' }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: available ? `${color}20` : '#EBE5DE' }}
      >
        {icon}
      </div>
      <span 
        className="text-xs font-medium"
        style={{ color: available ? color : '#A89F95' }}
      >
        {name}
      </span>
      {!available && (
        <span 
          className="absolute -top-2 -right-2 text-white text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: '#E9B84A' }}
        >
          Soon
        </span>
      )}
    </div>
  );
}

// 植物装饰 SVG
function PlantDecoration() {
  return (
    <svg width="120" height="180" viewBox="0 0 120 180" fill="none">
      {/* 花盆 */}
      <path d="M30 140 L40 180 L80 180 L90 140 Z" fill="#C9604A" />
      <path d="M25 130 L95 130 L90 140 L30 140 Z" fill="#D4694F" />
      
      {/* 植物叶子 */}
      <ellipse cx="60" cy="100" rx="25" ry="35" fill="#3D6B4A" />
      <ellipse cx="40" cy="85" rx="18" ry="30" fill="#4A7B54" transform="rotate(-20 40 85)" />
      <ellipse cx="80" cy="85" rx="18" ry="30" fill="#4A7B54" transform="rotate(20 80 85)" />
      <ellipse cx="35" cy="60" rx="15" ry="25" fill="#5A8B64" transform="rotate(-35 35 60)" />
      <ellipse cx="85" cy="60" rx="15" ry="25" fill="#5A8B64" transform="rotate(35 85 60)" />
      <ellipse cx="60" cy="50" rx="12" ry="28" fill="#6A9B74" />
    </svg>
  );
}

// 时钟装饰 SVG
function ClockDecoration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* 时钟外圈 */}
      <circle cx="40" cy="40" r="35" fill="white" stroke="#C9604A" strokeWidth="4" />
      {/* 时钟刻度 */}
      <circle cx="40" cy="12" r="2" fill="#C9604A" />
      <circle cx="68" cy="40" r="2" fill="#C9604A" />
      <circle cx="40" cy="68" r="2" fill="#C9604A" />
      <circle cx="12" cy="40" r="2" fill="#C9604A" />
      {/* 时针 */}
      <line x1="40" y1="40" x2="40" y2="22" stroke="#4A7C9B" strokeWidth="3" strokeLinecap="round" />
      {/* 分针 */}
      <line x1="40" y1="40" x2="55" y2="30" stroke="#4A7C9B" strokeWidth="2" strokeLinecap="round" />
      {/* 中心点 */}
      <circle cx="40" cy="40" r="3" fill="#4A7C9B" />
    </svg>
  );
}

// 人物装饰 SVG（简化版椅子上的人）
function PeopleDecoration() {
  return (
    <svg width="300" height="250" viewBox="0 0 300 250" fill="none">
      {/* 椅子 */}
      <path d="M50 180 L50 250 L60 250 L60 200 L240 200 L240 250 L250 250 L250 180 Z" fill="white" />
      <rect x="40" y="150" width="220" height="35" rx="4" fill="#E07B67" />
      <rect x="40" y="100" width="15" height="90" rx="4" fill="#E07B67" />
      <rect x="245" y="100" width="15" height="90" rx="4" fill="#E07B67" />
      
      {/* 人物1 - 左边 */}
      <circle cx="100" cy="100" r="20" fill="#D4A574" /> {/* 头 */}
      <ellipse cx="100" cy="155" rx="25" ry="30" fill="#E8B87C" /> {/* 身体 */}
      <ellipse cx="100" cy="190" rx="20" ry="15" fill="#4A7C9B" /> {/* 腿 */}
      
      {/* 人物2 - 中间 */}
      <circle cx="150" cy="95" r="18" fill="#7AB8D4" /> {/* 蓝色头发 */}
      <circle cx="150" cy="100" r="15" fill="#F5D4BC" /> {/* 脸 */}
      <ellipse cx="150" cy="150" rx="22" ry="28" fill="#E8E8E8" /> {/* 灰色上衣 */}
      <ellipse cx="150" cy="188" rx="18" ry="12" fill="#4A7C9B" /> {/* 蓝色裤子 */}
      
      {/* 人物3 - 右边 */}
      <circle cx="200" cy="105" r="18" fill="#F5D4BC" /> {/* 头 */}
      <circle cx="200" cy="98" r="10" fill="#E8B87C" /> {/* 秃顶 */}
      <rect x="190" y="95" width="20" height="8" rx="4" fill="#D4A574" /> {/* 眼镜 */}
      <ellipse cx="200" cy="155" rx="24" ry="30" fill="#3D6B4A" /> {/* 绿色毛衣 */}
      <ellipse cx="200" cy="188" rx="18" ry="12" fill="#5A4A3A" /> {/* 棕色裤子 */}
    </svg>
  );
}
