import { ZepClient } from "@getzep/zep-cloud";

type ZepMessage = {
  role: "user" | "assistant";
  content: string;
};

const globalForZep = globalThis as unknown as {
  zepClient?: ZepClient;
};

const getClient = () => {
  const apiKey = process.env.ZEP_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!globalForZep.zepClient) {
    globalForZep.zepClient = new ZepClient({ apiKey });
  }
  return globalForZep.zepClient;
};

const ensureUserThread = async (userId: string, threadId: string) => {
  const client = getClient();
  if (!client) {
    return;
  }
  try {
    await client.user.add({ userId });
  } catch (error) {
    // Ignore if already exists or non-critical.
  }
  try {
    await client.thread.create({ threadId, userId });
  } catch (error) {
    // Ignore if already exists or non-critical.
  }
};

export const zepGetContext = async (threadId: string, userId: string) => {
  const client = getClient();
  if (!client) {
    return "";
  }
  await ensureUserThread(userId, threadId);
  try {
    const response = await client.thread.getUserContext(threadId);
    return response.context ?? "";
  } catch (error) {
    throw new Error("Zep memory.get failed");
  }
};

export const zepAddMessages = async (
  threadId: string,
  userId: string,
  messages: ZepMessage[]
) => {
  const client = getClient();
  if (!client) {
    return;
  }
  await ensureUserThread(userId, threadId);
  const payload = messages.map((message) => ({
    role: message.role,
    content: message.content
  }));
  try {
    await client.thread.addMessages(threadId, { messages: payload });
  } catch (error) {
    throw new Error("Zep memory.add failed");
  }
};

