import React, { useEffect, useState } from 'react';
import { useSocket } from '../lib/hooks/useSocket';
import { MatchPreferences } from '../types';

interface MatchingInterfaceProps {
  userId: string;
  userName?: string;
}

const MatchingInterface: React.FC<MatchingInterfaceProps> = ({
  userId,
  userName,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [preferences, setPreferences] = useState<MatchPreferences>({
    interests: [],
    language: 'English',
    gender: 'any',
  });
  const [customInterest, setCustomInterest] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  
  const { findMatch, cancelMatch, isConnected, reconnect } = useSocket(userId);

  const predefinedInterests = [
    'Gaming', 'Music', 'Movies', 'Sports', 'Travel', 
    'Technology', 'Art', 'Science', 'Books', 'Cooking'
  ];

  // Check connection status
  useEffect(() => {
    if (!isConnected && isSearching) {
      setConnectionError(true);
      setIsSearching(false); // Stop searching if we lost connection
    } else if (isConnected) {
      setConnectionError(false);
      setReconnecting(false);
    }
  }, [isConnected, isSearching]);

  // Add a custom interest to the list
  const addCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customInterest.trim()) return;
    
    const interest = customInterest.trim();
    
    if (!preferences.interests?.includes(interest)) {
      setPreferences(prev => ({
        ...prev,
        interests: [...(prev.interests || []), interest],
      }));
    }
    
    setCustomInterest('');
  };

  // Remove an interest from the list
  const removeInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests?.filter(i => i !== interest) || [],
    }));
  };

  // Toggle a predefined interest
  const togglePredefinedInterest = (interest: string) => {
    if (preferences.interests?.includes(interest)) {
      removeInterest(interest);
    } else {
      setPreferences(prev => ({
        ...prev,
        interests: [...(prev.interests || []), interest],
      }));
    }
  };

  // Start searching for a match
  const startMatching = () => {
    if (!isConnected) {
      setConnectionError(true);
      return;
    }
    
    setIsSearching(true);
    setConnectionError(false);
    findMatch(preferences);
  };

  // Cancel the search
  const stopMatching = () => {
    setIsSearching(false);
    cancelMatch();
  };

  // Attempt to manually reconnect
  const handleReconnect = () => {
    setReconnecting(true);
    reconnect();
    
    // Set a timeout to stop showing the reconnecting state if it takes too long
    setTimeout(() => {
      if (!isConnected) {
        setReconnecting(false);
        setConnectionError(true);
      }
    }, 5000);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-white mb-6">Find a Chat Partner</h2>
      
      {/* User greeting */}
      <div className="mb-6 text-gray-300">
        <p>
          Welcome{userName ? `, ${userName}` : ''}! Set your preferences below and start matching.
        </p>
      </div>
      
      {/* Connection status indicator */}
      <div className="mb-6 flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-300">
          {isConnected ? 'Connected to server' : 'Not connected'}
        </span>
        
        {!isConnected && !reconnecting && (
          <button 
            onClick={handleReconnect}
            className="ml-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Reconnect
          </button>
        )}
        
        {reconnecting && (
          <span className="ml-2 text-sm text-yellow-400 flex items-center">
            <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Reconnecting...
          </span>
        )}
      </div>
      
      {/* Connection error alert */}
      {connectionError && (
        <div className="mb-6 p-3 bg-red-600 text-white rounded-md">
          <p className="font-semibold">Connection Error</p>
          <p className="text-sm mb-2">Could not connect to the chat server. Please check your internet connection.</p>
          <button 
            onClick={handleReconnect} 
            className="text-white bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm flex items-center"
            disabled={reconnecting}
          >
            {reconnecting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Reconnecting...
              </>
            ) : (
              'Try Again'
            )}
          </button>
        </div>
      )}
      
      {/* Matching preferences */}
      <div className="space-y-6">
        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Interests
          </label>
          
          {/* Selected interests */}
          <div className="flex flex-wrap gap-2 mb-4">
            {preferences.interests && preferences.interests.length > 0 ? (
              preferences.interests.map((interest) => (
                <div 
                  key={interest}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm flex items-center"
                >
                  {interest}
                  <button 
                    onClick={() => removeInterest(interest)}
                    className="ml-2 text-blue-200 hover:text-white"
                  >
                    &times;
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">
                No interests selected. Add some to find better matches!
              </div>
            )}
          </div>
          
          {/* Predefined interests */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Popular interests:</p>
            <div className="flex flex-wrap gap-2">
              {predefinedInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => togglePredefinedInterest(interest)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    preferences.interests?.includes(interest)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom interest input */}
          <form onSubmit={addCustomInterest} className="flex gap-2">
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="Add custom interest"
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!customInterest.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
        
        {/* Language preference */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Language
          </label>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="any">Any Language</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
            <option value="Russian">Russian</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>
        
        {/* Gender preference */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Gender
          </label>
          <select
            value={preferences.gender}
            onChange={(e) => setPreferences(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
          </select>
        </div>
      </div>
      
      {/* Matching button */}
      <div className="mt-8">
        {!isSearching ? (
          <button
            onClick={startMatching}
            className={`w-full py-3 ${!isConnected ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white font-medium rounded-md transition-colors`}
            disabled={!isConnected || reconnecting}
          >
            {isConnected ? 'Start Matching' : reconnecting ? 'Connecting...' : 'Connecting to server...'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">Searching for a match...</span>
            </div>
            <button
              onClick={stopMatching}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchingInterface; 