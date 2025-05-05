'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { GameSession } from '@/types/gameSession';
import '@/styles/home.css';

export default function CreateGameSession() {
  const [gameToken, setGameToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const fetchedRef = useRef(false);
  const initialTokenRef = useRef<string | null>(null);
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

  // Store initial token
  useEffect(() => {
    if (token && !initialTokenRef.current) {
      initialTokenRef.current = token;
    }
  }, [token]);

  useEffect(() => {
    // If we don't have the initial token anymore, redirect
    if (initialTokenRef.current && !token) {
      router.push('/login');
      return;
    }

    const fetchSession = async () => {
      if (fetchedRef.current || !token) {
        return;
      }

      try {
        console.log('Attempting to create game session...');
        const gameSession = await apiService.post<GameSession>("/game", null, {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Game session created successfully:', gameSession);
        
        if (!gameSession || !gameSession.gameToken) {
          throw new Error('Invalid game session response');
        }
        
        setGameToken(gameSession.gameToken);
        setIsLoading(false);
        fetchedRef.current = true;
      } catch (error) {
        console.error('Error creating session:', error);
        setIsLoading(false);
        
        if (error && typeof error === 'object' && 'status' in error) {
          if (error.status === 401) {
            console.error('Authentication failed - token might be invalid');
            router.push('/login');
          } else if (error.status === 404) {
            console.error('User not found with current token');
            router.push('/login');
          } else {
            alert(`Server error: ${error.status}`);
          }
        } else if (error instanceof Error) {
          alert(`Failed to create game session: ${error.message}`);
        } else {
          alert('Failed to create game session');
        }
      }
    };

    fetchSession();
  }, [token, apiService, router]);

  const handleEnter = async () => {
    if (gameToken) {
      console.log('Navigating to game session with token:', gameToken);
      // here
      try {
        await apiService.post(`/game/join/${gameToken}`, null, {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });
        //router.push(`/game/join/${gameToken}`);
        // Use absolute path for navigation
        window.location.href = `/game/join/${gameToken}`;
      } catch (error) {
        console.error('Error joining game session:', error);
        if (error && typeof error === 'object' && 'status' in error) {
          if (error.status === 401) {
            alert('Authentication failed. Please login again.');
            router.push('/login');
          } else if (error.status === 404) {
            alert('Game session not found.');
          } else {
            alert('Failed to join game session. Please try again.');
          }
        }
      }
    }
  };

  const handleReturn = () => {
    router.push('/main'); 
  };

  // If we're loading and have no token, don't show anything
  if (!token && isLoading) {
    return null;
  }

  return (
    <div className="home-container">
        <div className="button-container">
            <h1 className="text-white text-2xl font-bold text-center mb-6">
                YOUR GAME SESSION TOKEN
            </h1>
            <div className="session-display">
                {isLoading ? (
                    <div className="loading-text">Generating Game Token...</div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div className="session-id">{gameToken}</div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(gameToken);
                                setIsCopied(true);
                                setTimeout(() => setIsCopied(false), 2000);
                            }}
                            style={{
                                padding: '5px 15px',
                                backgroundColor: isCopied ? '#2e8b57' : '#49beb7',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                            onMouseOver={(e) => {
                                if (!isCopied) {
                                    e.currentTarget.style.backgroundColor = '#3da8a2';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isCopied) {
                                    e.currentTarget.style.backgroundColor = '#49beb7';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                                }
                            }}
                        >
                            {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                )}
            </div>
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
                    disabled={!gameToken}
                >
                    START
                </button>
            </div>
        </div>
    </div>
  );
}
