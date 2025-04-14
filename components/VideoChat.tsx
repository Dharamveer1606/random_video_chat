import React, { useEffect } from 'react';
import { useSocket } from '../lib/hooks/useSocket';
import { useWebRTC } from '../lib/hooks/useWebRTC';

interface VideoChatProps {
  userId: string;
  roomId: string;
  remoteUserId?: string;
  onCallEnd?: () => void;
}

const VideoChat: React.FC<VideoChatProps> = ({
  userId,
  roomId,
  remoteUserId,
  onCallEnd,
}) => {
  const {
    localVideoRef,
    remoteVideoRef,
    mediaStatus,
    isConnected,
    error,
    toggleVideo,
    toggleAudio,
    endCall,
  } = useWebRTC({
    userId,
    roomId,
    remoteUserId,
  });

  const { leaveChat } = useSocket(userId);

  useEffect(() => {
    // Set up any necessary cleanup
    return () => {
      endCall();
    };
  }, []);

  const handleEndCall = () => {
    endCall();
    leaveChat(roomId);
    if (onCallEnd) {
      onCallEnd();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 relative">
      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-0 right-0 mx-auto w-fit px-4 py-2 bg-red-500 text-white rounded-md z-50">
          {error}
        </div>
      )}

      {/* Connection status */}
      {!isConnected && !error && (
        <div className="absolute top-4 left-0 right-0 mx-auto w-fit px-4 py-2 bg-blue-500 text-white rounded-md z-50">
          Connecting to peer...
        </div>
      )}

      {/* Remote video (full screen) */}
      <div className="relative h-full w-full bg-black">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`h-full w-full object-cover ${
            !isConnected ? 'hidden' : ''
          }`}
        />

        {/* Show a placeholder when no remote connection */}
        {!isConnected && !remoteUserId && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-pulse mb-4">
                <svg
                  className="mx-auto h-16 w-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <p className="text-lg font-medium">Waiting for someone to join...</p>
              <p className="text-sm text-gray-300 mt-2">
                Stay on this page while we find you a match
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Local video (small overlay) */}
      <div className="absolute bottom-20 right-4 w-1/4 max-w-[200px] aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {/* Show video off indicator */}
        {!mediaStatus.video && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              ></path>
            </svg>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 mx-auto w-fit flex items-center gap-4 p-2 bg-gray-800 bg-opacity-80 rounded-full">
        {/* Toggle audio */}
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            mediaStatus.audio ? 'bg-gray-700' : 'bg-red-600'
          }`}
        >
          {mediaStatus.audio ? (
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              ></path>
            </svg>
          ) : (
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                clipRule="evenodd"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              ></path>
            </svg>
          )}
        </button>

        {/* End call */}
        <button
          onClick={handleEndCall}
          className="p-3 bg-red-600 rounded-full"
        >
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
            ></path>
          </svg>
        </button>

        {/* Toggle video */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            mediaStatus.video ? 'bg-gray-700' : 'bg-red-600'
          }`}
        >
          {mediaStatus.video ? (
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
          ) : (
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              ></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoChat; 