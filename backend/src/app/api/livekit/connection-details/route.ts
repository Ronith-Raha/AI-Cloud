import { NextResponse } from "next/server";
import { AccessToken, type AccessTokenOptions, type VideoGrant } from "livekit-server-sdk";
import { RoomConfiguration } from "@livekit/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const AGENT_NAME = process.env.LIVEKIT_AGENT_NAME;

export async function POST(req: Request) {
  try {
    if (!LIVEKIT_URL) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (!API_KEY) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (!API_SECRET) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    const body = await req.json().catch(() => ({}));
    const projectId = typeof body?.projectId === "string" ? body.projectId : null;
    const agentName =
      typeof body?.agentName === "string" && body.agentName.trim().length > 0
        ? body.agentName.trim()
        : AGENT_NAME;
    const roomName = projectId
      ? `project_${projectId.replace(/[^a-zA-Z0-9_-]/g, "")}`
      : `voice_room_${Math.floor(Math.random() * 10_000)}`;
    const participantIdentity = `voice_user_${Math.floor(Math.random() * 10_000)}`;
    const participantName = "user";

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName
    );

    return NextResponse.json({
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken,
      participantName
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LiveKit token error";
    return new NextResponse(message, { status: 500 });
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m"
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true
  };
  at.addGrant(grant);

  if (agentName) {
    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName }]
    });
  }

  return at.toJwt();
}

