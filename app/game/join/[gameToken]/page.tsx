"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    connect,
    createLocalTracks,
    LocalVideoTrack,
    RemoteVideoTrack,
    RemoteAudioTrack,
    Room,
    Track,
    RemoteParticipant,
    LocalTrack,
    LocalParticipant
} from 'twilio-video';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import '../../../styles/home.css';

interface VideoResponse {
    gameSessionId: number;
    gameToken: string;
    twilioVideoChatToken: string;
    twilioRoomSid: string;
    username: string;
}

export default function GameSessionPage() {
    const { gameToken } = useParams();
    const router = useRouter();
    const apiService = useApi();
    const { value: token } = useLocalStorage<string>("token", "");

    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const currentTurnVideoRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<Client | null>(null);

    const [secretWord, setSecretWord] = useState<string | null>(null);
    const [isChameleon, setIsChameleon] = useState<boolean>(false);
    const [currentTurn, setCurrentTurn] = useState<string | null>(null);
    const [gameState, setGameState] = useState<string | null>(null);

    type Phase = 'lobby' | 'role_chameleon' | 'role_player' | 'game' | 'voting';
    const [phase, setPhase] = useState<Phase>('lobby');

    const [guessInput, setGuessInput] = useState('');
    const [messages, setMessages] = useState<string[]>([]);

    const videoBoxStyle = {
        backgroundColor: '#000',
        minHeight: '150px',
        minWidth: '150px',
        border: '2px solid #49beb7',
        borderRadius: '8px',
        overflow: 'hidden'
    };

    const [hasVoted, setHasVoted] = useState(false);
    const [vote, setVote] = useState<string | null>(null);
    const [localParticipant] = useState<LocalParticipant | null>(null);


    const handleVote = (playerId: string) => {
        if (hasVoted) return;
        console.log(vote);

        // stops self voting
        if (localParticipant && playerId === localParticipant.identity) {
            console.log('You cannot vote for yourself!');
            return;
        }

        setHasVoted(true);
        setVote(playerId);
        console.log(`Voted for: ${playerId}`);


        /*setVoteResults(prev => ({
            ...prev,
            [playerId]: (prev[playerId] || 0) + 1
        }));*/
    };

    useEffect(() => {
        remoteVideoRefs.current = Array(7).fill(null);
    }, []);

    interface GameInfo {
        role: string;
        secretWord: string;
        currentTurn: string;
    }

    const handleGameStart = (gameInfo: GameInfo) => {
        // Update isChameleon and secretWord
        setIsChameleon(gameInfo.role === "CHAMELEON");
        setSecretWord(gameInfo.secretWord);
        setCurrentTurn(gameInfo.currentTurn);

        // Manually update phase based on isChameleon
        if (gameInfo.role === "CHAMELEON") {
            setPhase('role_chameleon');
        } else {
            setPhase('role_player');
        }

        // Set a timeout to switch phase to 'game' after 5 seconds
        setTimeout(() => {
            setPhase('game');
        }, 5000);
    };

    // === WebSocket Setup using STOMP over SockJS ===
    useEffect(() => {
        if (!token || !gameToken) return;
        const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(
                isLocal
                    ? 'http://localhost:8080/game-ws'
                    : 'https://sopra-fs25-group-13-server.oa.r.appspot.com/game-ws'
            ),
            reconnectDelay: 5000,
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log('✅ STOMP connected');

                stompClient.subscribe(`/game/topic/${gameToken}`, (message) => {
                    const data = JSON.parse(message.body);
                    console.log('📨 Message received:', data);

                    if (data.actionType === 'START_GAME') {
                        /*setIsChameleon(data.isChameleon);
                        setSecretWord(data.secretWord);*/
                        localStorage.setItem('gameSessionActive', 'true');

                        // Fetch game info
                        fetch(
                            `${isLocal
                                ? 'http://localhost:8080'
                                : 'https://sopra-fs25-group-13-server.oa.r.appspot.com'}/game/info/${gameToken}`,
                            {
                            method: 'GET',
                            headers: {
                                'Authorization': token  // <-- your token
                            }
                        })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Failed to fetch game info');
                                }
                                return response.json();
                            })
                            .then(gameInfo => {
                                console.log('🎯 Game info fetched:', gameInfo);
                                handleGameStart(gameInfo);
                            })
                            .catch(error => {
                                console.error('Error fetching game info:', error);
                            });

                    }
                    if (data.actionType === 'GIVE_HINT') {
                        if (data.actionContent) {
                            setMessages(prev => [...prev, data.actionContent]);
                        }

                        // Re-fetch updated game info to get the new currentTurn
                        fetch(
                            `${isLocal
                                ? 'http://localhost:8080'
                                : 'https://sopra-fs25-group-13-server.oa.r.appspot.com'}/game/info/${gameToken}`,
                            {
                                method: 'GET',
                                headers: {
                                    'Authorization': token
                                }
                            }
                        )
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Failed to fetch updated game info');
                                }
                                return response.json();
                            })
                            .then(gameInfo => {
                                console.log('🔄 Updated game info after hint:', gameInfo);
                                setCurrentTurn(gameInfo.currentTurn);
                                setGameState(gameInfo.gameState);
                            })
                            .catch(error => {
                                console.error('Error fetching updated game info after hint:', error);
                            });
                    }
                    if (data.actionType === 'START_VOTING') {
                        setPhase('voting');
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame.headers['message'], frame.body);
            }
        });

        stompClient.activate();
        wsRef.current = stompClient;

        return () => {
            if (stompClient) {
                stompClient.deactivate();
                wsRef.current = null;
            }
        };
    }, [token, gameToken]);

    // === Twilio Video Setup ===
    useEffect(() => {
        if (!gameToken || !token) return;

        const setupVideo = async () => {
            try {
                let localTracks: LocalTrack[] = [];
                try {
                    localTracks = await createLocalTracks({ audio: true, video: { width: 640 } });
                    console.log('Created local tracks');
                    
                    // Handle local video
                    const localVideoTrack = localTracks.find(t => t.kind === 'video') as LocalVideoTrack;
                    if (localVideoTrack && localVideoRef.current) {
                        const videoElement = localVideoTrack.attach();
                        styleVideoElement(videoElement);
                        localVideoRef.current.innerHTML = '';
                        localVideoRef.current.appendChild(videoElement);
                    }
                } catch (err) {
                    console.warn("⚠️ Could not create local tracks:", err);
                }

                const response = await apiService.post<VideoResponse>(`/game/join/${gameToken}`, null, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });

                const room = await connect(response.twilioVideoChatToken, {
                    name: response.twilioRoomSid,
                    tracks: localTracks
                });

                setRoom(room);
                
                // Handle existing participants
                room.participants.forEach(participant => {
                    handleParticipantConnected(participant);
                });

                // Set up event listeners for new participants
                room.on('participantConnected', handleParticipantConnected);
                room.on('participantDisconnected', handleParticipantDisconnected);
            } catch (error) {
                console.error('Error in setupVideo:', error);
            }
        };

        setupVideo();

        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [gameToken, token]);

    // Re-attach local video when switching to the 'game' phase
