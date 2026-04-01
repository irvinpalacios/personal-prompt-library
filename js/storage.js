import { DEFAULT_THEME, STORAGE_KEYS, STORAGE_VERSION, seedPrompts } from "./data.js";

const seedPromptsById = new Map(seedPrompts.map((prompt) => [prompt.id, prompt]));

function cloneSeedPrompts() {
  return seedPrompts.map((prompt) => ({ ...prompt, tags: [...prompt.tags] }));
}

function normalizePrompt(prompt) {
  const seedPrompt = seedPromptsById.get(prompt?.id);

  return {
    ...prompt,
    shortcut: String(prompt?.shortcut ?? seedPrompt?.shortcut ?? "").trim(),
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

  if (!raw || raw.version !== STORAGE_VERSION || !Array.isArray(raw.items)) {
    const seed = cloneSeedPrompts();
    savePrompts(seed);
    return seed;
  }

  return raw.items.map(normalizePrompt);
}

export function savePrompts(prompts) {
  const payload = {
    version: STORAGE_VERSION,
    items: prompts,
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
