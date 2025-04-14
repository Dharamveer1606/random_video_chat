'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MatchingInterface from '../components/MatchingInterface';

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

  // Handle authenticated user
  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
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
  const userId = (session?.user as any)?.id || guestId;

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
                Sign in to save your preferences and chat history, or continue as a guest.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleSignIn}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-gray-800 text-gray-400 text-sm">
                      or
                    </span>
                  </div>
                </div>
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
              userName={session?.user?.name || undefined}
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
              {session ? 'Sign out' : 'Reset guest session'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
