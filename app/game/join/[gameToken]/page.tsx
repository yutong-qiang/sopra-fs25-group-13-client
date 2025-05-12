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
    LocalParticipant, 
    LocalAudioTrack
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
    const [isCopied, setIsCopied] = useState(false);

    const [room, setRoom] = useState<Room | null>(null);
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRefs = useRef<Array<HTMLDivElement | null>>([]);
    const currentTurnVideoRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<Client | null>(null);

    const [secretWord, setSecretWord] = useState<string | null>(null);
    const [isChameleon, setIsChameleon] = useState<boolean>(false);
    const [currentTurn, setCurrentTurn] = useState<string | null>(null);
    const [gameState, setGameState] = useState<string | null>(null);
    const [votingTimeLeft, setVotingTimeLeft] = useState<number>(30);

    type Phase = 'lobby' | 'role_chameleon' | 'role_player' | 'game' | 'voting' | 'chameleon_win'| 'chameleon_word_win' | 'chameleon_guess' | 'chameleon_loose';
    const [phase, setPhase] = useState<Phase>('lobby');

    const [guessInput, setGuessInput] = useState('');
    const [chameleonGuessInput, setChameleonGuessInput] = useState('');
    const [messages, setMessages] = useState<string[]>([]);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    const videoBoxStyle = {
        backgroundColor: '#000',
        minHeight: '150px',
        minWidth: '150px',
        border: '2px solid #49beb7',
        borderRadius: '8px',
        overflow: 'hidden'
    };

    const [hasVoted, setHasVoted] = useState(false);
    /*const [vote, setVote] = useState<string | null>(null);*/
    const [localParticipant] = useState<LocalParticipant | null>(null);

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);

    const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);

    const [videoUpdateCounter, setVideoUpdateCounter] = useState(0);
    const [participantUpdateCounter, setParticipantUpdateCounter] = useState(0);

    const sendHintButtonRef = useRef<HTMLButtonElement | null>(null);

    const handleVote = (playerId: string) => {
        if (hasVoted) return;

        // prevent self-voting
        if (localParticipant && playerId === localParticipant.identity) {
            console.log('You cannot vote for yourself!');
            return;
        }

        setHasVoted(true);
        /*setVote(playerId);*/
        console.log(`Voted for: ${playerId}`);

        // Send vote through WebSocket
        const payload = {
            actionType: "VOTE",
            gameSessionToken: gameToken,
            actionContent: playerId, // this must be the accused player's identity (username)
        };

        if (wsRef.current && wsRef.current.connected) {
            wsRef.current.publish({
                destination: '/game/player-action',
                body: JSON.stringify(payload),
                headers: {
                    'auth-token': token,
                }
            });
        } else {
            console.warn('WebSocket not connected');
        }
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
                        setVotingTimeLeft(30); // Reset timer when voting starts
                    }

                    if (data.actionType === "END_VOTING") {
                        if (data.actionResult === "CHAMELEON_FOUND") {
                            console.log("Chameleon was found! 🎯");
                            setPhase('chameleon_guess')
                        } else if (data.actionResult === "CHAMELEON_WON") {
                            console.log("Chameleon escaped! 🕵️‍♂️");
                            setPhase('chameleon_win');
                        }
                    }

                    if (data.actionType === "CHAMELEON_GUESS") {
                        if (data.actionResult === "CHAMELEON_WIN") {
                            setPhase('chameleon_word_win');
                        } else if (data.actionResult === "PLAYERS_WIN") {
                            setPhase('chameleon_loose');
                        }
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

    // Timer effect for voting phase
    useEffect(() => {
        if (phase !== 'voting' || votingTimeLeft <= 0) return;

        const timer = setInterval(() => {
            setVotingTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // When timer reaches 0, navigate to results page
                    /*router.push(`/results/chameleonCaught/${gameToken}`);*/
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, votingTimeLeft, gameToken, router]);

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
                room.participants.forEach(participant => {
                    handleParticipantConnected(participant);
                });

                room.on('participantConnected', participant => {
                    handleParticipantConnected(participant);
                    setParticipantUpdateCounter(c => c + 1);
                });
                room.on('participantDisconnected', () => {
                    setParticipantUpdateCounter(c => c + 1);
                });

                room.on('participantConnected', handleParticipantConnected);
                room.on('participantDisconnected', handleParticipantDisconnected);

                const localTrack = localTracks.find(t => t.kind === 'video') as LocalVideoTrack;
                const audioTrack = localTracks.find(t => t.kind === 'audio') as LocalAudioTrack;
                setLocalVideoTrack(localTrack);
                setLocalAudioTrack(audioTrack);
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

    // Re-attach local video when switching to the 'game' phase
/*useEffect(() => {
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
}, [phase, room]);*/

    /*useEffect(() => {
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
    }, [phase, room]);*/

    /*const attachRemoteVideoTrack = (track: RemoteVideoTrack, participantSid: string) => {
        const container = document.getElementById(`remote-video-${participantSid}`);
        if (container) {
            const videoEl = track.attach();
            styleVideoElement(videoEl);
            container.innerHTML = '';
            container.appendChild(videoEl);
        }
    };*/

    function detachAllVideoTracks(participant: RemoteParticipant | LocalParticipant) {
        participant.videoTracks.forEach(publication => {
            const track = publication.track;
            if (track && track.kind === 'video') {
                track.detach().forEach(el => el.remove());
            }
        });
    }

    useEffect(() => {
        if (!room || (phase !== 'game' && phase !== 'voting')) return;

        // Detach existing tracks
        detachAllVideoTracks(room.localParticipant);
        room.participants.forEach(detachAllVideoTracks);

        // ----- Local Video -----
        const localContainer = localVideoRef.current;
        if (localContainer) {
            localContainer.innerHTML = '';

            let localVideoTrack: LocalVideoTrack | undefined;

            room.localParticipant.videoTracks.forEach(publication => {
                if (publication.track?.kind === 'video') {
                    localVideoTrack = publication.track as LocalVideoTrack;
                }
            });

            if (localVideoTrack) {
                const videoElement = localVideoTrack.attach();
                videoElement.muted = true;
                styleVideoElement(videoElement);
                localContainer.appendChild(videoElement);
            }
        }

        // ----- Remote Videos -----
        const remoteParticipantsArray = Array.from(room.participants.values());

        remoteParticipantsArray.forEach((participant, index) => {
            const container = remoteVideoRefs.current?.[index];
            if (!container) return;

            container.innerHTML = '';

            let videoTrack: RemoteVideoTrack | undefined;

            participant.videoTracks.forEach(publication => {
                if (publication.track?.kind === 'video') {
                    videoTrack = publication.track as RemoteVideoTrack;
                }
            });

            if (videoTrack) {
                const videoElement = videoTrack.attach();
                styleVideoElement(videoElement);
                container.appendChild(videoElement);
            }
        });

        // ----- Current Turn Camera (only in game phase) -----
        if (phase === 'game') {
            const currentContainer = currentTurnVideoRef.current;
            if (currentContainer) {
                currentContainer.innerHTML = '';

                const isLocal = currentTurn === room.localParticipant.identity;

                const targetParticipant = isLocal
                    ? room.localParticipant
                    : remoteParticipantsArray.find(p => p.identity === currentTurn);

                if (!targetParticipant) {
                    console.warn("Participant not found for current turn:", currentTurn);
                    currentContainer.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">${currentTurn}</p>`;
                    return;
                }

                let videoTrack: LocalVideoTrack | RemoteVideoTrack | undefined;

                targetParticipant.videoTracks.forEach(publication => {
                    if (publication.track?.kind === 'video') {
                        videoTrack = publication.track as LocalVideoTrack | RemoteVideoTrack;
                    }
                });

                if (videoTrack) {
                    let videoElement: HTMLVideoElement | null = null;

                    if (isLocal) {
                        try {
                            const clonedTrack = videoTrack.mediaStreamTrack.clone();
                            const stream = new MediaStream([clonedTrack]);
                            videoElement = document.createElement('video');
                            videoElement.srcObject = stream;
                            videoElement.autoplay = true;
                            videoElement.playsInline = true;
                            videoElement.muted = true;
                        } catch (err) {
                            console.warn('Failed to clone local track. Falling back to attach()', err);
                            videoElement = videoTrack.attach() as HTMLVideoElement;
                            videoElement.muted = true;
                        }
                    } else {
                        videoElement = videoTrack.attach() as HTMLVideoElement;
                    }

                    if (videoElement) {
                        styleVideoElement(videoElement);
                        currentContainer.appendChild(videoElement);
                    }
                } else {
                    currentContainer.innerHTML = `<p style="color:white;text-align:center;margin-top:40px;">${currentTurn}</p>`;
                }
            }
        }

        // Cleanup
        return () => {
            detachAllVideoTracks(room.localParticipant);
            room.participants.forEach(detachAllVideoTracks);
            if (phase === 'game' && currentTurnVideoRef.current) {
                currentTurnVideoRef.current.innerHTML = '';
            }
        };
    }, [room, phase, currentTurn]);

    // Add new useEffect for lobby phase
    useEffect(() => {
        if (!room || phase !== 'lobby') return;

        // Detach existing tracks
        detachAllVideoTracks(room.localParticipant);
        room.participants.forEach(detachAllVideoTracks);

        // ----- Local Video -----
        const localContainer = localVideoRef.current;
        if (localContainer) {
            localContainer.innerHTML = '';
            let localVideoTrack: LocalVideoTrack | undefined;
            room.localParticipant.videoTracks.forEach(publication => {
                if (publication.track?.kind === 'video') {
                    localVideoTrack = publication.track as LocalVideoTrack;
                }
            });
            if (localVideoTrack) {
                const videoElement = localVideoTrack.attach();
                videoElement.muted = true;
                styleVideoElement(videoElement);
                localContainer.appendChild(videoElement);
            }
        }

        // ----- Remote Videos -----
        const remoteParticipantsArray = Array.from(room.participants.values());
        remoteParticipantsArray.forEach((participant, index) => {
            const container = remoteVideoRefs.current?.[index];
            if (!container) return;
            container.innerHTML = '';
            let videoTrack: RemoteVideoTrack | undefined;
            participant.videoTracks.forEach(publication => {
                if (publication.track?.kind === 'video') {
                    videoTrack = publication.track as RemoteVideoTrack;
                }
            });
            if (videoTrack) {
                const videoElement = videoTrack.attach();
                styleVideoElement(videoElement);
                container.appendChild(videoElement);
            }
        });

        // Cleanup
        return () => {
            detachAllVideoTracks(room.localParticipant);
            room.participants.forEach(detachAllVideoTracks);
        };
    }, [room, phase, videoUpdateCounter, participantUpdateCounter]);

    const handleParticipantConnected = (participant: RemoteParticipant) => {
        console.log(`Participant ${participant.identity} connected`);
        
        // Track rendering function - only handle audio tracks now
        const attachTrack = (track: Track) => {
            if (track.kind === 'audio') {
                try {
                    const audioElement = (track as RemoteAudioTrack).attach();
                    audioElement.style.display = 'none';
                    document.body.appendChild(audioElement);
                    console.log(`Audio track attached for ${participant.identity}`);
                } catch (err) {
                    console.error('Error attaching audio track:', err);
                }
            }
        };
    
        // 🔧 Attach already available tracks
        participant.tracks.forEach(publication => {
            console.log(`Checking track for ${participant.identity}:`, publication.trackName, 'isSubscribed:', publication.isSubscribed);
            
            if (publication.isSubscribed && publication.track) {
                console.log(`Attaching available ${publication.trackName} track for ${participant.identity}`);
                attachTrack(publication.track);
            }
        });
    
        // 📥 Listen for new subscriptions - only handle audio tracks, but also listen for video for update counter
        participant.on('trackSubscribed', (track) => {
            if (track.kind === 'audio') {
                console.log(`New audio track subscribed for ${participant.identity}`);
                attachTrack(track);
            } else if (track.kind === 'video') {
                setVideoUpdateCounter(c => c + 1);
            }
        });
        participant.on('trackUnsubscribed', (track) => {
            if (track.kind === 'video') {
                setVideoUpdateCounter(c => c + 1);
            }
        });
        
        // Handle track publication - only handle audio tracks
        participant.on('trackPublished', (publication) => {
            if (publication.trackName === 'audio') {
                console.log(`Audio track published by ${participant.identity}`);
                if (publication.isSubscribed && publication.track) {
                    attachTrack(publication.track);
                }
            }
        });
    };


    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        console.log(`Participant ${participant.identity} disconnected`);
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
        router.push('/main?reset=true');
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

    const remoteParticipants = room ? Array.from(room.participants.values()) : [];
    const allNames = [room?.localParticipant?.identity || "You (Local)", ...remoteParticipants.map(p => p.identity)];

    function handleMuteUnmute() {
        if (localAudioTrack) {
            if (isMicOn) {
                localAudioTrack.disable();
            } else {
                localAudioTrack.enable();
            }
            setIsMicOn(!isMicOn);
        }
    }

    function handleCameraOnOff() {
        if (localVideoTrack) {
            if (isCameraOn) {
                localVideoTrack.disable();
            } else {
                localVideoTrack.enable();
            }
            setIsCameraOn(!isCameraOn);
        }
    }

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
                              {Array(7).fill(null).map((_, index) => {
                                  const isFilled = index < remoteParticipants.length;

                                  return (
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
                                              className={isFilled ? "video-element" : "chameleon-box"}
                                              style={{
                                                  backgroundColor: isFilled ? '#000' : 'green',
                                                  minHeight: '150px',
                                                  minWidth: '150px',
                                                  border: '2px solid #49beb7',
                                                  borderRadius: '8px',
                                                  overflow: 'hidden',
                                                  display: 'flex',
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  color: 'white',
                                                  fontWeight: 'bold',
                                                  fontSize: '16px'
                                              }}
                                          >
                                              <span style={{ visibility: 'hidden' }}>Available Slot</span>
                                          </div>
                                      </div>
                                  )
                              })}
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
                              <button
                                  onClick={() => {
                                      navigator.clipboard.writeText(gameToken as string);
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
                          <div style={{ fontSize: '1.5rem', opacity: 0.9 }}>
                              ({remoteParticipants.length + 1}/8 players)
                          </div>
                          <div style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px' }}>
                              Connected Players: {remoteParticipants.length + 1}
                              <ul>
                                  {allNames.map((name, index) => (
                                      <li key={index}>{name}</li>
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
                              {Array(7).fill(null).map((_, index) => {
                                  const isFilled = index < remoteParticipants.length;

                                  return (
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
                                              className={isFilled ? "video-element" : "chameleon-box"}
                                              style={{
                                                  backgroundColor: isFilled ? '#000' : 'green',
                                                  minHeight: '150px',
                                                  minWidth: '150px',
                                                  border: '2px solid #49beb7',
                                                  borderRadius: '8px',
                                                  overflow: 'hidden',
                                                  display: 'flex',
                                                  justifyContent: 'center',
                                                  alignItems: 'center',
                                                  color: 'white',
                                                  fontWeight: 'bold',
                                                  fontSize: '16px'
                                              }}
                                          >
                                              <span style={{ visibility: 'hidden' }}>Available Slot</span>
                                          </div>
                                      </div>
                                  )
                              })}
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
                              {!currentTurn
                                  ? 'ALL TURNS ARE OVER'
                                  : isChameleon
                                      ? `YOU ARE THE CHAMELEON! CURRENT TURN: ${currentTurn}`
                                      : `THE SECRET WORD IS: ${secretWord}! CURRENT TURN: ${currentTurn}`}
                          </div>

                          {!currentTurn ? (
                              <div className={'chameleon-box'}
                                  style={{
                                  backgroundColor: '#000',
                                  width: '600px',
                                  height: '450px',
                                  border: '2px solid #49beb7',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  color: 'white',
                                  fontSize: '46px',
                                  fontWeight: 'bold',
                                  textAlign: 'center',
                                  padding: '20px'
                              }}>
                                  START THE VOTING NOW TO CATCH THE CHAMELEON!
                              </div>
                          ) : (
                              <div
                                  ref={currentTurnVideoRef}
                                  className="video-element"
                                  style={{
                                      backgroundColor: '#000',
                                      width: '600px',
                                      height: '450px',
                                      border: '2px solid #49beb7',
                                      borderRadius: '8px',
                                      overflow: 'hidden'
                                  }}
                              />
                          )}

                          <div style={{
                              display: 'flex',
                              gap: '10px',
                              width: '100%',
                              flexDirection: 'column'
                          }}>
                              {warningMessage && (
                                  <div style={{
                                      backgroundColor: 'rgba(255, 99, 71, 0.7)',
                                      color: 'white',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      textAlign: 'center',
                                      marginBottom: '5px',
                                      fontSize: '14px',
                                      fontWeight: 'bold'
                                  }}>
                                      {warningMessage}
                                  </div>
                              )}
                              <div style={{
                                  display: 'flex',
                                  gap: '10px',
                                  width: '100%'
                              }}>
                                  <input
                                      type="text"
                                      placeholder="Type your guess..."
                                      value={guessInput}
                                      onChange={(e) => {
                                          setGuessInput(e.target.value);
                                          // Clear warning when input changes
                                          if (warningMessage) setWarningMessage(null);
                                          
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          sendHintButtonRef.current?.click();
                                        }
                                      }}
                                    
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
                                      ref={sendHintButtonRef}
                                      onClick={() => {
                                          if (guessInput.trim()) {
                                              const messageContent = guessInput.trim();
                                              
                                              // Check if the input contains multiple words
                                              if (messageContent.includes(' ')) {
                                                  setWarningMessage("Only one word allowed!");
                                                  return;
                                              }
      
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

                                              // Clear the input after successful send
                                              setGuessInput('');
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
                  padding: '20px'
              }}>
                  {/* Header Text - Moved outside the containers to be at the top */}
                  <div style={{
                      position: 'absolute',
                      top: '40px',
                      backgroundColor: '#49beb7',
                      borderRadius: '25px',
                      padding: '10px 20px',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      width: '350px',
                      zIndex: 10
                  }}>
                      <span>VOTE FOR THE CHAMELEON! </span>
                      <span style={{ marginLeft: '10px' }}>
                          {`00:${String(votingTimeLeft).padStart(2, '0')}`}
                      </span>
                  </div>

                  <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      maxWidth: '1200px',
                      marginTop: '40px'
                  }}>
                      {/* Main voting section - Left side */}
                      <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: '70%'
                      }}>
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
                                      <span style={{ color: 'white', marginTop: '8px' }}>{localParticipant?.identity}</span>
                                      <button
                                          disabled={hasVoted || localParticipant?.identity === 'localParticipantId'}
                                          style={{
                                              visibility: 'hidden',
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
                                          }}
                                      >
                                          VOTE
                                      </button>
                                  </div>

                                  {/* Remote Videos */}
                                  {Array(7).fill(null).map((_, index) => {
                                      const isFilled = index < remoteParticipants.length;
                                      const participant = remoteParticipants[index];

                                      return (
                                          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                              <div
                                                  ref={(el: HTMLDivElement | null) => {
                                                      if (remoteVideoRefs.current) {
                                                          remoteVideoRefs.current[index] = el;
                                                      }
                                                  }}
                                                  className={isFilled ? "video-element" : "chameleon-box"}
                                                  style={{
                                                      backgroundColor: isFilled ? '#000' : 'green',
                                                      minHeight: '150px',
                                                      minWidth: '150px',
                                                      border: '2px solid #49beb7',
                                                      borderRadius: '8px',
                                                      overflow: 'hidden',
                                                      display: 'flex',
                                                      justifyContent: 'center',
                                                      alignItems: 'center',
                                                      color: 'white',
                                                      fontWeight: 'bold',
                                                      fontSize: '16px'
                                                  }}
                                              >
                                              </div>
                                              {isFilled && (
                                                  <>
                                                      <span style={{ color: 'white', marginTop: '8px' }}>{participant?.identity}</span>
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
                                                          onClick={() => handleVote(participant?.identity)}
                                                      >
                                                          VOTE
                                                      </button>
                                                  </>
                                              )}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>

                      {/* Word List Box - Right side */}
                      <div style={{
                          width: '25%',
                          marginRight: '20px',
                          marginTop: '30px'
                      }}>
                          <div style={{
                              width: '100%',
                              height: '450px',
                              border: '2px solid #49beb7',
                              borderRadius: '8px',
                              padding: '20px',
                              backgroundColor: 'rgba(73, 190, 183, 0.2)'
                          }}>
                              <h2 style={{
                                  color: '#fff',
                                  fontSize: '24px',
                                  textAlign: 'center',
                                  marginBottom: '20px',
                                  borderBottom: '2px solid #49beb7',
                                  paddingBottom: '10px'
                              }}>
                                  WORD LIST
                              </h2>
                              <ul style={{ color: '#49beb7', fontSize: '18px', listStyleType: 'none', padding: 0 }}>
                                  {messages.map((msg, idx) => (
                                      <li key={idx} style={{ marginBottom: '15px', textAlign: 'center' }}>{msg}</li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
          )}


          {phase === 'chameleon_guess' && (
              <div className="home-container">
                  {isChameleon ? (
                      <div className={"button-container"}
                          style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '20px',
                          color: 'white'
                      }}>
                          <h1 className="chameleon-title" style={{ fontSize: '32px', marginBottom: '20px', color: '#d60006', borderBottom: '2px solid #d60006' }}>
                              YOU GOT CAUGHT!
                          </h1>
                          <p className="chameleon-subtitle" style={{ fontSize: '20px', maxWidth: '600px' }}>
                              CAN YOU STILL WIN BY GUESSING THE SECRET WORD?
                          </p>

                          <input
                              type="text"
                              value={chameleonGuessInput}
                              onChange={(e) => setChameleonGuessInput(e.target.value)}
                              placeholder="Enter the secret word..."
                              style={{
                                  padding: '10px 20px',
                                  fontSize: '16px',
                                  borderRadius: '8px',
                                  marginTop: '20px',
                                  marginBottom: '20px',
                                  border: '2px solid #49beb7',
                                  width: '300px'
                              }}
                          />

                          <button
                              onClick={() => {
                                  if (chameleonGuessInput.trim()) {
                                      const payload = {
                                          actionType: "CHAMELEON_GUESS",
                                          gameSessionToken: gameToken,
                                          actionContent: chameleonGuessInput.trim(),
                                      };

                                      if (wsRef.current && wsRef.current.connected) {
                                          wsRef.current.publish({
                                              destination: '/game/player-action',
                                              body: JSON.stringify(payload),
                                              headers: {
                                                  'auth-token': token,
                                              },
                                          });
                                      } else {
                                          console.warn('WebSocket not connected');
                                      }
                                  }
                              }}
                              style={{
                                  marginTop: '30px',
                                  backgroundColor: '#49beb7',
                                  color: 'white',
                                  border: 'none',
                                  padding: '10px 20px',
                                  fontSize: '16px',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                              }}
                          >

                              Submit Guess
                          </button>
                      </div>
                  ) : (
                      <div className="chameleon-box">
                          <h1 className="chameleon-title">THE <span className="highlight">CHAMELEON</span> WAS DISCOVERED!</h1>
                          <h1 className="chameleon-subtitle">WAITING FOR THEM TO GUESS THE SECRET WORD!</h1>
                      </div>
                  )}
              </div>
          )}

          {phase === 'chameleon_win' && (
              <div className="home-container" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '100vh',
                  padding: '20px',
                  flexDirection: 'column',
                  backgroundColor: '#222',
                  color: 'white',
                  textAlign: 'center'
              }}>
                  <div className={"button-container"}>
                      {isChameleon ? (
                          <>
                              <h1 className="chameleon-title" style={{ fontSize: '32px', marginBottom: '20px', color: '#00d6b1', borderBottom: '2px solid #00d6b1' }}>
                                  🎉 YOU GOT AWAY, CHAMELEON!
                              </h1>
                              <p className="chameleon-subtitle" style={{ fontSize: '24px', maxWidth: '600px' }}>
                                  GREAT JOB BLENDING IN! NO ONE CAUGHT YOU.
                              </p>
                          </>
                      ) : (
                          <>
                              <h1 className="chameleon-title" style={{ fontSize: '32px', marginBottom: '20px', color: '#d60006', borderBottom: '2px solid #d60006' }}>
                                  🦎 THE CHAMELEON GOT AWAY!
                              </h1>
                              <p className="chameleon-subtitle" style={{ fontSize: '24px', maxWidth: '600px' }}>
                                  YOU DID NOT IDENTIFY THE CHAMELEON! BETTER LUCK NEXT TIME!
                              </p>
                          </>
                      )}
                      <button
                          onClick={handleReturn} // Replace later with how we start a new round
                          style={{
                              marginTop: '30px',
                              backgroundColor: '#49beb7',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              fontSize: '16px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                          }}
                      >
                          Next Round
                      </button>
                  </div>
              </div>
          )}

          {phase === 'chameleon_word_win' && (
              <div className="home-container" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '100vh',
                  padding: '20px',
                  flexDirection: 'column',
                  backgroundColor: '#222',
                  color: 'white',
                  textAlign: 'center'
              }}>
                  <div className={"button-container"}>
                      {isChameleon ? (
                          <>
                              <h1 className="chameleon-title" style={{ fontSize: '32px', marginBottom: '20px', color: '#00d6b1', borderBottom: '2px solid #00d6b1' }}>
                                  🎉 YOU FIGURED OUT THE SECRET WORD, CHAMELEON!
                              </h1>
                              <p className="chameleon-subtitle" style={{ fontSize: '24px', maxWidth: '600px' }}>
                                  GREAT DEDUCTION SKILLS! NO ONE CAN FOOL YOU.
                              </p>
                          </>
                      ) : (
                          <>
                              <h1 className="chameleon-title" style={{ fontSize: '32px', marginBottom: '20px', color: '#d60006', borderBottom: '2px solid #d60006' }}>
                                  🦎 THE CHAMELEON FIGURED OU THE SECRET WORD!
                              </h1>
                              <p className="chameleon-subtitle" style={{ fontSize: '24px', maxWidth: '600px' }}>
                                  YOU WILL HAVE TO BE MORE CAREFUL NEXT TIME!
                              </p>
                          </>
                      )}
                      <button
                          onClick={handleReturn} // Replace later with how we start a new round
                          style={{
                              marginTop: '30px',
                              backgroundColor: '#49beb7',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              fontSize: '16px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                          }}
                      >
                          Next Round
                      </button>
                  </div>
              </div>
          )}

          {phase === 'chameleon_loose' && (
              <div className="home-container" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '100vh',
                  padding: '20px',
                  flexDirection: 'column',
                  backgroundColor: '#222',
                  color: 'white',
                  textAlign: 'center'
              }}>
                  <div className={"button-container"}>
                      {isChameleon ? (
                          <>
                              <h1 className="chameleon-title" style={{ fontSize: '32px', marginBottom: '20px', color: '#d60006', borderBottom: '2px solid #d60006' }}>
                                  🦎 YOU WERE CAUGHT!
                              </h1>
                              <p className="chameleon-subtitle" style={{ fontSize: '24px', maxWidth: '600px' }}>
                                  YOU WILL HAVE TO BE MORE CAREFUL NEXT TIME!
                              </p>
                          </>
                      ) : (
                          <>
                              <h1 className="chameleon-title" style={{ fontSize: '32px', marginBottom: '20px', color: '#00d6b1', borderBottom: '2px solid #00d6b1' }}>
                                  🎉 YOU CAUGHT THE CHAMELEON !
                              </h1>
                              <p className="chameleon-subtitle" style={{ fontSize: '24px', maxWidth: '600px' }}>
                                  THE SNEAKY ANIMAL COULD NOT FOOL YOUR KEEN SENSES. GREAT JOB!
                              </p>
                          </>
                      )}
                      <button
                          onClick={handleReturn} // Replace later with how we start a new round
                          style={{
                              marginTop: '30px',
                              backgroundColor: '#49beb7',
                              color: 'white',
                              border: 'none',
                              padding: '10px 20px',
                              fontSize: '16px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                          }}
                      >
                          Next Round
                      </button>
                  </div>
              </div>
          )}

          {(phase === 'lobby' || phase === 'game' || phase === 'voting') && localVideoTrack && localAudioTrack && (
          <div
              style={{
                  position: 'fixed',
                  right: '32px',
                  bottom: '32px',
                  zIndex: 1000,
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
              }}
          >
              <button
                  onClick={handleMuteUnmute}
                  style={{
                      background: isMicOn ? 'rgba(73, 190, 183, 0.25)' : 'rgba(231, 76, 60, 0.18)',
                      border: '4px solid',
                      borderColor: isMicOn ? '#49beb7' : '#e74c3c',
                      borderRadius: '50%',
                      width: '70px',
                      height: '70px',
                      cursor: 'pointer',
                      color: isMicOn ? '#49beb7' : '#e74c3c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none',
                      padding: 0,
                      margin: 0,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
                  }}
                  onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.18)';
                  }}
                  onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.10)';
                  }}
                  title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                  <span style={{ fontSize: '2rem', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 0 8px #fff, 0 0 2px #49beb7' }}>
                      {isMicOn ? '🎤' : '🔇'}
                  </span>
              </button>
              <button
                  onClick={handleCameraOnOff}
                  style={{
                      background: isCameraOn ? 'rgba(73, 190, 183, 0.25)' : 'rgba(231, 76, 60, 0.18)',
                      border: '4px solid',
                      borderColor: isCameraOn ? '#49beb7' : '#e74c3c',
                      borderRadius: '50%',
                      width: '70px',
                      height: '70px',
                      cursor: 'pointer',
                      color: isCameraOn ? '#49beb7' : '#e74c3c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none',
                      padding: 0,
                      margin: 0,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
                  }}
                  onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.18)';
                  }}
                  onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.10)';
                  }}
                  title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                  <span style={{ fontSize: '2rem', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 0 8px #fff, 0 0 2px #49beb7' }}>
                      {isCameraOn ? '📷' : '🚫'}
                  </span>
              </button>
          </div>
          )}
      </>
  );
}