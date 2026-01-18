export type ProviderName = "openai" | "anthropic" | "gemini";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProjectListResponse {
  projects: Project[];
}

export interface CreateProjectResponse {
  projectId: string;
}

export interface ChatTurnRequest {
  projectId: string;
  provider: ProviderName;
  model: string;
  userText: string;
}

export interface ChatTurnTokenEvent {
  text: string;
}

export interface ChatTurnCompleteEvent {
  turnId: string;
  nodeId: string;
}

export interface ChatTurnErrorEvent {
  code: string;
  message: string;
}

export interface InjectedContextResponse {
  turnId: string;
  projectId: string;
  injectedContextText: string;
}

export interface TurnTranscriptItem {
  turnId: string;
  nodeId: string | null;
  createdAt: string;
  provider: ProviderName;
  model: string;
  userText: string;
  assistantText: string;
}

export interface TurnTranscriptResponse {
  turns: TurnTranscriptItem[];
  nextCursor: string | null;
}

export interface VizNode {
  id: string;
  projectId: string;
  turnId: string;
  type: string;
  title: string | null;
  summary2sent: string;
  pinned: boolean;
  userEdited: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VizEdge {
  id: string;
  projectId: string;
  srcNodeId: string;
  dstNodeId: string;
  relType: "follows" | "similar";
  weight: number;
}

export interface GraphViewResponse {
  level: number;
  nodes: VizNode[];
  edges: VizEdge[];
}

export interface GraphNodeDetailResponse {
  node: VizNode;
  turn: {
    id: string;
    userText: string;
    assistantText: string;
    model: string;
    provider: ProviderName;
    createdAt: string;
  };
}

export interface GraphNodeEditRequest {
  title?: string;
  summary2sent?: string;
  pinned?: boolean;
}

export interface GraphNodeMutationResponse {
  status: "ok";
}

