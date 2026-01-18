import type {
  ChatTurnCompleteEvent,
  ChatTurnErrorEvent,
  ChatTurnRequest,
  ChatTurnTokenEvent,
  CreateProjectResponse,
  GraphNodeDetailResponse,
  GraphNodeEditRequest,
  GraphNodeMutationResponse,
  GraphViewResponse,
  InjectedContextResponse,
  ProjectListResponse
} from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  DEFAULT_API_BASE_URL;

const apiKey = process.env.NEXT_PUBLIC_API_KEY;
const authToken = process.env.NEXT_PUBLIC_AUTH_TOKEN;

export function apiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${cleanPath}`;
}

function buildHeaders(isJson: boolean) {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...buildHeaders(true),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function createProject(name: string) {
  return requestJson<CreateProjectResponse>("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export async function listProjects() {
  return requestJson<ProjectListResponse>("/api/projects");
}

export async function getGraphView(
  projectId: string,
  level = 0,
  limit = 50,
  includeDeleted = false
) {
  const params = new URLSearchParams({
    projectId,
    level: String(level),
    limit: String(limit),
    includeDeleted: includeDeleted ? "1" : "0"
  });
  return requestJson<GraphViewResponse>(`/api/graph/view?${params.toString()}`);
}

export async function getGraphNode(nodeId: string) {
  return requestJson<GraphNodeDetailResponse>(`/api/graph/node/${nodeId}`);
}

export async function editGraphNode(nodeId: string, payload: GraphNodeEditRequest) {
  return requestJson<GraphNodeMutationResponse>(`/api/graph/node/${nodeId}/edit`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function deleteGraphNode(nodeId: string) {
  return requestJson<GraphNodeMutationResponse>(`/api/graph/node/${nodeId}/delete`, {
    method: "POST"
  });
}

export async function restoreGraphNode(nodeId: string) {
  return requestJson<GraphNodeMutationResponse>(`/api/graph/node/${nodeId}/restore`, {
    method: "POST"
  });
}

export async function getInjectedContext(turnId: string) {
  return requestJson<InjectedContextResponse>(`/api/chat/turn/${turnId}/injected`);
}

function parseSseMessage(raw: string) {
  const lines = raw.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return {
    event,
    data: dataLines.length > 0 ? dataLines.join("\n") : null
  };
}

export async function streamChatTurn({
  payload,
  signal,
  onToken,
  onComplete,
  onError
}: {
  payload: ChatTurnRequest;
  signal?: AbortSignal;
  onToken: (data: ChatTurnTokenEvent) => void;
  onComplete: (data: ChatTurnCompleteEvent) => void;
  onError: (data: ChatTurnErrorEvent) => void;
}) {
  const response = await fetch(apiUrl("/api/chat/turn"), {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok || !response.body) {
    const message = response.statusText || "Failed to start chat stream";
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const message = parseSseMessage(frame);
        if (!message.data) continue;
        try {
          const payload = JSON.parse(message.data) as
            | ChatTurnTokenEvent
            | ChatTurnCompleteEvent
            | ChatTurnErrorEvent;

          if (message.event === "token") {
            onToken(payload as ChatTurnTokenEvent);
          } else if (message.event === "complete") {
            onComplete(payload as ChatTurnCompleteEvent);
            return;
          } else if (message.event === "error") {
            onError(payload as ChatTurnErrorEvent);
            return;
          }
        } catch {
          // Ignore malformed SSE payloads
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