useEffect(() => {
  if (phase === 'game' && room) {
      const localTrack = Array.from(room.localParticipant.videoTracks.values())[0]?.track as LocalVideoTrack;

      if (localTrack && localVideoRef.current) {
          const el = localTrack.attach();
          styleVideoElement(el);
          localVideoRef.current.innerHTML = '';
          localVideoRef.current.appendChild(el);
      }

      const bigVideoEl = document.getElementById('big-video');
      if (localTrack && bigVideoEl) {
          // Clear and attach to the big video slot
          const bigEl = localTrack.attach();
          styleVideoElement(bigEl);
          bigVideoEl.innerHTML = '';
          bigVideoEl.appendChild(bigEl);
      }

      // Attach remote videos
      room.participants.forEach(participant => {
          participant.videoTracks.forEach(publication => {
              if (publication.track) {
                  attachRemoteVideoTrack(publication.track, participant.sid);
              }
          });
      });
  }
}, [phase, room]);

    useEffect(() => {
        if (phase === 'voting' && room) {
            const localTrack = Array.from(room.localParticipant.videoTracks.values())[0]?.track as LocalVideoTrack;

            if (localTrack && localVideoRef.current) {
                const el = localTrack.attach();
                styleVideoElement(el);
                localVideoRef.current.innerHTML = '';
                localVideoRef.current.appendChild(el);
            }
            // Attach remote videos
            room.participants.forEach(participant => {
                participant.videoTracks.forEach(publication => {
                    if (publication.track) {
                        attachRemoteVideoTrack(publication.track, participant.sid);
                    }
                });
            });
        }
    }, [phase, room]);

    const attachRemoteVideoTrack = (track: RemoteVideoTrack, participantSid: string) => {
        const container = document.getElementById(`remote-video-${participantSid}`);
        if (container) {
            const videoEl = track.attach();
            styleVideoElement(videoEl);
            container.innerHTML = '';
            container.appendChild(videoEl);
        }
    };

    useEffect(() => {
        if (!room || !currentTurnVideoRef.current || phase !== 'game') return; // Only proceed if phase is 'game'

        const isLocal = currentTurn === room.localParticipant.identity;

        const targetParticipant = isLocal
            ? room.localParticipant
            : Array.from(room.participants.values()).find(
                (p) => p.identity === currentTurn
            );

        if (!targetParticipant) {
            console.warn("Participant not found for current turn:", currentTurn);
            return;
        }

        let videoTrack: LocalVideoTrack | RemoteVideoTrack | undefined;

        targetParticipant.videoTracks.forEach((publication) => {
            if (publication.track && publication.track.kind === 'video') {
                videoTrack = publication.track as LocalVideoTrack | RemoteVideoTrack;
            }
        });

        const container = currentTurnVideoRef.current;
        container.innerHTML = ''; // Clear previous content

        if (videoTrack) {
            let videoElement: HTMLVideoElement | null = null;

            if (isLocal) {
                try {
                    // Clone the underlying MediaStreamTrack
                    const clonedTrack = videoTrack.mediaStreamTrack.clone();
                    const stream = new MediaStream([clonedTrack]);

                    videoElement = document.createElement('video') as HTMLVideoElement;
                    videoElement.srcObject = stream;
                    videoElement.autoplay = true;
                    videoElement.playsInline = true;
                    videoElement.muted = true;
                } catch (error) {
                    console.warn("Failed to clone local track. Falling back to attach().", error);

                    // Fallback to attach (note: this will detach it from sidebar)
                    videoElement = videoTrack.attach() as HTMLVideoElement;
                    videoElement.muted = true;
                }
            } else {
                // Remote: use Twilio attach
                videoElement = videoTrack.attach() as HTMLVideoElement;
            }

            if (videoElement) {
                styleVideoElement(videoElement);
                container.appendChild(videoElement);
            }
        } else {
            container.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">${currentTurn}</p>`;
        }
    }, [currentTurn, room, phase]);



    const handleParticipantConnected = (participant: RemoteParticipant) => {
        setParticipants(prev => [...prev, participant]);

        // Find the first empty video slot
        const emptyIndex = remoteVideoRefs.current.findIndex(ref => ref && !ref.hasChildNodes());
        if (emptyIndex === -1) return;
        const currentRef = remoteVideoRefs.current[emptyIndex];
        if (!currentRef) return;

        let videoAttached = false;

        participant.tracks.forEach(pub => {
            if (pub.track && pub.track.kind === 'video') {
                const videoElement = (pub.track as RemoteVideoTrack).attach();
                styleVideoElement(videoElement);
                currentRef.innerHTML = '';
                currentRef.appendChild(videoElement);
                videoAttached = true;
            } else if (pub.track && pub.track.kind === 'audio') {
                const audioElement = (pub.track as RemoteAudioTrack).attach();
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
            }
        });

        participant.on('trackSubscribed', (track: Track) => {
            if (track.kind === 'video') {
                const videoElement = (track as RemoteVideoTrack).attach();
                styleVideoElement(videoElement);
                currentRef.innerHTML = '';
                currentRef.appendChild(videoElement);
            }
            if (track.kind === 'audio') {
                const audioElement = (track as RemoteAudioTrack).attach();
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
            }
        });

        if (!videoAttached) {
            currentRef.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">${participant.identity}</p>`;
        }
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        setParticipants(prev => prev.filter(p => p !== participant));
        remoteVideoRefs.current.forEach(ref => {
            if (ref && ref.hasChildNodes()) {
                const video = ref.querySelector('video');
                if (video && video.srcObject === participant.videoTracks.values().next().value?.track) {
                    ref.innerHTML = '';
                }
            }
        });
    };

    const handleStartGame = () => {
        const stompClient = wsRef.current;
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: `/game/player-action`,
                body: JSON.stringify({ actionType: 'START_GAME', gameSessionToken: gameToken }),
                headers: {
                    'auth-token': token
                }
            });
        } else {
            console.error('❌ STOMP client not connected');
        }
    };

    const handleReturn = () => {
        router.push('/main');
    };

    const handleVoting = () => {
        const stompClient = wsRef.current;
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: `/game/player-action`,
                body: JSON.stringify({ actionType: 'START_VOTING', gameSessionToken: gameToken }),
                headers: {
                    'auth-token': token
                }
            });
        } else {
            console.error('❌ STOMP client not connected');
        }
    };

    const styleVideoElement = (video: HTMLMediaElement) => {
        const videoElement = video as HTMLVideoElement;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
    };

    const handleSendHint = () => {
        if (guessInput.trim()) {
            const messageContent = guessInput.trim();
            setGuessInput(''); // Clear the input field

            const payload = {
                actionType: "GIVE_HINT",
                gameSessionToken: gameToken,
                actionContent: messageContent,
            };

            if (wsRef.current && wsRef.current.connected) {
                wsRef.current.publish({
                    destination: '/game/player-action',
                    body: JSON.stringify(payload),
                    headers: {
                        'auth-token': token
                    }
                });
            } else {
                console.warn('WebSocket not connected');
            }
        }
    };

    return (
      <>
          {phase === 'lobby' && (
              <div className="home-container" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '100vh'
              }}>
                  <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '20px',
                      justifyContent: 'center'
                  }}>
                      <div className="video-container">
                          <div className="video-wrapper">
                              <div
                                  ref={localVideoRef}
                                  className="video-element"
                                  style={{
                                      backgroundColor: '#000',
                                      minHeight: '150px',
                                      minWidth: '150px',
                                      border: '2px solid #49beb7',
                                      borderRadius: '8px',
                                      overflow: 'hidden'
                                  }}
                              />
                              {Array(7).fill(null).map((_, index) => (
                                  <div
                                      key={index}
                                      ref={(el: HTMLDivElement | null) => {
                                          if (remoteVideoRefs.current) {
                                              remoteVideoRefs.current[index] = el;
                                          }
                                      }}
                                      className="video-element"
                                      style={{
                                          backgroundColor: '#000',
                                          minHeight: '150px',
                                          minWidth: '150px',
                                          border: '2px solid #49beb7',
                                          borderRadius: '8px',
                                          overflow: 'hidden'
                                      }}
                                  />
                              ))}
                          </div>
                      </div>
  
                      <div className="button-container" style={{
                          backgroundColor: 'rgba(73, 190, 183, 0.2)',
                          padding: '20px',
                          borderRadius: '12px',
                          border: '2px solid #49beb7',
                          marginTop: '250px',
                          marginLeft: '50px',
                          textAlign: 'center'
                      }}>
                          <h1 className="text-white text-2xl font-bold" style={{ borderBottom: '2px solid white', paddingBottom: '5px', marginBottom: '10px' }}>
                              GAME LOBBY
                          </h1>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                              <span style={{ fontSize: '1.5rem', opacity: 0.9 }}>Session ID:</span>
                              <span style={{ fontSize: '1.5rem', opacity: 0.9 }}>{gameToken}</span>
                          </div>
                          <div style={{ fontSize: '1.5rem', opacity: 0.9 }}>
                              ({participants.length + 1}/8 players)
                          </div>
                          <div style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px' }}>
                              Connected Players: {participants.length + 1}
                              <ul>
                                  <li>You (Local)</li>
                                  {participants.map((p, index) => (
                                      <li key={index}>{p.identity}</li>
                                  ))}
                              </ul>
                          </div>
                          <div className="flex gap-4 w-full" style={{ marginTop: '20px' }}>
                              <button onClick={handleReturn} className="home-button">RETURN</button>
                              <button onClick={handleStartGame} className="home-button">START GAME</button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
  
          {phase === 'role_chameleon' && (
              <div className="home-container">
                  {isChameleon ? (
                      <div className="chameleon-box">
                          <h1 className="chameleon-title">YOU ARE</h1>
                          <h1 className="chameleon-subtitle">THE <span className="highlight">CHAMELEON</span>!</h1>
                      </div>
                  ) : (
                      <div className="button-container">
                          <h1 className="chameleon-title">THE SECRET WORD IS:</h1>
                          <h1 className="highlight">{secretWord}</h1>
                      </div>
                  )}
              </div>
          )}

          {phase === 'role_player' && (
              <div className="home-container">
                  <div className="button-container">
                      <h1 className="chameleon-title">THE SECRET WORD IS:</h1>
                      <h1 className="highlight">{secretWord}</h1>
                  </div>
              </div>
          )}
  
          {phase === 'game' && (
              <div className="home-container" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '100vh',
                  padding: '20px'
              }}>
                  <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      justifyContent: 'center'
                  }}>
                      {/* Left side - Small screens */}
                      <div className="video-container">
                          <div className="video-wrapper">
                              <div
                                  ref={localVideoRef}
                                  className="video-element"
                                  style={{
                                      backgroundColor: '#000',
                                      minHeight: '150px',
                                      minWidth: '150px',
                                      border: '2px solid #49beb7',
                                      borderRadius: '8px',
                                      overflow: 'hidden'
                                  }}
                              />
                              {Array(7).fill(null).map((_, index) => (
                                  <div
                                      key={index}
                                      ref={(el: HTMLDivElement | null) => {
                                          if (remoteVideoRefs.current) {
                                              remoteVideoRefs.current[index] = el;
                                          }
                                      }}
                                      className="video-element"
                                      style={{
                                          backgroundColor: '#000',
                                          minHeight: '150px',
                                          minWidth: '150px',
                                          border: '2px solid #49beb7',
                                          borderRadius: '8px',
                                          overflow: 'hidden'
                                      }}
                                  />
                              ))}
                          </div>
                      </div>
  
                      {/* Center screen and input section */}
                      <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px',
                          justifyContent: 'center'
                      }}>
                          <div style={{
                              backgroundColor: '#49beb7',
                              borderRadius: '25px',
                              padding: '10px 20px',
                              color: 'white',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              marginBottom: '10px'
                          }}>
                              {isChameleon ? `YOU ARE THE CHAMELEON! CURRENT TURN: ${currentTurn}` : `THE SECRET WORD IS: ${secretWord}! CURRENT TURN: ${currentTurn}`}
                          </div>
                          <div
                              ref={currentTurnVideoRef}
                              style={{
                                  backgroundColor: '#000',
                                  width: '600px',
                                  height: '450px',
                                  border: '2px solid #49beb7',
                                  borderRadius: '8px',
                                  overflow: 'hidden'
                              }}
                          />
                          <div style={{
                              display: 'flex',
                              gap: '10px',
                              width: '100%'
                          }}>
                              <input
                                  type="text"
                                  placeholder="Type your guess..."
                                  value={guessInput}
                                  onChange={(e) => setGuessInput(e.target.value)}
                                  style={{
                                      flex: 1,
                                      height: '45px',
                                      padding: '0 20px',
                                      borderRadius: '25px',
                                      border: '2px solid #49beb7',
                                      backgroundColor: 'white',
                                      color: '#333',
                                      fontSize: '16px',
                                      outline: 'none'
                                  }}
                              />
                              <button
                                  onClick={handleSendHint}
                                  style={{
                                      padding: '10px 30px',
                                      borderRadius: '25px',
                                      border: 'none',
                                      backgroundColor: '#49beb7',
                                      color: 'white',
                                      fontSize: '20px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }}
                              >
                                  SEND
                              </button>
                          </div>
                      </div>
                      <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px',
                          justifyContent: 'center'
                      }}>
                          {/* Word List Box */}
                          <div style={{
                              backgroundColor: 'rgba(73, 190, 183, 0.2)',
                              width: '300px',
                              height: '450px',
                              border: '2px solid #49beb7',
                              borderRadius: '8px',
                              padding: '15px',
                              justifyContent: 'center'
                          }}>
                              <h2 style={{
                                  color: '#fff',
                                  fontSize: '24px',
                                  textAlign: 'center',
                                  marginBottom: '15px',
                                  borderBottom: '2px solid #49beb7',
                                  paddingBottom: '5px'
                              }}>
                                  WORD LIST
                              </h2>
                              <ul style={{ color: '#49beb7', fontSize: '18px', listStyleType: 'none', padding: 0 }}>
                                  {messages.map((msg, idx) => (
                                      <li key={idx} style={{ marginBottom: '10px' }}>{msg}</li>
                                  ))}
                              </ul>
                          </div>
                          {gameState === 'READY_FOR_VOTING' && (
                              <button
                                  onClick={handleVoting}
                                  className="home-button"
                              >
                                  START VOTING
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {phase === 'voting' && (
              <div className="home-container" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '100vh',
                  padding: '20px',
                  flexDirection: 'column'
              }}>
                  {/* Header Text */}
                  <div style={{
                      backgroundColor: '#49beb7',
                      borderRadius: '25px',
                      padding: '10px 20px',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginBottom: '30px'
                  }}>
                      <span>VOTE FOR THE CHAMELEON! </span>
                  </div>

                  {/* Video container grid */}
                  <div className="video-container">
                      <div className="video-wrapper" style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 150px)',
                          gap: '20px',
                          justifyContent: 'center'
                      }}>
                          {/* Local Video */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div
                                  ref={localVideoRef}
                                  className="video-element"
                                  style={videoBoxStyle}
                              />
                              <button
                                  disabled={hasVoted || localParticipant?.identity === 'localParticipantId'} // Ensure the local participant can't vote for themselves
                                  style={{
                                      marginTop: '8px',
                                      backgroundColor: hasVoted || localParticipant?.identity === 'localParticipantId' ? '#ccc' : '#49beb7',
                                      color: 'white',
                                      border: 'none',
                                      padding: '5px 10px',
                                      borderRadius: '5px',
                                      cursor: hasVoted || localParticipant?.identity === 'localParticipantId' ? 'default' : 'pointer'
                                  }}
                                  onClick={() => {
                                      if (localParticipant?.identity) {
                                          handleVote(localParticipant.identity);
                                      }
                                  }} // Pass the local participant's identity here
                              >
                                  VOTE
                              </button>
                          </div>

                          {/* Remote Videos */}
                          {Array(7).fill(null).map((_, index) => (
                              <div
                                  key={index}
                                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                              >
                                  <div
                                      ref={(el: HTMLDivElement | null) => {
                                          if (remoteVideoRefs.current) {
                                              remoteVideoRefs.current[index] = el;
                                          }
                                      }}
                                      className="video-element"
                                      style={{
                                          backgroundColor: '#000',
                                          minHeight: '150px',
                                          minWidth: '150px',
                                          border: '2px solid #49beb7',
                                          borderRadius: '8px',
                                          overflow: 'hidden'
                                      }}
                                  />
                                  <button
                                      disabled={hasVoted}
                                      style={{
                                          marginTop: '8px',
                                          backgroundColor: hasVoted ? '#ccc' : '#49beb7',
                                          color: 'white',
                                          border: 'none',
                                          padding: '5px 10px',
                                          borderRadius: '5px',
                                          cursor: hasVoted ? 'default' : 'pointer'
                                      }}
                                      onClick={() => handleVote(`player${index + 1}`)}
                                  >
                                      VOTE
                                  </button>
                              </div>
                          ))}

                      </div>
                  </div>
              </div>
          )}
      </>
  );
}