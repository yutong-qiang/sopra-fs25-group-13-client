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
              : 'wss://sopra-fs24-group-13-server.oa.r.appspot.com/game-ws'
          ),
          reconnectDelay: 5000,
          debug: (str) => console.log(str),
          onConnect: () => {
            console.log('✅ STOMP connected');

            stompClient.subscribe(`/game/topic/${gameToken}`, (message) => {
              const data = JSON.parse(message.body);
              console.log('📨 Message received:', data);

              if (data.actionType === 'START_GAME') {
                router.push(`/role/chameleon/${gameToken}`);
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

    /*const stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/game-ws'),
            reconnectDelay: 5000,
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log('✅ STOMP connected');

                stompClient.subscribe(`/game/topic/${gameToken}`, (message) => {
                    const data = JSON.parse(message.body);
                    console.log('📨 Message received:', data);

                    if (data.actionType === 'START_GAME') {
                        router.push(`/role/chameleon/${gameToken}`);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame.headers['message'], frame.body);
            }
        }); */

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
            /*router.push(`/role/chameleon/${gameToken}`);*/

        } else {
            console.error('❌ STOMP client not connected');
        }
    };

    const handleReturn = () => {
        router.push('/main');
    };

  return (
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
            {/* Create 7 remote video containers with unique refs */}
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
            Connected Players: {participants.length + 1} {/* +1 for local participant */}
            <ul>
                <li>You (Local)</li>
                {participants.map((p, index) => (
                    <li key={index}>{p.identity}</li>
                ))}
            </ul>
          </div>
          <div className="flex gap-4 w-full" style={{ marginTop: '20px' }}>
                <button
                 onClick={handleReturn}
                    className="home-button"
                >
                    RETURN
                </button>
                <button
                    onClick={handleStartGame}
                    className="home-button"
                >
                    START GAME
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
