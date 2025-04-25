"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { connect, createLocalTracks, LocalVideoTrack, RemoteVideoTrack, RemoteAudioTrack, Room, Track, RemoteParticipant, LocalTrack } from 'twilio-video';
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
    const wsRef = useRef<Client | null>(null);
    //const [gameStarted, setGameStarted] = useState(false);
    const [secretWord, setSecretWord] = useState<string | null>(null);
    const [isChameleon, setIsChameleon] = useState<boolean>(false);

    type Phase = 'lobby' | 'game' | 'voting';
    const [phase, setPhase] = useState<Phase>('lobby');

    const [guessInput, setGuessInput] = useState('');
    const [messages] = useState<string[]>([]);

    // Initialize refs array
    useEffect(() => {
        remoteVideoRefs.current = Array(7).fill(null); // 7 remote players max
    }, []);

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

              /*if (data.actionType === 'START_GAME') {
                  if (data.isChameleon) {
                      router.push(`/role/chameleon/roleWindow/${gameToken}`);
                  } else {
                      router.push(`/role/player/${gameToken}?word=${data.secretWord}&chameleon=${data.isChameleon}`);
                  }
              }*/
                if (data.actionType === 'START_GAME') {
                    setIsChameleon(data.isChameleon);
                    setSecretWord(data.secretWord);
                    //setGameStarted(true);
                    setPhase('game');
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
                // Still let the user join the room even without media
                }

                const response = await apiService.post<VideoResponse>(`/game/join/${gameToken}`, null, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Join response:', {
                    roomSid: response.twilioRoomSid,
                    token: response.twilioVideoChatToken?.substring(0, 10) + '...' // Only log part of the token
                });

                const room = await connect(response.twilioVideoChatToken, {
                    name: response.twilioRoomSid,
                    tracks: localTracks
                });
                console.log("🧩 Room SID connected to:", room.sid);

                console.log('Initial room state:', {
                    roomName: room.name,
                    participantCount: room.participants.size,
                    participantIdentities: Array.from(room.participants.values()).map(p => p.identity),
                    localIdentity: room.localParticipant.identity
                });

                setRoom(room);
                room.participants.forEach(participant => {
                    handleParticipantConnected(participant);
                });

                room.on('participantConnected', handleParticipantConnected);
                room.on('participantDisconnected', handleParticipantDisconnected);


                const localTrack = localTracks.find(t => t.kind === 'video') as LocalVideoTrack;
                if (localVideoRef.current) {
                    if (localTrack) {
                        const el = localTrack.attach();
                        styleVideoElement(el);
                        localVideoRef.current.innerHTML = '';
                        localVideoRef.current.appendChild(el);
                    } else {
                        localVideoRef.current.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">You</p>`;
                    }
                }
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

    useEffect(() => {
        console.log('Current participants:', participants.length);
    }, [participants]);

    const handleParticipantConnected = (participant: RemoteParticipant) => {
        console.log('New participant joined:', {
            identity: participant.identity,
            currentParticipants: participants.length,
            newTotal: participants.length + 1
        });
    
        setParticipants(prev => [...prev, participant]);
    
        // Find first empty video container
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
            }
            else if (pub.track && pub.track.kind === 'audio') {
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
                videoAttached = true;
            }
            if (track.kind === 'audio') {
                const audioElement = (track as RemoteAudioTrack).attach();
                audioElement.style.display = 'none'; // hide it
                document.body.appendChild(audioElement); // or attach to the container
              }
            
        });
    
        if (!videoAttached) {
            currentRef.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">${participant.identity}</p>`;
        }
    };
    
    const styleVideoElement = (video: HTMLMediaElement) => {
        const videoElement = video as HTMLVideoElement;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
    };
    
    

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        setParticipants(prev => prev.filter(p => p !== participant));
        // Clear the video element containing this participant's video
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

    const handleVote = () => {
        setPhase('voting');
    };

    return (
        <>
            {phase === 'lobby' ? (
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
                            <h1 className="text-white text-2xl font-bold" style={{ borderBottom: '2px solid rgb(255, 255, 255)', paddingBottom: '5px', marginBottom: '10px' }}>
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
            ) : phase === 'game' ? (
                // GAME UI HERE
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
                            marginRight: '100px',
                            marginLeft: '-100px'
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
                                {isChameleon ? 'YOU ARE THE CHAMELEON!' : `THE SECRET WORD IS: ${secretWord}`}
                            </div>
                            <div
                                ref={localVideoRef}
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

                                            // Construct the PlayerAction-like payload
                                            const payload = {
                                                actionType: "GIVE_HINT", // or whatever action this represents
                                                gameSessionToken: gameToken, // assuming you have this from props or context
                                                actionContent: messageContent,
                                            };

                                            // Update local state (optional if you only want to update on success)
                                            //setMessages(prev => [...prev, messageContent]);
                                            //setGuessInput('');

                                            // Send to WebSocket server
                                            if (wsRef.current && wsRef.current.connected) {
                                                wsRef.current.publish({
                                                    destination: '/app/game/player-action',
                                                    body: JSON.stringify(payload),
                                                });
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

                        {/* Word List Box */}
                        <div style={{
                            backgroundColor: 'rgba(73, 190, 183, 0.2)',
                            width: '300px',
                            height: '450px',
                            border: '2px solid #49beb7',
                            borderRadius: '8px',
                            padding: '15px',
                            marginRight: '50px',
                            marginLeft: '-50px'
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
                            <button
                                onClick={handleVote}
                                className="home-button"
                            >
                                START VOTING
                            </button>
                        </div>
                    </div>
                </div>
                ): null}
                </>
                );
}
