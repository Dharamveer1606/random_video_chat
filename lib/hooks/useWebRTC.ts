import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { MediaStatus } from '../../types';
import { useSocket } from './useSocket';

interface UseWebRTCProps {
  userId: string;
  roomId: string;
  remoteUserId?: string;
}

type SimplePeerSignal = {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
};

export const useWebRTC = ({ userId, roomId, remoteUserId }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaStatus, setMediaStatus] = useState<MediaStatus>({ video: true, audio: true });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const { socket, sendSignal } = useSocket(userId);

  const initializePeerConnection = useCallback((stream: MediaStream, incomingSignal?: SimplePeerSignal) => {
    const peer = new Peer({
      initiator: !incomingSignal,
      trickle: false,
      stream
    });
    
    peer.on('signal', (signal: SimplePeerSignal) => {
      if (remoteUserId) {
        sendSignal(remoteUserId, signal);
      }
    });
    
    peer.on('stream', (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setIsConnected(true);
    });
    
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      setError('Connection error. Please try again.');
    });
    
    peer.on('close', () => {
      setIsConnected(false);
      setRemoteStream(null);
    });
    
    if (incomingSignal) {
      peer.signal(incomingSignal);
    }
    
    peerRef.current = peer;
  }, [remoteUserId, sendSignal]);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  // Initialize media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: mediaStatus.video, 
          audio: mediaStatus.audio 
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        if (remoteUserId && stream) {
          initializePeerConnection(stream);
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Failed to access camera and microphone. Please check permissions.');
      }
    };
    
    initializeMedia();
    
    return () => {
      endCall();
    };
  }, [roomId, remoteUserId, mediaStatus.video, mediaStatus.audio, initializePeerConnection, endCall]);

  // Setup socket event listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;
    
    const handleSignal = (data: { userId: string; signal: SimplePeerSignal }) => {
      if (data.userId !== remoteUserId) return;
      
      if (!peerRef.current && localStream) {
        initializePeerConnection(localStream, data.signal);
      } else if (peerRef.current) {
        peerRef.current.signal(data.signal);
      }
    };
    
    socket.on('signal', handleSignal);
    
    return () => {
      socket.off('signal', handleSignal);
    };
  }, [socket, remoteUserId, localStream, initializePeerConnection]);

  // Toggle video
  const toggleVideo = () => {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    
    if (videoTracks.length === 0) return;
    
    const enabled = !mediaStatus.video;
    
    videoTracks.forEach(track => {
      track.enabled = enabled;
    });
    
    setMediaStatus(prev => ({ ...prev, video: enabled }));
  };

  // Toggle audio
  const toggleAudio = () => {
    if (!localStream) return;
    
    const audioTracks = localStream.getAudioTracks();
    
    if (audioTracks.length === 0) return;
    
    const enabled = !mediaStatus.audio;
    
    audioTracks.forEach(track => {
      track.enabled = enabled;
    });
    
    setMediaStatus(prev => ({ ...prev, audio: enabled }));
  };

  return {
    localStream,
    remoteStream,
    mediaStatus,
    isConnected,
    error,
    localVideoRef,
    remoteVideoRef,
    toggleVideo,
    toggleAudio,
    endCall
  };
}; 