import {
  DEFAULT_THEME,
  STORAGE_KEYS,
  STORAGE_VERSION,
  clonePublishedPrompts,
  publishedPrompts,
} from "./data.js";

const publishedPromptsById = new Map(publishedPrompts.map((prompt) => [prompt.id, prompt]));

function normalizePrompt(prompt) {
  const publishedPrompt = publishedPromptsById.get(prompt?.id);

  return {
    ...prompt,
    shortcut: String(prompt?.shortcut ?? publishedPrompt?.shortcut ?? "").trim(),
    tags: Array.isArray(prompt?.tags) ? prompt.tags.map((tag) => String(tag)) : [],
  };
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function loadPrompts() {
  const raw = safeParse(localStorage.getItem(STORAGE_KEYS.prompts), null);

  if (
    !raw ||
    raw.version !== STORAGE_VERSION ||
    !Array.isArray(raw.items) ||
    !Array.isArray(raw.deletedIds)
  ) {
    return clonePublishedPrompts();
  }

  return mergePrompts(raw.items.map(normalizePrompt), raw.deletedIds.map((id) => String(id)));
}

export function savePrompts(prompts) {
  const payload = {
    version: STORAGE_VERSION,
    ...buildDraftPayload(prompts),
  };

  localStorage.setItem(STORAGE_KEYS.prompts, JSON.stringify(payload));
}

export function loadTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme) || DEFAULT_THEME;
}

export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

export function loadAdminSession() {
  return localStorage.getItem(STORAGE_KEYS.adminSession) === "true";
}

export function saveAdminSession(isActive) {
  localStorage.setItem(STORAGE_KEYS.adminSession, String(isActive));
}

function mergePrompts(draftPrompts, deletedIds) {
  const mergedPrompts = clonePublishedPrompts().filter((prompt) => !deletedIds.includes(prompt.id));
  const mergedById = new Map(mergedPrompts.map((prompt) => [prompt.id, prompt]));

  draftPrompts.forEach((prompt) => {
    mergedById.set(prompt.id, { ...prompt, tags: [...prompt.tags] });
  });

  return Array.from(mergedById.values());
}

function buildDraftPayload(prompts) {
  const nextPrompts = prompts.map(normalizePrompt);
  const nextPromptsById = new Map(nextPrompts.map((prompt) => [prompt.id, prompt]));
  const deletedIds = publishedPrompts
    .filter((prompt) => !nextPromptsById.has(prompt.id))
    .map((prompt) => prompt.id);
  const items = nextPrompts.filter((prompt) => {
    const publishedPrompt = publishedPromptsById.get(prompt.id);
    return !publishedPrompt || !arePromptsEqual(prompt, normalizePrompt(publishedPrompt));
  });

  return { items, deletedIds };
}

function arePromptsEqual(a, b) {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.category === b.category &&
    a.shortcut === b.shortcut &&
    a.description === b.description &&
    a.body === b.body &&
    a.createdAt === b.createdAt &&
    a.updatedAt === b.updatedAt &&
    JSON.stringify(a.tags) === JSON.stringify(b.tags)
  );
}
