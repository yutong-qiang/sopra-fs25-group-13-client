"use client";

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { connect, Room, RemoteParticipant, RemoteTrackPublication, Track, LocalVideoTrack, RemoteVideoTrack, createLocalTracks } from 'twilio-video';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import '../../../styles/home.css';
import useGameSocket from "@/hooks/useGameSocket";



interface VideoResponse {
  gameSessionId: number;
  gameToken: string;
  twilioVideoChatToken: string;
  twilioRoomSid: string;
}

export default function GameSessionPage() {
  const router = useRouter();
  /*const gameToken = Array.isArray(params?.gameToken) 
  ? params.gameToken[0] 
  : params?.gameToken as string; */
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

  const { gameToken } = useParams();
  const { value: authToken } = useLocalStorage<string>("token", "");

  const {
    sendAction,
    subscribeToGame,
    subscribeToUser,
    disconnect
  } = useGameSocket({
    gameSessionToken: gameToken as string,
    authToken,
  });

  /*
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
*/

  useEffect(() => {
    const connectToVideoRoom = async () => {
      try {
        setIsLoading(true);

        const localTracks = await createLocalTracks({
          video: { width: 640, height: 480 },
          audio: true
        });

        console.log('Local tracks created:', localTracks);

        // Wait for a small delay to ensure the DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Find and attach the video track
        const videoTrack = localTracks.find(track => track.kind === 'video');
        console.log('Video track:', videoTrack);
        console.log('Video container ref:', localVideoRef.current);

        if (!videoTrack) {
          console.error('No video track found in local tracks');
          throw new Error('No video track found');
        }

        if (!localVideoRef.current) {
          console.error('Video container not ready');
          throw new Error('Video container not ready');
        }

        try {
          const videoElement = (videoTrack as LocalVideoTrack).attach();
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';
          
          localVideoRef.current.innerHTML = '';
          localVideoRef.current.appendChild(videoElement);
          console.log('Video element attached successfully');
        } catch (err) {
          console.error('Error attaching video:', err);
          throw err;
        }

        const response = await apiService.post<VideoResponse>(`/game/join/${gameToken}`, null, {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });

        console.log('Backend response:', response);

        if (!response.twilioVideoChatToken) {
          throw new Error('No video token received');
        }

        const videoRoom = await connect(response.twilioVideoChatToken, {
          name: response.twilioRoomSid,
          tracks: localTracks
        });

        console.log('Connected to video room:', videoRoom);

        setRoom(videoRoom);

        const localParticipant = videoRoom.localParticipant;
        console.log('Local participant:', localParticipant);
        
        // Handle video track publication
        localParticipant.videoTracks.forEach(publication => {
          try {
            console.log('Found video track publication:', publication);
            if (publication.track && localVideoRef.current) {
              const videoTrack = publication.track as LocalVideoTrack;
              const videoElement = videoTrack.attach();
              console.log('Created video element:', videoElement);
              
              // Style the video element
              videoElement.style.width = '100%';
              videoElement.style.height = '100%';
              videoElement.style.objectFit = 'cover';
              
              // Clear and append
              localVideoRef.current.innerHTML = '';
              localVideoRef.current.appendChild(videoElement);
              console.log('Video element attached to DOM');
            }
          } catch (err) {
            console.error('Error handling video track:', err);
          }
        });

        // Listen for new local tracks
        localParticipant.on('trackPublished', publication => {
          if (publication.kind === 'video' && localVideoRef.current && publication.track) {
            const videoTrack = publication.track as LocalVideoTrack;
            const videoElement = videoTrack.attach();
            localVideoRef.current.innerHTML = '';
            localVideoRef.current.appendChild(videoElement);
          }
        });
        
        videoRoom.participants.forEach(participant => {
          handleParticipantConnected(participant);
        });

        videoRoom.on('participantConnected', handleParticipantConnected);
        videoRoom.on('participantDisconnected', handleParticipantDisconnected);
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };
          
    //     // Get the Twilio video token from the backend
    //     const response = await apiService.post<VideoResponse>(`/game/join/${gameToken}`, {
    //       headers: {
    //         'Authorization': token,
    //         'Content-Type': 'application/json'
    //       }
    //     });

    //     if (!response.twilioVideoChatToken) {
    //       throw new Error('No video token received');
    //     }

    //     // Connect to the Twilio video room
    //     const videoRoom = await connect(response.twilioVideoChatToken, {
    //       name: `room-${gameToken}`,
    //       video: true,
    //       audio: true
    //     });

    //     setRoom(videoRoom);

    //     // Handle local participant
    //     const localParticipant = videoRoom.localParticipant;
    //     localParticipant.tracks.forEach((publication: LocalTrackPublication) => {
    //       if (publication.track) {
    //         const localTrack = publication.track;
    //         if (localTrack.kind === 'video' && localVideoRef.current) {
    //           const videoElement = (localTrack as LocalVideoTrack).attach();
    //           localVideoRef.current.appendChild(videoElement);
    //         }
    //       }
    //     });

    //     // Handle remote participants
    //     videoRoom.participants.forEach(participant => {
    //       handleParticipantConnected(participant);
    //     });

    //     // Set up event listeners
    //     videoRoom.on('participantConnected', handleParticipantConnected);
    //     videoRoom.on('participantDisconnected', handleParticipantDisconnected);

    //   } catch (error) {
    //     console.error('Error connecting to video room:', error);
    //   }
    // };

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      setParticipants(prevParticipants => [...prevParticipants, participant]);

      participant.tracks.forEach((publication: RemoteTrackPublication) => {
        if (publication.track) {
          const remoteTrack = publication.track;
          if (remoteTrack.kind === 'video' && remoteVideoRef.current) {
            const videoElement = (remoteTrack as RemoteVideoTrack).attach();
            remoteVideoRef.current.appendChild(videoElement);
          }
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
  }, [gameToken, token, apiService, room]);

  /*
  useEffect(() => {
    // Initialize WebSocket connection with auth token in the URL
    if (!token) {
      console.log('No token available, skipping WebSocket connection');
      return;
    }

    console.log('Attempting to create WebSocket connection...');
    // Create WebSocket connection
    const ws = new WebSocket(`ws://localhost:3000/game/player-action?auth-token=${token}`);
    
    // Connection opened
    ws.onopen = () => {
      console.log('WebSocket connection established successfully');
      console.log('WebSocket readyState:', ws.readyState);
      setSocket(ws);
      setIsConnected(true);
    };

    // Listen for messages
    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed message data:', data);
        if (data.error) {
          console.error('Server error received:', data.error);
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    // Handle errors
    ws.onerror = (error) => {
      console.error('WebSocket error occurred:', error);
      console.log('WebSocket readyState at error:', ws.readyState);
      setSocket(null);
      setIsConnected(false);
    };

    // Handle connection close
    ws.onclose = (event) => {
      console.log('WebSocket connection closed:');
      console.log('Close code:', event.code);
      console.log('Close reason:', event.reason);
      console.log('WebSocket readyState at close:', ws.readyState);
      setSocket(null);
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws) {
        console.log('Cleaning up WebSocket connection');
        console.log('Final WebSocket readyState:', ws.readyState);
        ws.close();
        setIsConnected(false);
      }
    };
  }, [token]);
*/

useEffect(() => {
  if (!authToken || !gameToken) return;

  const unsubGame = subscribeToGame((msg) => {
    console.log("Game Event:", msg);
    // update game state here
  });

  const unsubUser = subscribeToUser((msg) => {
    console.log("User Message:", msg);
    // handle errors or private events here
  });

  return () => {
    unsubGame();
    unsubUser();
    disconnect();
  };
}, [authToken, gameToken, subscribeToGame, subscribeToUser, disconnect]);

const handleStartGame = () => {
  sendAction("START_GAME");
};

const handleReturn = () => {
  router.push('/main');
};




/*
  const handleStartGame = () => {
    console.log('handleStartGame called');
    console.log('isConnected:', isConnected);
    console.log('socket state:', socket?.readyState);
    
    if (!isConnected || !socket) {
      console.error('WebSocket not connected');
      console.log('Connection details:');
      console.log('- isConnected:', isConnected);
      console.log('- socket exists:', !!socket);
      console.log('- socket readyState:', socket?.readyState);
      return;
    }

    const startGameAction = {
      type: 'START_GAME',
      gameSessionToken: gameToken
    };

    try {
      console.log('Attempting to send game action:', startGameAction);
      socket.send(JSON.stringify(startGameAction));
      console.log('Game action sent successfully');
    } catch (error) {
      console.error('Error sending game action:', error);
      console.log('Socket state when error occurred:', socket.readyState);
      setIsConnected(false);
    }
  };
*/

  return (
    <>
    {isLoading && (
      <div style={{ color: 'white', marginBottom: '10px' }}>
        Loading video room...
      </div>
    )}

    {error && (
      <div style={{ color: 'red', marginBottom: '10px' }}>
        {error}
      </div>
    )}
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
    </>
  );
}
