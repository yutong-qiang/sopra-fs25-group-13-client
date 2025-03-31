'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinGameSession() {
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();

  const handleEnter = () => {
    if (sessionId.trim()) {
      // TODO: Implement the logic to join the game session
      console.log('Joining session:', sessionId);
    }
  };

  const handleReturn = () => {
    router.push('/main'); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a2e1a] bg-opacity-90 relative overflow-hidden">
      {/* Background leaf pattern */}
      <div className="absolute inset-0 bg-[url('/images/leaves-pattern.png')] opacity-20 bg-repeat"></div>
      
      {/* Main content */}
      <div className="bg-[#4a7c4a] p-8 rounded-2xl shadow-xl w-[90%] max-w-md relative z-10">
        <h1 className="text-white text-2xl font-bold text-center mb-6">
          ENTER GAME SESSION ID
        </h1>
        
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="w-full p-3 rounded-lg mb-6 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Enter session ID"
        />
        
        <div className="flex gap-4">
          <button
            onClick={handleReturn}
            className="flex-1 bg-[#40b37e] text-white py-3 rounded-lg hover:bg-[#359268] transition-colors duration-200"
          >
            RETURN
          </button>
          
          <button
            onClick={handleEnter}
            className="flex-1 bg-[#40b37e] text-white py-3 rounded-lg hover:bg-[#359268] transition-colors duration-200"
          >
            ENTER
          </button>
        </div>
      </div>
    </div>
  );
}


