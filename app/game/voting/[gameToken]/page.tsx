"use client";

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { connect, Room, LocalParticipant, RemoteParticipant, RemoteTrackPublication, Track, LocalVideoTrack, RemoteVideoTrack, createLocalTracks } from 'twilio-video';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import '../../../styles/home.css';


interface VideoResponse {
    gameSessionId: number;
    gameToken: string;
    twilioVideoChatToken: string;
    twilioRoomSid: string;
    playerOrder: string[]; // Array of player IDs in speaking order
    currentSpeakingPlayer: string; // ID of the currently speaking player
}

export default function GameSessionPage() {
    const params = useParams();
    const router = useRouter();
    const gameToken = Array.isArray(params?.gameToken)
        ? params.gameToken[0]
        : params?.gameToken as string;
    const [room, setRoom] = useState<Room | null>(null);
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(10);
    /*const [participants, setParticipants] = useState<RemoteParticipant[]>([]);*/
    /*const [isLoading, setIsLoading] = useState(true);*/
    /*const [error, setError] = useState<string | null>(null);*/
    /*const [playerOrder, setPlayerOrder] = useState<string[]>([]);*/
    const [currentSpeakingPlayer, setCurrentSpeakingPlayer] = useState<string>('');
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRef = useRef<HTMLDivElement>(null);
    const centerVideoRef = useRef<HTMLDivElement>(null);
    const apiService = useApi();
    const { value: token } = useLocalStorage<string>("token", "");
    /*const [messages, setMessages] = useState<string[]>([]);*/
    const videoBoxStyle = {
        backgroundColor: '#000',
        minHeight: '150px',
        minWidth: '150px',
        border: '2px solid #49beb7',
        borderRadius: '8px',
        overflow: 'hidden'
    };

    const [hasVoted, setHasVoted] = useState(false);
    /*const [voteResults, setVoteResults] = useState<Record<string, number>>({});*/
    const [vote, setVote] = useState<string | null>(null);

    const handleVote = (playerId: string) => {
        if (hasVoted) return;

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
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    useEffect(() => {
        if (timeLeft <= 0) {
            /*const votedForParam = vote || 'none';*/
            router.push('/results/chameleonCaught');
        }
    }, [timeLeft, vote, router]);


    useEffect(() => {
        const connectToVideoRoom = async () => {
            try {
                /*setIsLoading(true);*/

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

                // Set local participant in the state
                setLocalParticipant(localParticipant);

                // Set mock data first
                /*setPlayerOrder([localParticipant.identity, 'player2', 'player3', 'player4', 'player5']);*/
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
                /*videoRoom.on('participantDisconnected', handleParticipantDisconnected);*/

                /*setIsLoading(false);*/
            } catch (error) {
                console.error('Error connecting to video room:', error);
                /*setError(error instanceof Error ? error.message : 'Failed to connect to video room');*/
                /*setIsLoading(false);*/
            }
        };

        const handleParticipantConnected = (participant: RemoteParticipant) => {
            /*setParticipants(prevParticipants => [...prevParticipants, participant]);*/

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

        /*const handleParticipantDisconnected = (participant: RemoteParticipant) => {
            setParticipants(prevParticipants =>
                prevParticipants.filter(p => p !== participant)
            );
        };*/

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
        const socket = new WebSocket('http://localhost:8080/game-ws');

        socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        /*socket.onmessage = (event) => {
            const newMessage = event.data;
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        };*/

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

    /*const handleReturn = () => {
        router.push(`/main`);
    };*/

    return (
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
                <span>{`00:${String(timeLeft).padStart(2, '0')}`}</span>
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
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div
                            key={i}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            <div
                                ref={remoteVideoRef}
                                className="video-element"
                                style={videoBoxStyle}
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
                                onClick={() => handleVote(`player${i + 1}`)}
                            >
                                VOTE
                            </button>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );}

