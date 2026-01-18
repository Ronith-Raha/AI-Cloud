'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Room, RoomEvent, ConnectionState, RemoteParticipant, RemoteTrack, Track, RemoteTrackPublication } from 'livekit-client';
import { ConnectionDetails, SessionStatus, AgentState } from './types';

interface UseSessionOptions {
  agentName?: string;
}

interface UseSessionReturn {
  room: Room | null;
  status: SessionStatus;
  agentState: AgentState;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<SessionStatus>('disconnected');
  const [agentState, setAgentState] = useState<AgentState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  const fetchConnectionDetails = useCallback(async (): Promise<ConnectionDetails> => {
    const response = await fetch('/api/livekit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentName: options.agentName }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to get connection details');
    }

    return response.json();
  }, [options.agentName]);

  const connect = useCallback(async () => {
    if (roomRef.current) {
      return;
    }

    setStatus('connecting');
    setAgentState('connecting');
    setError(null);

    try {
      const details = await fetchConnectionDetails();
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Set up event listeners
      newRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connected) {
          setStatus('connected');
          setAgentState('initializing');
        } else if (state === ConnectionState.Disconnected) {
          setStatus('disconnected');
          setAgentState('disconnected');
        }
      });

      // Handle remote audio tracks - attach to audio element for playback
      const handleTrackSubscribed = (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('Audio track subscribed from:', participant.identity);
          const audioElement = track.attach();
          audioElement.id = `audio-${participant.identity}`;
          document.body.appendChild(audioElement);
        }
      };

      const handleTrackUnsubscribed = (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('Audio track unsubscribed from:', participant.identity);
          track.detach().forEach((el) => el.remove());
        }
      };

      // Detect when agent is speaking by monitoring track mute state
      const handleTrackMuted = (
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        if (!participant.identity.startsWith('user-') && publication.kind === Track.Kind.Audio) {
          console.log('Agent audio muted - stopped speaking');
          setAgentState('listening');
        }
      };

      const handleTrackUnmuted = (
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        if (!participant.identity.startsWith('user-') && publication.kind === Track.Kind.Audio) {
          console.log('Agent audio unmuted - started speaking');
          setAgentState('speaking');
        }
      };

      newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      newRoom.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      newRoom.on(RoomEvent.TrackMuted, handleTrackMuted);
      newRoom.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);

      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        // Agent connected - any remote participant that's not a user is an agent
        if (!participant.identity.startsWith('user-')) {
          console.log('Agent connected:', participant.identity);
          setAgentState('listening');
        }
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        if (!participant.identity.startsWith('user-')) {
          console.log('Agent disconnected:', participant.identity);
          setAgentState('disconnected');
        }
      });

      // Listen for agent state changes via data messages
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const decoder = new TextDecoder();
          const message = JSON.parse(decoder.decode(payload));
          if (message.type === 'agent_state') {
            setAgentState(message.state as AgentState);
          }
        } catch {
          // Ignore non-JSON messages
        }
      });

      await newRoom.connect(details.serverUrl, details.participantToken);

      // Check if agent is already in the room
      const remoteParticipants = Array.from(newRoom.remoteParticipants.values());
      const agent = remoteParticipants.find(p => !p.identity.startsWith('user-'));
      if (agent) {
        console.log('Agent already in room:', agent.identity);
        setAgentState('listening');
      }

      // Enable microphone
      await newRoom.localParticipant.setMicrophoneEnabled(true);

      roomRef.current = newRoom;
      setRoom(newRoom);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      setStatus('error');
      setAgentState('disconnected');
    }
  }, [fetchConnectionDetails]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setStatus('disconnected');
      setAgentState('disconnected');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    room,
    status,
    agentState,
    error,
    connect,
    disconnect,
  };
}
