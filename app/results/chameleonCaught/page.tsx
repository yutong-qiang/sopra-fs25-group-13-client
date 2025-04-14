"use client";

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { connect, Room, LocalParticipant, RemoteParticipant, LocalTrackPublication, RemoteTrackPublication, Track, LocalVideoTrack, RemoteVideoTrack, createLocalTracks } from 'twilio-video';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Form, Input } from 'antd';
import '../../styles/home.css';


interface VideoResponse {
    gameSessionId: number;
    gameToken: string;
    twilioVideoChatToken: string;
    twilioRoomSid: string;
    playerOrder: string[]; // Array of player IDs in speaking order
    currentSpeakingPlayer: string; // ID of the currently speaking player
}

export default function ChameleonCaughtPage() {
    const params = useParams();
    const router = useRouter();
    const gameToken = Array.isArray(params?.gameToken)
        ? params.gameToken[0]
        : params?.gameToken as string;
    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playerOrder, setPlayerOrder] = useState<string[]>([]);
    const [currentSpeakingPlayer, setCurrentSpeakingPlayer] = useState<string>('');
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRef = useRef<HTMLDivElement>(null);
    const centerVideoRef = useRef<HTMLDivElement>(null);
    const apiService = useApi();
    const { value: token } = useLocalStorage<string>("token", "");
    const [messages, setMessages] = useState<string[]>([]);

    const [guess, setGuess] = useState("");
    const SECRET_WORD = "butterfly";

    const handleSubmit = () => {
        const trimmedGuess = guess.trim();
        if (!trimmedGuess) return;

        if (trimmedGuess.toLowerCase() === SECRET_WORD.toLowerCase()) {
            router.push('/win/chameleon');
        } else {
            router.push('/win/players');
        }
    };

    useEffect(() => {
        const connectToVideoRoom = async () => {
            try {
                setIsLoading(true);

                const response = await apiService.post<VideoResponse>(`/game/join/${gameToken}`, null, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.twilioVideoChatToken) {
                    throw new Error('No video token received');
                }

                const localTracks = await createLocalTracks({
                    video: { width: 640, height: 480 },
                    audio: true
                });

                const videoRoom = await connect(response.twilioVideoChatToken, {
                    name: response.twilioRoomSid,
                    tracks: localTracks
                });

                setRoom(videoRoom);

                const localParticipant = videoRoom.localParticipant;
                console.log('Local participant:', localParticipant);

                // Set mock data first
                setPlayerOrder([localParticipant.identity, 'player2', 'player3', 'player4', 'player5']);
                setCurrentSpeakingPlayer(localParticipant.identity);

                // Then handle video tracks
                const videoTrack = localTracks.find(track => track.kind === 'video');
                if (videoTrack && localVideoRef.current) {
                    const videoElement = (videoTrack as LocalVideoTrack).attach();
                    videoElement.style.width = '100%';
                    videoElement.style.height = '100%';
                    videoElement.style.objectFit = 'cover';

                    localVideoRef.current.innerHTML = '';
                    localVideoRef.current.appendChild(videoElement);

                    // Also show in center since we're the current speaker
                    const centerVideoElement = (videoTrack as LocalVideoTrack).attach();
                    centerVideoElement.style.width = '100%';
                    centerVideoElement.style.height = '100%';
                    centerVideoElement.style.objectFit = 'cover';

                    if (centerVideoRef.current) {
                        centerVideoRef.current.innerHTML = '';
                        centerVideoRef.current.appendChild(centerVideoElement);
                    }
                }

                videoRoom.participants.forEach(handleParticipantConnected);
                videoRoom.on('participantConnected', handleParticipantConnected);
                videoRoom.on('participantDisconnected', handleParticipantDisconnected);

                setIsLoading(false);
            } catch (error) {
                console.error('Error connecting to video room:', error);
                setError(error instanceof Error ? error.message : 'Failed to connect to video room');
                setIsLoading(false);
            }
        };

        const handleParticipantConnected = (participant: RemoteParticipant) => {
            setParticipants(prevParticipants => [...prevParticipants, participant]);

            participant.tracks.forEach((publication: RemoteTrackPublication) => {
                if (publication.track) {
                    const remoteTrack = publication.track;
                    if (remoteTrack.kind === 'video' && remoteVideoRef.current) {
                        const videoElement = (remoteTrack as RemoteVideoTrack).attach();
                        videoElement.style.width = '100%';
                        videoElement.style.height = '100%';
                        videoElement.style.objectFit = 'cover';
                        remoteVideoRef.current.innerHTML = '';
                        remoteVideoRef.current.appendChild(videoElement);

                        // If this is the current speaking player, show in center
                        if (currentSpeakingPlayer === participant.identity && centerVideoRef.current) {
                            const centerVideoElement = (remoteTrack as RemoteVideoTrack).attach();
                            centerVideoElement.style.width = '100%';
                            centerVideoElement.style.height = '100%';
                            centerVideoElement.style.objectFit = 'cover';
                            centerVideoRef.current.innerHTML = '';
                            centerVideoRef.current.appendChild(centerVideoElement);
                        }
                    }
                }
            });

            participant.on('trackSubscribed', (track: Track) => {
                if (track.kind === 'video' && remoteVideoRef.current) {
                    const videoElement = (track as RemoteVideoTrack).attach();
                    videoElement.style.width = '100%';
                    videoElement.style.height = '100%';
                    videoElement.style.objectFit = 'cover';
                    remoteVideoRef.current.innerHTML = '';
                    remoteVideoRef.current.appendChild(videoElement);

                    // Update center video if needed
                    if (currentSpeakingPlayer === participant.identity && centerVideoRef.current) {
                        const centerVideoElement = (track as RemoteVideoTrack).attach();
                        centerVideoElement.style.width = '100%';
                        centerVideoElement.style.height = '100%';
                        centerVideoElement.style.objectFit = 'cover';
                        centerVideoRef.current.innerHTML = '';
                        centerVideoRef.current.appendChild(centerVideoElement);
                    }
                }
            });
        };

        const handleParticipantDisconnected = (participant: RemoteParticipant) => {
            setParticipants(prevParticipants =>
                prevParticipants.filter(p => p !== participant)
            );
        };

        if (gameToken && token) {
            connectToVideoRoom();
        }

        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [gameToken, token, apiService]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080/game-ws');

        socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        socket.onmessage = (event) => {
            const newMessage = event.data;
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            socket.close();
        };
    }, []);

    return (
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
                <div className="video-container" style={{ marginLeft: '20px' }}>
                    <div className="video-wrapper" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 150px)',
                        gap: '20px'
                    }}>
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

                {/* Center screen and input section */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    marginRight: '100px',
                    marginLeft: '-100px'
                }}>
                    <div
                        className={'chameleon-box'}
                        style={{
                            backgroundColor: '#000',
                            width: '600px',
                            height: '450px',
                            border: '2px solid #49beb7',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '20px'
                        }}>
                        <h1 className="chameleon-title">YOU HAVE BEEN CAUGHT! </h1>
                        <h1 className="chameleon-subtitle">GUESS <span className="highlight">THE SECRET WORD</span>!</h1>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        width: '100%'
                    }}>
                        <input
                            type="text"
                            placeholder="Type your guess..."
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
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
                            onClick={handleSubmit}
                            disabled={!guess.trim()}
                            style={{
                                padding: '10px 30px',
                                borderRadius: '25px',
                                border: 'none',
                                backgroundColor: '#49beb7',
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                cursor: guess.trim() ? 'pointer' : 'not-allowed',
                                opacity: guess.trim() ? 1 : 0.6,
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
                    <ul style={{
                        color: '#49beb7',
                        fontSize: '18px',
                        listStyleType: 'none',
                        padding: 0
                    }}>
                        <li style={{ marginBottom: '10px' }}>AIR</li>
                        <li style={{ marginBottom: '10px' }}>SUMMER</li>
                        <li style={{ marginBottom: '10px' }}>INSECT</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}