import { AccessToken, RoomServiceClient, RoomAgentDispatch } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

// Disable caching for this route
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { agentName } = await request.json().catch(() => ({}));

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: 'LiveKit credentials not configured' },
        { status: 500 }
      );
    }

    // Generate unique room and participant names
    const roomName = `cloudi-room-${Math.random().toString(36).substring(2, 9)}`;
    const participantName = `user-${Math.random().toString(36).substring(2, 9)}`;

    // Create the room with agent dispatch using RoomServiceClient
    const httpUrl = livekitUrl.replace('wss://', 'https://');
    const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);

    // Create room with agent dispatch configuration
    // Using empty agentName to dispatch any available agent
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 60, // Close room after 60 seconds if empty
      maxParticipants: 2, // User + Agent
      agents: [
        new RoomAgentDispatch({
          agentName: agentName || '', // Empty string dispatches any available agent
        }),
      ],
    });

    // Create access token with room permissions
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: '15m',
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const participantToken = await token.toJwt();

    return NextResponse.json(
      {
        serverUrl: livekitUrl,
        roomName,
        participantToken,
        participantName,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate connection details' },
      { status: 500 }
    );
  }
}
