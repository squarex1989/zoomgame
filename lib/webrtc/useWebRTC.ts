'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { Instance as PeerInstance, SignalData } from 'simple-peer';

// STUN 服务器配置
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface RemoteStream {
  odudanId: string;
  stream: MediaStream;
}

interface UseWebRTCOptions {
  localPlayerId: string | null;
  playerIds: string[];
  isVideoOff: boolean;
  isMuted: boolean;
  sendSignal: (targetId: string, signal: SignalData) => void;
}

export function useWebRTC({
  localPlayerId,
  playerIds,
  isVideoOff,
  isMuted,
  sendSignal,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peersRef = useRef<Map<string, PeerInstance>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // 获取本地媒体流
  const getLocalStream = useCallback(async () => {
    if (isVideoOff && isMuted) {
      // 如果视频和音频都关闭，停止现有流
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isVideoOff ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        } : false,
        audio: !isMuted,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local stream:', err);
      return null;
    }
  }, [isVideoOff, isMuted]);

  // 创建 Peer 连接
  const createPeer = useCallback((targetId: string, initiator: boolean, stream: MediaStream | null) => {
    console.log(`Creating peer for ${targetId}, initiator: ${initiator}`);

    const peer = new Peer({
      initiator,
      trickle: true,
      stream: stream || undefined,
      config: ICE_SERVERS,
    });

    peer.on('signal', (signal: SignalData) => {
      console.log(`Sending signal to ${targetId}:`, signal.type || 'candidate');
      sendSignal(targetId, signal);
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      console.log(`Received stream from ${targetId}`);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(targetId, remoteStream);
        return newMap;
      });
    });

    peer.on('connect', () => {
      console.log(`Connected to ${targetId}`);
    });

    peer.on('close', () => {
      console.log(`Connection closed with ${targetId}`);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(targetId);
        return newMap;
      });
    });

    peer.on('error', (err) => {
      console.error(`Peer error with ${targetId}:`, err);
    });

    peersRef.current.set(targetId, peer);
    return peer;
  }, [sendSignal]);

  // 处理收到的信令
  const handleSignal = useCallback((fromId: string, signal: SignalData) => {
    console.log(`Received signal from ${fromId}:`, signal.type || 'candidate');

    let peer = peersRef.current.get(fromId);

    if (!peer) {
      // 如果没有现有连接，创建一个非发起者的连接
      peer = createPeer(fromId, false, localStreamRef.current);
    }

    try {
      peer.signal(signal);
    } catch (err) {
      console.error(`Failed to process signal from ${fromId}:`, err);
    }
  }, [createPeer]);

  // 初始化连接
  useEffect(() => {
    if (!localPlayerId) return;

    const initConnections = async () => {
      // 获取本地流
      const stream = await getLocalStream();

      // 对于每个其他玩家，如果我们的 ID 更大，则作为发起者
      const remotePlayerIds = playerIds.filter(id => id !== localPlayerId);
      
      remotePlayerIds.forEach(targetId => {
        const existingPeer = peersRef.current.get(targetId);
        if (!existingPeer || existingPeer.destroyed) {
          // 使用 ID 比较来确定谁是发起者，避免双方同时发起
          const shouldInitiate = localPlayerId > targetId;
          if (shouldInitiate) {
            createPeer(targetId, true, stream);
          }
        }
      });
    };

    initConnections();

    return () => {
      // 清理所有连接
      peersRef.current.forEach(peer => {
        if (!peer.destroyed) {
          peer.destroy();
        }
      });
      peersRef.current.clear();
    };
  }, [localPlayerId, playerIds.join(','), getLocalStream, createPeer]);

  // 当视频/音频设置改变时，更新所有 peer 的流
  useEffect(() => {
    const updateStreams = async () => {
      const stream = await getLocalStream();
      
      peersRef.current.forEach((peer, targetId) => {
        if (!peer.destroyed && stream) {
          try {
            // 移除旧轨道
            const senders = (peer as any)._pc?.getSenders?.();
            if (senders) {
              senders.forEach((sender: RTCRtpSender) => {
                if (sender.track) {
                  (peer as any)._pc?.removeTrack?.(sender);
                }
              });
            }

            // 添加新轨道
            stream.getTracks().forEach(track => {
              peer.addTrack(track, stream);
            });
          } catch (err) {
            console.log(`Failed to update stream for ${targetId}:`, err);
          }
        }
      });
    };

    updateStreams();
  }, [isVideoOff, isMuted, getLocalStream]);

  // 清理离开的玩家的连接
  useEffect(() => {
    const currentIds = new Set(playerIds);
    
    peersRef.current.forEach((peer, id) => {
      if (!currentIds.has(id)) {
        console.log(`Cleaning up peer for ${id}`);
        peer.destroy();
        peersRef.current.delete(id);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }
    });
  }, [playerIds]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 停止本地流
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // 销毁所有 peer 连接
      peersRef.current.forEach(peer => {
        if (!peer.destroyed) {
          peer.destroy();
        }
      });
      peersRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    handleSignal,
  };
}
