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
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);

    const handleVote = (playerId: string) => {
        if (hasVoted) return;
        console.log(vote);

        // stops self voting
        if (room && playerId === room.localParticipant.identity) {
            console.log('You cannot vote for yourself!');
            return;
        }

        setHasVoted(true);
        setVote(playerId);
        console.log(`Voted for: ${playerId}`);
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

                // This is the complete updated WebSocket subscription handler
                stompClient.subscribe(`/game/topic/${gameToken}`, (message) => {
                  const data = JSON.parse(message.body);
                  console.log('📨 Message received:', data);

                  if (data.actionType === 'START_GAME') {
                      localStorage.setItem('gameSessionActive', 'true');

                      // Fetch game info
                      fetch(
                          `${isLocal
                              ? 'http://localhost:8080'
                              : 'https://sopra-fs25-group-13-server.oa.r.appspot.com'}/game/info/${gameToken}`,
                          {
                          method: 'GET',
                          headers: {
                              'Authorization': token
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
                      console.log('Hint received from server:', data);
                      
                      // Add the message to the word list if it has content
                      if (data.actionContent) {
                          // Format will depend on if sender is included
                          const messageText = data.sender 
                              ? `${data.sender}: ${data.actionContent}`
                              : data.actionContent;
                              
                          console.log('Adding to messages:', messageText);
                          setMessages(prev => [...prev, messageText]);
                      }

                      // Re-fetch updated game info to get the new currentTurn
                      console.log('Fetching updated game info after hint...');
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
                setLocalParticipant(room.localParticipant);
                
                // Process all existing participants
                room.participants.forEach(participant => {
                    handleParticipantConnected(participant);
                });

                room.on('participantConnected', handleParticipantConnected);
                room.on('participantDisconnected', handleParticipantDisconnected);

                // Attach local video track
                attachLocalVideo(room);
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
    
    const attachLocalVideo = (room: Room) => {
        const localTrack = Array.from(room.localParticipant.videoTracks.values())[0]?.track as LocalVideoTrack;
        
        if (localTrack && localVideoRef.current) {
            const el = localTrack.attach();
            styleVideoElement(el);
            localVideoRef.current.innerHTML = '';
            localVideoRef.current.appendChild(el);
        } else if (localVideoRef.current) {
            localVideoRef.current.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">You</p>`;
        }
    };

    // Update all videos when phase changes
    useEffect(() => {
        if (!room) return;
        
        // First, always make sure local video is attached
        attachLocalVideo(room);
        
        // Then handle remote participants
        room.participants.forEach((participant, index) => {
            // Find an available slot
            const availableRef = remoteVideoRefs.current.find(ref => ref && !ref.hasChildNodes());
            const refIndex = remoteVideoRefs.current.findIndex(ref => ref === availableRef);
            
            if (refIndex >= 0) {
                const currentRef = remoteVideoRefs.current[refIndex];
                if (currentRef) {
                    // Clear existing content
                    currentRef.innerHTML = '';
                    
                    // Check if participant has video
                    let videoAttached = false;
                    participant.videoTracks.forEach(publication => {
                        if (publication.track) {
                            const videoElement = (publication.track as RemoteVideoTrack).attach();
                            styleVideoElement(videoElement);
                            currentRef.appendChild(videoElement);
                            videoAttached = true;
                        }
                    });
                    
                    if (!videoAttached) {
                        currentRef.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">${participant.identity}</p>`;
                    }
                }
            }
        });
        
        // Update current turn video if in game phase
        if (phase === 'game' && currentTurn && currentTurnVideoRef.current) {
            updateCurrentTurnVideo();
        }
    }, [phase, room, participants]);

    // Function to update current turn video
    const updateCurrentTurnVideo = () => {
        if (!room || !currentTurnVideoRef.current || !currentTurn) return;

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

        if (isLocal) {
            videoTrack = Array.from(room.localParticipant.videoTracks.values())[0]?.track as LocalVideoTrack;
        } else {
            targetParticipant.videoTracks.forEach((publication) => {
                if (publication.track && publication.track.kind === 'video') {
                    videoTrack = publication.track as RemoteVideoTrack;
                }
            });
        }

        const container = currentTurnVideoRef.current;
        container.innerHTML = ''; // Clear previous content

        if (videoTrack) {
            let videoElement: HTMLVideoElement;

            if (isLocal) {
                try {
                    // Clone the underlying MediaStreamTrack
                    const clonedTrack = videoTrack.mediaStreamTrack.clone();
                    const stream = new MediaStream([clonedTrack]);

                    videoElement = document.createElement('video');
                    videoElement.srcObject = stream;
                    videoElement.autoplay = true;
                    videoElement.playsInline = true;
                    videoElement.muted = true;
                } catch (error) {
                    console.warn("Failed to clone local track. Falling back to attach().", error);
                    videoElement = videoTrack.attach() as HTMLVideoElement;
                }
            } else {
                videoElement = (videoTrack as RemoteVideoTrack).attach() as HTMLVideoElement;
            }

            styleVideoElement(videoElement);
            container.appendChild(videoElement);
        } else {
            container.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">${currentTurn}</p>`;
        }
    };

    // Update current turn video when currentTurn changes
    useEffect(() => {
        if (phase === 'game') {
            updateCurrentTurnVideo();
        }
    }, [currentTurn, room, phase]);

    const handleParticipantConnected = (participant: RemoteParticipant) => {
        console.log(`Participant ${participant.identity} connected`);
        setParticipants(prev => [...prev, participant]);

        // Find first empty slot
        const emptyIndex = remoteVideoRefs.current.findIndex(ref => ref && !ref.hasChildNodes());
        if (emptyIndex === -1) return;
        
        const currentRef = remoteVideoRefs.current[emptyIndex];
        if (!currentRef) return;

        let videoAttached = false;

        // Process existing tracks
        participant.tracks.forEach(pub => {
            if (pub.track) {
                if (pub.track.kind === 'video') {
                    const videoElement = (pub.track as RemoteVideoTrack).attach();
                    styleVideoElement(videoElement);
                    currentRef.innerHTML = '';
                    currentRef.appendChild(videoElement);
                    videoAttached = true;
                } else if (pub.track.kind === 'audio') {
                    const audioElement = (pub.track as RemoteAudioTrack).attach();
                    audioElement.style.display = 'none';
                    document.body.appendChild(audioElement);
                }
            }
        });

        // Handle track subscription for this participant
        participant.on('trackSubscribed', (track: Track) => {
            if (track.kind === 'video') {
                const videoElement = (track as RemoteVideoTrack).attach();
                styleVideoElement(videoElement);
                currentRef.innerHTML = '';
                currentRef.appendChild(videoElement);
                videoAttached = true;
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
        console.log(`Participant ${participant.identity} disconnected`);
        setParticipants(prev => prev.filter(p => p !== participant));
        
        // Find and clear the slot containing this participant's video
        remoteVideoRefs.current.forEach(ref => {
            if (ref && ref.hasChildNodes()) {
                const video = ref.querySelector('video');
                
                // Check if this video belongs to the disconnected participant
                const participantVideoTrack = Array.from(participant.videoTracks.values())[0]?.track;
                if (video && participantVideoTrack && 
                    video.srcObject instanceof MediaStream && 
                    video.srcObject.id === participantVideoTrack.name) {
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
        videoElement.playsInline = true;
        videoElement.autoplay = true;
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
                                    style={videoBoxStyle}
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
                                        style={videoBoxStyle}
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
                        <div className="video-container">
                            <div className="video-wrapper">
                                <div
                                    ref={localVideoRef}
                                    className="video-element"
                                    style={videoBoxStyle}
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
                                        style={videoBoxStyle}
                                        id={`remote-video-${index}`}
                                    />
                                ))}
                            </div>
                        </div>
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
                                    onClick={() => {
                                        if (guessInput.trim()) {
                                            const messageContent = guessInput.trim();
                                            
                                            // Add the message locally immediately for better UX
                                            setMessages(prev => [...prev, `${room?.localParticipant.identity}: ${messageContent}`]);
                                            
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
                                                setGuessInput('');
                                                
                                                // Log for debugging
                                                console.log('Hint sent:', messageContent);
                                            } else {
                                                console.warn('WebSocket not connected');
                                            }
                                        }
                                    }}
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
                            backgroundColor: 'rgba(73, 190, 183, 0.2)',
                            width: '300px',
                            height: '450px',
                            border: '2px solid #49beb7',
                            borderRadius: '8px',
                            padding: '15px',
                            overflowY: 'auto'
                        }}>
                            <h2 style={{
                                color: '#fff',
                                fontSize: '24px',
                                textAlign: 'center',
                                marginBottom: '15px',
                                borderBottom: '2px solid #49beb7',
                                paddingBottom: '5px',
                                position: 'sticky',
                                top: 0,
                                backgroundColor: 'rgba(73, 190, 183, 0.2)'
                            }}>
                                WORD LIST
                            </h2>
                            {messages.length === 0 ? (
                                <p style={{ color: '#fff', textAlign: 'center', fontStyle: 'italic' }}>
                                    No hints given yet
                                </p>
                            ) : (
                                <ul style={{ color: '#fff', fontSize: '18px', listStyleType: 'none', padding: 0 }}>
                                    {messages.map((msg, idx) => (
                                        <li key={idx} style={{
                                            marginBottom: '10px',
                                            padding: '8px',
                                            backgroundColor: 'rgba(73, 190, 183, 0.3)',
                                            borderRadius: '8px'
                                        }}>
                                            {msg}
                                        </li>
                                    ))}
                                </ul>
                            )}
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
                        {hasVoted && <span>(You voted for: {vote})</span>}
                    </div>
                    <div className="video-container">
                        <div className="video-wrapper" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 150px)',
                            gap: '20px',
                            justifyContent: 'center'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div
                                    ref={localVideoRef}
                                    className="video-element"
                                    style={{
                                        ...videoBoxStyle,
                                        border: '2px solid #f06292',
                                    }}
                                />
                                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                    <p style={{ color: 'white', fontWeight: 'bold' }}>YOU</p>
                                </div>
                            </div>
                            {participants.map((participant, index) => (
                                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div
                                        ref={(el: HTMLDivElement | null) => {
                                            if (remoteVideoRefs.current) {
                                                remoteVideoRefs.current[index] = el;
                                            }
                                        }}
                                        className="video-element"
                                        style={{
                                            ...videoBoxStyle,
                                            border: vote === participant.identity ? '3px solid yellow' : videoBoxStyle.border
                                        }}
                                    />
                                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                        <p style={{ color: 'white', fontWeight: 'bold' }}>{participant.identity}</p>
                                        <button
                                            onClick={() => handleVote(participant.identity)}
                                            disabled={hasVoted}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '25px',
                                                border: 'none',
                                                backgroundColor: hasVoted ? '#ccc' : '#f06292',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                cursor: hasVoted ? 'not-allowed' : 'pointer',
                                                marginTop: '5px'
                                            }}
                                        >
                                            {vote === participant.identity ? 'VOTED' : 'VOTE'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {gameState === 'VOTING_COMPLETE' && (
                        <div style={{
                            backgroundColor: 'rgba(73, 190, 183, 0.2)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '2px solid #49beb7',
                            marginTop: '30px',
                            textAlign: 'center',
                            width: '80%',
                            maxWidth: '600px'
                        }}>
                            <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '10px' }}>
                                THE SECRET WORD WAS:
                            </h2>
                            <h1 style={{ color: '#f06292', fontSize: '32px', fontWeight: 'bold' }}>
                                {secretWord}
                            </h1>
                            <button
                                onClick={handleReturn}
                                style={{
                                    padding: '10px 30px',
                                    borderRadius: '25px',
                                    border: 'none',
                                    backgroundColor: '#49beb7',
                                    color: 'white',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    marginTop: '20px'
                                }}
                            >
                                RETURN TO LOBBY
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}