import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from '../lib/hooks/useSocket';
import { ChatMessage } from '../types';

interface TextChatProps {
  userId: string;
  roomId: string;
  userName?: string;
}

const TextChat: React.FC<TextChatProps> = ({ userId, roomId, userName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, sendMessage } = useSocket(userId);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.on('message:received', handleNewMessage);

    return () => {
      socket.off('message:received', handleNewMessage);
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      senderId: userId,
      content: inputValue,
      timestamp: new Date(),
      isRead: false,
    };

    sendMessage(roomId, newMessage);
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue('');
  };

  // Format timestamp for display
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Say hello to start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === userId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.senderId === userId
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-white rounded-bl-none'
                  }`}
                >
                  <div className="text-sm break-words">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.senderId === userId
                        ? 'text-blue-200'
                        : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSendMessage}
        className="p-2 border-t border-gray-700 bg-gray-900"
      >
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 py-2 px-4 bg-gray-800 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="ml-2 p-2 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              ></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextChat; 