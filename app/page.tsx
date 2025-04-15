'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MatchingInterface from '../components/MatchingInterface';

// Define the session user type
interface SessionUser {
  id?: string;
  name?: string | null;
}

// This is a simplified Home component with ONLY guest access
export default function Home() {
  const { data: session } = useSession();
  const [guestId, setGuestId] = useState<string>('');

  // Load existing guest ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !session) {
      const storedGuestId = localStorage.getItem('guestId');
      if (storedGuestId) {
        setGuestId(storedGuestId);
      }
    }
  }, [session]);

  // Create a guest ID for users who don't sign in
  const createGuestSession = () => {
    const newGuestId = uuidv4();
    setGuestId(newGuestId);
    localStorage.setItem('guestId', newGuestId);
  };

  // Handle guest user
  const handleContinueAsGuest = () => {
    createGuestSession();
  };

  // Handle sign out
  const handleSignOut = () => {
    if (session) {
      signOut({ callbackUrl: '/' });
    } else {
      localStorage.removeItem('guestId');
      setGuestId('');
    }
  };

  // Get effective user ID from session or guest ID
  const sessionUserId = session?.user ? (session.user as SessionUser).id || '' : '';
  const userId = sessionUserId || guestId;

  return (
    <main className="min-h-screen flex flex-col py-10 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Random Video Chat
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Connect with people from around the world through video and text chat.
            Meet new friends, practice languages, or just have fun conversations!
          </p>
        </div>

        {/* Main content */}
        <div className="w-full max-w-xl">
          {/* Show auth options if not authenticated or guest */}
          {!userId ? (
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Get Started
              </h2>
              <p className="text-gray-300 mb-8">
                Create a guest session to start chatting.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleContinueAsGuest}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          ) : (
            // Show matching interface if authenticated or guest
            <MatchingInterface
              userId={userId}
              userName={session?.user?.name || 'Guest'}
            />
          )}
        </div>

        {/* Show sign out option if authenticated or guest */}
        {userId && (
          <div className="mt-8">
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white text-sm"
            >
              Reset session
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
