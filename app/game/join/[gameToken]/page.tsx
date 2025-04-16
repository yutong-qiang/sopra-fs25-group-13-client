"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { connect, createLocalTracks, LocalVideoTrack, RemoteVideoTrack, Room, Track, RemoteParticipant } from 'twilio-video';
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
}

export default function GameSessionPage() {
    const { gameToken } = useParams();
    const router = useRouter();
    const apiService = useApi();
    const { value: token } = useLocalStorage<string>("token", "");

    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<Client | null>(null);

    // === WebSocket Setup using STOMP over SockJS ===
    useEffect(() => {
        if (!token || !gameToken) return;

        const stompClient = new Client({
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
        });

        stompClient.activate();
        wsRef.current = stompClient;

        return () => {
            stompClient.deactivate();
        };
    }, [token, gameToken]);

    // === Twilio Video Setup ===
    useEffect(() => {
        if (!gameToken || !token) return;

        const setupVideo = async () => {
            const localTracks = await createLocalTracks({ audio: true, video: { width: 640 } });

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

            const localTrack = localTracks.find(t => t.kind === 'video') as LocalVideoTrack;
            if (localVideoRef.current) {
                const el = localTrack.attach();
                localVideoRef.current.appendChild(el);
            }

            room.participants.forEach(handleParticipantConnected);
            room.on('participantConnected', handleParticipantConnected);
            room.on('participantDisconnected', handleParticipantDisconnected);
        };

        setupVideo();

        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [gameToken, token]);

    const handleParticipantConnected = (participant: RemoteParticipant) => {
        setParticipants(prev => [...prev, participant]);
        participant.tracks.forEach(pub => {
            if (pub.track && pub.track.kind === 'video' && remoteVideoRef.current) {
                const videoElement = (pub.track as RemoteVideoTrack).attach();
                remoteVideoRef.current.appendChild(videoElement);
            }
        });

        participant.on('trackSubscribed', (track: Track) => {
            if (track.kind === 'video' && remoteVideoRef.current) {
                const videoElement = (track as RemoteVideoTrack).attach();
                remoteVideoRef.current.appendChild(videoElement);
            }
        });
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        setParticipants(prev => prev.filter(p => p !== participant));
    };

    const handleStartGame = () => {
        const stompClient = wsRef.current;

        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: `/game/start`,
                body: JSON.stringify({ type: 'START_GAME', gameSessionToken: gameToken })
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
            <div
              ref={remoteVideoRef}
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
            <div
              ref={remoteVideoRef}
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
            <div
              ref={remoteVideoRef}
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
            <div
              ref={remoteVideoRef}
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
            <div
              ref={remoteVideoRef}
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
            <div
              ref={remoteVideoRef}
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
            <div
              ref={remoteVideoRef}
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
