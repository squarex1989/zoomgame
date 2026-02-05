'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Peer, { Instance as PeerInstance, SignalData } from 'simple-peer';

// STUN 服务器配置
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// 最大 WebRTC 传输人数（超过此数量的人不传输视频，减少带宽压力）
const MAX_WEBRTC_PEERS = 4;

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

  // 计算参与 WebRTC 传输的玩家列表（只取前 MAX_WEBRTC_PEERS 个，按 ID 排序确保一致性）
  const webrtcPlayerIds = useMemo(() => {
    const sorted = [...playerIds].sort();
    return sorted.slice(0, MAX_WEBRTC_PEERS);
  }, [playerIds]);

  // 检查自己是否在 WebRTC 传输名单中
  const isInWebRTCList = useMemo(() => {
    return localPlayerId ? webrtcPlayerIds.includes(localPlayerId) : false;
  }, [localPlayerId, webrtcPlayerIds]);

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
    // 如果自己不在 WebRTC 名单中，忽略信令
    if (!isInWebRTCList) {
      console.log(`Ignoring signal from ${fromId} (not in WebRTC list)`);
      return;
    }

    // 如果对方不在 WebRTC 名单中，忽略信令
    if (!webrtcPlayerIds.includes(fromId)) {
      console.log(`Ignoring signal from ${fromId} (sender not in WebRTC list)`);
      return;
    }

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
  }, [createPeer, isInWebRTCList, webrtcPlayerIds]);

  // 初始化连接
  useEffect(() => {
    if (!localPlayerId || !isInWebRTCList) {
      // 如果不在 WebRTC 传输名单中，清理所有连接
      peersRef.current.forEach(peer => {
        if (!peer.destroyed) {
          peer.destroy();
        }
      });
      peersRef.current.clear();
      setRemoteStreams(new Map());
      return;
    }

    const initConnections = async () => {
      // 获取本地流
      const stream = await getLocalStream();

      // 只和 WebRTC 名单内的其他玩家建立连接
      const remotePlayerIds = webrtcPlayerIds.filter(id => id !== localPlayerId);
      
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

      // 清理不在名单内的连接
      peersRef.current.forEach((peer, id) => {
        if (!webrtcPlayerIds.includes(id)) {
          console.log(`Removing peer ${id} (not in WebRTC list)`);
          peer.destroy();
          peersRef.current.delete(id);
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
          });
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
  }, [localPlayerId, webrtcPlayerIds.join(','), isInWebRTCList, getLocalStream, createPeer]);

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

  // 清理离开的玩家或不在 WebRTC 名单中的连接
  useEffect(() => {
    const currentIds = new Set(webrtcPlayerIds);
    
    peersRef.current.forEach((peer, id) => {
      if (!currentIds.has(id)) {
        console.log(`Cleaning up peer for ${id} (left or not in WebRTC list)`);
        peer.destroy();
        peersRef.current.delete(id);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }
    });
  }, [webrtcPlayerIds]);

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
    isInWebRTCList,
    webrtcPlayerIds,
  };
}
