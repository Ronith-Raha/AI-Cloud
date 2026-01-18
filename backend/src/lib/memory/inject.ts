export const DEFAULT_SYSTEM_INSTRUCTIONS =
  "You are a helpful assistant. Follow the user's instructions carefully.";

type InjectionArgs = {
  system: string;
  pinnedSummaries: string[];
  zepContext: string;
  userText: string;
  memoryContextOverride?: string;
};

const stripUserSummary = (text: string) => {
  const startTag = "<USER_SUMMARY>";
  const endTag = "</USER_SUMMARY>";
  const start = text.indexOf(startTag);
  const end = text.indexOf(endTag);
  if (start === -1 || end === -1 || end <= start) {
    return text;
  }
  return text.slice(0, start) + text.slice(end + endTag.length);
};

const extractSection = (text: string, tag: string) => {
  const startTag = `<${tag}>`;
  const endTag = `</${tag}>`;
  const start = text.indexOf(startTag);
  const end = text.indexOf(endTag);
  if (start === -1 || end === -1 || end <= start) {
    return "";
  }
  return text.slice(start + startTag.length, end).trim();
};

const normalizeKeywords = (input: string) => {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
  return Array.from(new Set(cleaned));
};

const filterLinesByKeywords = (lines: string[], keywords: string[]) => {
  if (!keywords.length) {
    return [];
  }
  return lines.filter((line) =>
    keywords.some((keyword) => line.toLowerCase().includes(keyword))
  );
};

const filterZepContext = (zepContext: string, userText: string) => {
  if (!zepContext.trim()) {
    return "";
  }
  const keywords = normalizeKeywords(userText);
  const sanitized = stripUserSummary(zepContext);

  const factsBlock = extractSection(sanitized, "FACTS");
  const episodesBlock = extractSection(sanitized, "EPISODES");

  const factsLines = factsBlock
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));
  const episodeLines = episodesBlock
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));

  const relevantFacts = filterLinesByKeywords(factsLines, keywords);
  const relevantEpisodes = filterLinesByKeywords(episodeLines, keywords);

  const sections: string[] = [];
  if (relevantFacts.length) {
    sections.push(
      "# These are the most relevant facts\n" + relevantFacts.join("\n")
    );
  }
  if (relevantEpisodes.length) {
    sections.push(
      "# These are the most relevant episodes\n" + relevantEpisodes.join("\n")
    );
  }

  return sections.join("\n\n").trim();
};

export const buildInjectedContext = ({
  system,
  pinnedSummaries,
  zepContext,
  userText,
  memoryContextOverride
}: InjectionArgs) => {
  const pinnedLines = pinnedSummaries.map((summary) => `- ${summary}`).join("\n");
  const sections = [`[System Instructions]\n\n${system}`];
  const memoryContext =
    memoryContextOverride !== undefined ? memoryContextOverride : pinnedLines;
  sections.push(`[Pinned Context]\n\n${memoryContext}`);
  sections.push(`[User Message]\n\n${userText}`);

  return sections.join("\n\n");
};

