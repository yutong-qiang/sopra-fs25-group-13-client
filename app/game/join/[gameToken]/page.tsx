"use client";

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { connect, Room, LocalParticipant, RemoteParticipant, LocalTrackPublication, RemoteTrackPublication, Track, LocalVideoTrack, RemoteVideoTrack, createLocalTracks } from 'twilio-video';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import '../../../styles/home.css';


interface VideoResponse {
  gameSessionId: number;
  gameToken: string;
  twilioVideoChatToken: string;
  twilioRoomSid: string;
}

export default function GameSessionPage() {
  const params = useParams();
  const gameToken = Array.isArray(params?.gameToken) 
  ? params.gameToken[0] 
  : params?.gameToken as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

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
      } catch (error) {
        console.error('Error connecting to video room:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect to video room');
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
  }, [gameToken, token, apiService]);

  return (
    <div className="home-container">
      <div className="button-container">
        <h1 className="text-white text-2xl font-bold text-center mb-6">
          GAME SESSION: {gameToken}
        </h1>
        <div className="video-container">
          <div className="video-wrapper">
            <div 
              ref={localVideoRef} 
              className="video-element"
              style={{
                backgroundColor: '#000',
                minHeight: '300px',
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
                minHeight: '300px',
                border: '2px solid #49beb7',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


