'use client';

import React from 'react';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isGameMode: boolean;
  isHost: boolean;
  participantCount?: number;
  onMuteToggle: () => void;
  onVideoToggle: () => void;
  onGameModeToggle: () => void;
  onLeave: () => void;
}

export function ControlBar({
  isMuted,
  isVideoOff,
  isGameMode,
  participantCount = 0,
  onMuteToggle,
  onVideoToggle,
  onGameModeToggle,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="bg-[#242424] px-6 py-3">
      <div className="flex items-center justify-between">
        {/* 左侧 - Audio & Video */}
        <div className="flex items-center gap-1">
          {/* Audio */}
          <ControlButton
            icon={isMuted ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05H19zm-4 .16L9 5.18V5a3 3 0 0 1 6 0v6.16zM4.27 3L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .2 0 .39-.02.58-.06l1.74 1.74A5.98 5.98 0 0 1 12 17c-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c.57-.07 1.12-.21 1.63-.4l5.1 5.1 1.27-1.27L4.27 3z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V22h-2v-6.07z"/>
              </svg>
            )}
            label="Audio"
            isActive={!isMuted}
            onClick={onMuteToggle}
            hasDropdown
          />

          {/* Video */}
          <ControlButton
            icon={isVideoOff ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            )}
            label="Video"
            isActive={!isVideoOff}
            onClick={onVideoToggle}
            hasDropdown
          />
        </div>

        {/* 中间控制 */}
        <div className="flex items-center gap-1">
          {/* Participants */}
          <ControlButton
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            }
            label="Participants"
            badge={participantCount > 0 ? String(participantCount) : undefined}
            onClick={() => {}}
            hasDropdown
          />

          {/* Chat */}
          <ControlButton
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
              </svg>
            }
            label="Chat"
            onClick={() => {}}
            hasDropdown
          />

          {/* React */}
          <ControlButton
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            }
            label="React"
            onClick={() => {}}
            hasDropdown
          />

          {/* Share */}
          <ControlButton
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 20h14v-2H5v2zm0-10h4v6h6v-6h4l-7-7-7 7z"/>
              </svg>
            }
            label="Share"
            onClick={() => {}}
            hasDropdown
          />

          {/* Host tools - 游戏模式显示 */}
          {isGameMode && (
            <ControlButton
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              }
              label="Host tools"
              onClick={() => {}}
              hasDropdown
            />
          )}

          {/* More */}
          <ControlButton
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            }
            label="More"
            onClick={() => {}}
          />
        </div>

        {/* 右侧 - End */}
        <div className="flex items-center gap-3">
          {/* 游戏模式切换（仅游戏模式显示返回按钮） */}
          {isGameMode && (
            <button
              onClick={onGameModeToggle}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3D3D3D] text-gray-300 hover:bg-[#4D4D4D] transition-colors text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              <span>返回会议</span>
            </button>
          )}

          {/* End 按钮 */}
          <button
            onClick={onLeave}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E53935] text-white hover:bg-[#C62828] transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.59 10.52c1.05.51 2.04 1.15 2.96 1.91l-1.07 1.07c-.58-.47-1.21-.89-1.88-1.27v-1.71zm-13.2 0v1.7c-.65.37-1.28.79-1.87 1.27l-1.07-1.07c.91-.75 1.9-1.38 2.94-1.9zM12 7C9.79 7 7.67 7.46 5.73 8.28V10c-1.06.46-2.06 1.04-2.98 1.73l-1.5-1.5c2.32-1.97 5.21-3.23 8.4-3.47V4.25L12 3l2.35 1.25v2.51c3.19.24 6.08 1.5 8.4 3.47l-1.5 1.5c-.92-.69-1.92-1.27-2.98-1.73V8.28C16.33 7.46 14.21 7 12 7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: string;
  hasDropdown?: boolean;
  onClick: () => void;
}

function ControlButton({ icon, label, isActive = true, badge, hasDropdown, onClick }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-3 py-2 rounded-lg
        transition-colors duration-200 min-w-[64px] relative
        ${isActive 
          ? 'text-white hover:bg-[#3D3D3D]' 
          : 'text-red-400 hover:bg-red-600/20'
        }
      `}
    >
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-2 bg-[#0E72ED] text-white text-xs font-medium px-1.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <span className="text-xs">{label}</span>
        {hasDropdown && (
          <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        )}
      </div>
    </button>
  );
}
