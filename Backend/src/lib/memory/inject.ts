export const DEFAULT_SYSTEM_INSTRUCTIONS =
  "You are a helpful assistant. Follow the user's instructions carefully.";

type InjectionArgs = {
  system: string;
  pinnedSummaries: string[];
  zepContext: string;
  userText: string;
};

export const buildInjectedContext = ({
  system,
  pinnedSummaries,
  zepContext,
  userText
}: InjectionArgs) => {
  const pinnedLines = pinnedSummaries.map((summary) => `- ${summary}`).join("\n");

  return `[System Instructions]\n\n${system}\n\n[Pinned Context]\n\n${pinnedLines}\n\n[Zep Context]\n\n${zepContext}\n\n[User Message]\n\n${userText}`;
};

