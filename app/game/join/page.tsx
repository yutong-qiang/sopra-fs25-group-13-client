'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/home.css';

export default function JoinGameSession() {
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();

  const handleEnter = () => {
    if (sessionId) {
      router.push(`/game/join/${sessionId}`);
    }
  };

  const handleReturn = () => {
    router.push('/main'); 
  };

  return (
    <div className="home-container">
        <div className="button-container">
            <h1 className="text-white text-2xl font-bold text-center mb-6">
                ENTER GAME SESSION TOKEN
            </h1>
            <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter Session ID"
                className="session-input"
            />
            <div className="flex gap-4 w-full">
                <button
                    onClick={handleReturn}
                    className="home-button"    
                >
                    RETURN
                </button>
                <button
                    onClick={handleEnter}
                    className="home-button"
                >
                    ENTER
                </button>
            </div>
        </div>
    </div>
  );
}
