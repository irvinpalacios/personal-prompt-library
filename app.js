const APP_TITLE = "My Prompt Library";
const ADMIN_PASSWORD = "shift-am-owner";
const PROMPTS_URL = "./prompts.json";

const STORAGE_KEYS = {
  theme: "prompt-library-theme",
  palette: "prompt-library-palette",
  view: "prompt-library-view",
  github: "prompt-library-github-config",
  admin: "prompt-library-admin-unlocked"
};

const PALETTES = [
  { id: "sunset", label: "Sunset", colors: ["#fb7ca8", "#7cc7ff"] },
  { id: "lagoon", label: "Lagoon", colors: ["#49c6c0", "#75a9ff"] },
  { id: "citrus", label: "Citrus", colors: ["#f59f52", "#9bd16d"] }
];

const state = {
  prompts: [],
  filteredPrompts: [],
  search: "",
  selectedCategory: "",
  selectedTags: new Set(),
  selectedPromptId: null,
  view: localStorage.getItem(STORAGE_KEYS.view) || "grid",
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
  palette: localStorage.getItem(STORAGE_KEYS.palette) || PALETTES[0].id,
  adminUnlocked: sessionStorage.getItem(STORAGE_KEYS.admin) === "true",
  githubConfig: readGitHubConfig(),
  commandPaletteOpen: false,
  commandQuery: "",
  commandResults: [],
  commandActiveIndex: 0,
  formMode: "create",
  pendingDeleteId: null,
  keySequence: []
};

const els = {
  body: document.body,
  siteHeader: document.getElementById("siteHeader"),
  adminIndicator: document.getElementById("adminIndicator"),
  promptCollection: document.getElementById("promptCollection"),
  promptCount: document.getElementById("promptCount"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  tagFilters: document.getElementById("tagFilters"),
  themeToggle: document.getElementById("themeToggle"),
  themeToggleLabel: document.getElementById("themeToggleLabel"),
  viewToggle: document.getElementById("viewToggle"),
  viewToggleLabel: document.getElementById("viewToggleLabel"),
  openPaletteButton: document.getElementById("openPaletteButton"),
  paletteSwitcher: document.getElementById("paletteSwitcher"),
  addPromptButton: document.getElementById("addPromptButton"),
  promptModalOverlay: document.getElementById("promptModalOverlay"),
  promptModalContent: document.getElementById("promptModalContent"),
  formModalOverlay: document.getElementById("formModalOverlay"),
  promptForm: document.getElementById("promptForm"),
  formModalTitle: document.getElementById("formModalTitle"),
  savePromptButton: document.getElementById("savePromptButton"),
  confirmModalOverlay: document.getElementById("confirmModalOverlay"),
  confirmModalText: document.getElementById("confirmModalText"),
  confirmDeleteButton: document.getElementById("confirmDeleteButton"),
  commandPaletteOverlay: document.getElementById("commandPaletteOverlay"),
  commandPaletteInput: document.getElementById("commandPaletteInput"),
  commandPaletteResults: document.getElementById("commandPaletteResults"),
  helpOverlay: document.getElementById("helpOverlay"),
  configModalOverlay: document.getElementById("configModalOverlay"),
  configForm: document.getElementById("configForm"),
  toastRegion: document.getElementById("toastRegion")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  document.title = APP_TITLE;
  applyPreferences();
  renderPaletteSwitcher();
  bindEvents();

  try {
    state.prompts = await fetchLocalPrompts();
    hydratePromptDates();
    syncDerivedData();
    renderAll();
    handleDeepLink();
  } catch (error) {
    console.error(error);
    showToast("Failed to load prompts.json. Check that the file is present and valid JSON.", "error");
    renderEmptyState("Unable to load prompts.");
  }
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    syncDerivedData();
    renderAll();
  });

  els.categoryFilter.addEventListener("change", (event) => {
    state.selectedCategory = event.target.value;
    syncDerivedData();
    renderAll();
  });

  els.themeToggle.addEventListener("click", toggleTheme);
  els.viewToggle.addEventListener("click", () => setView(state.view === "grid" ? "list" : "grid"));
  els.openPaletteButton.addEventListener("click", openCommandPalette);
  els.addPromptButton.addEventListener("click", () => openPromptForm());
  els.promptForm.addEventListener("submit", onPromptFormSubmit);
  els.confirmDeleteButton.addEventListener("click", onConfirmDelete);
  els.commandPaletteInput.addEventListener("input", (event) => {
    state.commandQuery = event.target.value;
    updateCommandResults();
    renderCommandPalette();
  });
  els.commandPaletteInput.addEventListener("keydown", handleCommandPaletteKeys);
  els.configForm.addEventListener("submit", onConfigFormSubmit);

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => closeOverlay(button.dataset.close));
  });

  document.querySelectorAll(".overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeOverlay(overlay.id);
      }
    });
  });

  document.addEventListener("keydown", onGlobalKeyDown);
  document.addEventListener("keyup", onGlobalKeyUp);
}

async function fetchLocalPrompts() {
  const response = await fetch(PROMPTS_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Prompts request failed with ${response.status}`);
  }
  const prompts = await response.json();
  if (!Array.isArray(prompts)) {
    throw new Error("prompts.json must contain an array");
  }
  return prompts;
}

function hydratePromptDates() {
  state.prompts = state.prompts.map((prompt) => ({
    ...prompt,
    lastUpdated: prompt.lastUpdated || ""
  }));
}

function syncDerivedData() {
  state.filteredPrompts = state.prompts.filter((prompt) => {
    const matchesSearch = matchesPrompt(prompt, state.search);
    const matchesCategory = !state.selectedCategory || prompt.category === state.selectedCategory;
    const matchesTags = [...state.selectedTags].every((tag) => (prompt.tags || []).includes(tag));
    return matchesSearch && matchesCategory && matchesTags;
  });

  state.commandResults = getRankedResults(state.commandQuery);
  if (state.commandActiveIndex >= state.commandResults.length) {
    state.commandActiveIndex = 0;
  }
}

function renderAll() {
  renderCategoryOptions();
  renderTagFilters();
  renderPromptCount();
  renderPromptCollection();
  renderAdminUI();
  updateViewUI();
  updateThemeUI();
  updateCommandResults();
}

function renderCategoryOptions() {
  const categories = [...new Set(state.prompts.map((prompt) => prompt.category).filter(Boolean))].sort();
  const options = ['<option value="">All categories</option>']
    .concat(categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
    .join("");
  els.categoryFilter.innerHTML = options;
  els.categoryFilter.value = state.selectedCategory;
}

function renderTagFilters() {
  const tags = [...new Set(state.prompts.flatMap((prompt) => prompt.tags || []))].sort();
  if (tags.length === 0) {
    els.tagFilters.innerHTML = '<span class="status-line">No tags available</span>';
    return;
  }

  els.tagFilters.innerHTML = tags.map((tag) => {
    const active = state.selectedTags.has(tag) ? "is-active" : "";
    return `<button class="chip ${active}" type="button" data-tag="${escapeAttribute(tag)}">${escapeHtml(tag)}</button>`;
  }).join("");

  els.tagFilters.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;
      if (state.selectedTags.has(tag)) {
        state.selectedTags.delete(tag);
      } else {
        state.selectedTags.add(tag);
      }
      syncDerivedData();
      renderAll();
    });
  });
}

function renderPromptCount() {
  els.promptCount.textContent = `Showing ${state.filteredPrompts.length} of ${state.prompts.length} prompts`;
}

function renderPromptCollection() {
  els.promptCollection.className = `library-grid ${state.view}-view`;
  if (state.filteredPrompts.length === 0) {
    renderEmptyState("No prompts match the current filters.");
    return;
  }

  els.promptCollection.innerHTML = state.view === "grid"
    ? state.filteredPrompts.map(renderPromptCard).join("")
    : state.filteredPrompts.map(renderPromptRow).join("");

  bindPromptActions();
}

function renderPromptCard(prompt) {
  return `
    <article class="prompt-card" data-prompt-id="${escapeAttribute(prompt.id)}">
      <div class="prompt-card-header">
        <div class="meta-stack">
          <div class="prompt-meta">
            <span>${escapeHtml(prompt.category)}</span>
            <span>${formatDate(prompt.dateAdded, "Added")}</span>
            ${prompt.lastUpdated ? `<span>${formatDate(prompt.lastUpdated, "Updated")}</span>` : ""}
          </div>
          <h3>${escapeHtml(prompt.title)}</h3>
          <p class="prompt-description">${escapeHtml(prompt.description)}</p>
        </div>
      </div>
      <div class="chip-group">
        ${(prompt.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="prompt-actions">
        <span class="shortcut-chip">⌨ ${escapeHtml(prompt.shortcut)}</span>
        <button class="toolbar-button" type="button" data-action="view" data-prompt-id="${escapeAttribute(prompt.id)}">View</button>
        ${renderAdminActionButtons(prompt.id)}
      </div>
    </article>
  `;
}

function renderPromptRow(prompt) {
  return `
    <article class="prompt-row" data-prompt-id="${escapeAttribute(prompt.id)}">
      <div class="meta-stack">
        <div class="prompt-meta">
          <span>${escapeHtml(prompt.category)}</span>
          <span>${formatDate(prompt.dateAdded, "Added")}</span>
          ${prompt.lastUpdated ? `<span>${formatDate(prompt.lastUpdated, "Updated")}</span>` : ""}
        </div>
        <h3>${escapeHtml(prompt.title)}</h3>
      </div>
      <div class="chip-group">
        ${(prompt.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="row-actions">
        <span class="shortcut-chip">⌨ ${escapeHtml(prompt.shortcut)}</span>
        <button class="toolbar-button" type="button" data-action="view" data-prompt-id="${escapeAttribute(prompt.id)}">View</button>
        ${renderAdminActionButtons(prompt.id)}
      </div>
    </article>
  `;
}

function renderAdminActionButtons(promptId) {
  if (!state.adminUnlocked) {
    return "";
  }
  return `
    <button class="toolbar-button" type="button" data-action="edit" data-prompt-id="${escapeAttribute(promptId)}">Edit</button>
    <button class="toolbar-button danger" type="button" data-action="delete" data-prompt-id="${escapeAttribute(promptId)}">Delete</button>
  `;
}

function bindPromptActions() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const promptId = button.dataset.promptId;
      const action = button.dataset.action;
      if (action === "view") openPromptModal(promptId);
      if (action === "edit") openPromptForm(promptId);
      if (action === "delete") openDeleteConfirm(promptId);
    });
  });
}

function openPromptModal(promptId) {
  const prompt = state.prompts.find((entry) => entry.id === promptId);
  if (!prompt) return;

  state.selectedPromptId = prompt.id;
  els.promptModalContent.innerHTML = `
    <div class="meta-stack">
      <div class="prompt-meta">
        <span>${escapeHtml(prompt.category)}</span>
        <span>${formatDate(prompt.dateAdded, "Added")}</span>
        ${prompt.lastUpdated ? `<span>${formatDate(prompt.lastUpdated, "Updated")}</span>` : ""}
      </div>
      <h2 id="promptModalTitle">${escapeHtml(prompt.title)}</h2>
      <p class="prompt-description">${escapeHtml(prompt.description)}</p>
      <div class="chip-group">
        ${(prompt.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="prompt-actions">
        <span class="shortcut-chip">⌨ ${escapeHtml(prompt.shortcut)}</span>
        <button class="toolbar-button primary" type="button" id="copyPromptButton">Copy Prompt</button>
        ${state.adminUnlocked ? '<button class="toolbar-button" type="button" id="modalEditButton">Edit</button><button class="toolbar-button danger" type="button" id="modalDeleteButton">Delete</button>' : ""}
      </div>
      <p class="prompt-body">${escapeHtml(prompt.body)}</p>
    </div>
  `;

  document.getElementById("copyPromptButton").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(prompt.body);
      showToast("Prompt copied to clipboard.", "success");
    } catch (error) {
      console.error(error);
      showToast("Clipboard copy failed in this browser.", "error");
    }
  });

  if (state.adminUnlocked) {
    document.getElementById("modalEditButton").addEventListener("click", () => openPromptForm(prompt.id));
    document.getElementById("modalDeleteButton").addEventListener("click", () => openDeleteConfirm(prompt.id));
  }

  updateDeepLink(prompt.id);
  openOverlay(els.promptModalOverlay);
}

function openPromptForm(promptId = null) {
  const prompt = promptId ? state.prompts.find((entry) => entry.id === promptId) : null;
  state.formMode = prompt ? "edit" : "create";
  els.formModalTitle.textContent = prompt ? "Edit Prompt" : "Add Prompt";
  els.savePromptButton.textContent = prompt ? "Save Changes" : "Save Prompt";
  els.promptForm.reset();
  els.promptForm.elements.id.readOnly = Boolean(prompt);
  els.promptForm.elements.dateAdded.value = todayDate();
  els.promptForm.elements.lastUpdated.value = "";

  if (prompt) {
    els.promptForm.elements.id.value = prompt.id;
    els.promptForm.elements.title.value = prompt.title;
    els.promptForm.elements.description.value = prompt.description;
    els.promptForm.elements.body.value = prompt.body;
    els.promptForm.elements.tags.value = (prompt.tags || []).join(", ");
    els.promptForm.elements.category.value = prompt.category;
    els.promptForm.elements.shortcut.value = prompt.shortcut;
    els.promptForm.elements.dateAdded.value = prompt.dateAdded || todayDate();
    els.promptForm.elements.lastUpdated.value = prompt.lastUpdated || todayDate();
  }

  openOverlay(els.formModalOverlay);
}

function openDeleteConfirm(promptId) {
  const prompt = state.prompts.find((entry) => entry.id === promptId);
  if (!prompt) return;

  state.pendingDeleteId = promptId;
  els.confirmModalText.textContent = `Delete "${prompt.title}" from the library? This writes a new prompts.json version to GitHub.`;
  openOverlay(els.confirmModalOverlay);
}

async function onPromptFormSubmit(event) {
  event.preventDefault();
  if (!state.adminUnlocked) {
    showToast("Unlock admin mode before editing prompts.", "error");
    return;
  }
  if (!ensureGitHubConfig()) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  const prompt = normalizePrompt(Object.fromEntries(formData.entries()));
  if (state.formMode === "create" && state.prompts.some((entry) => entry.id === prompt.id)) {
    showToast("Prompt IDs must be unique.", "error");
    return;
  }

  const nextPrompts = state.formMode === "edit"
    ? state.prompts.map((entry) => entry.id === prompt.id ? { ...prompt, lastUpdated: prompt.lastUpdated || todayDate() } : entry)
    : [...state.prompts, prompt];

  const saved = await persistPrompts(nextPrompts, state.formMode === "edit" ? "Updated prompt in GitHub." : "Added prompt to GitHub.");
  if (saved) {
    closeOverlay("formModalOverlay");
  }
}

async function onConfirmDelete() {
  if (!state.pendingDeleteId) return;
  const nextPrompts = state.prompts.filter((entry) => entry.id !== state.pendingDeleteId);
  const saved = await persistPrompts(nextPrompts, "Deleted prompt from GitHub.");
  if (saved) {
    state.pendingDeleteId = null;
    closeOverlay("confirmModalOverlay");
    closeOverlay("promptModalOverlay");
  }
}

async function persistPrompts(nextPrompts, successMessage) {
  try {
    const saved = await writePromptsToGitHub(nextPrompts);
    state.prompts = saved;
    hydratePromptDates();
    syncDerivedData();
    renderAll();
    showToast(successMessage, "success");
    return true;
  } catch (error) {
    console.error(error);
    showToast(error.message || "GitHub save failed.", "error");
    return false;
  }
}

function normalizePrompt(values) {
  return {
    id: String(values.id || "").trim(),
    title: String(values.title || "").trim(),
    description: String(values.description || "").trim(),
    body: String(values.body || "").trim(),
    tags: String(values.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    category: String(values.category || "").trim(),
    shortcut: String(values.shortcut || "").trim(),
    dateAdded: String(values.dateAdded || todayDate()).trim(),
    lastUpdated: String(values.lastUpdated || "").trim()
  };
}

function readGitHubConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.github) || "null");
  } catch (error) {
    return null;
  }
}

function ensureGitHubConfig() {
  if (state.githubConfig?.token && state.githubConfig?.owner && state.githubConfig?.repo && state.githubConfig?.branch && state.githubConfig?.path) {
    return true;
  }
  openConfigModal();
  showToast("Save GitHub admin settings before writing prompts.", "error");
  return false;
}

function openConfigModal() {
  const config = state.githubConfig || {};
  els.configForm.elements.token.value = config.token || "";
  els.configForm.elements.owner.value = config.owner || "";
  els.configForm.elements.repo.value = config.repo || "";
  els.configForm.elements.branch.value = config.branch || "main";
  els.configForm.elements.path.value = config.path || "prompts.json";
  openOverlay(els.configModalOverlay);
}

function onConfigFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.githubConfig = {
    token: String(formData.get("token") || "").trim(),
    owner: String(formData.get("owner") || "").trim(),
    repo: String(formData.get("repo") || "").trim(),
    branch: String(formData.get("branch") || "").trim(),
    path: String(formData.get("path") || "").trim()
  };
  localStorage.setItem(STORAGE_KEYS.github, JSON.stringify(state.githubConfig));
  closeOverlay("configModalOverlay");
  showToast("GitHub admin config stored locally.", "success");
}

async function writePromptsToGitHub(nextPrompts) {
  const config = state.githubConfig;
  if (!config) {
    throw new Error("GitHub config is missing.");
  }

  const endpoint = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${config.path}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${config.token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };

  const currentResponse = await fetch(`${endpoint}?ref=${encodeURIComponent(config.branch)}`, { headers });
  const currentPayload = await currentResponse.json();
  if (!currentResponse.ok) {
    throw new Error(currentPayload.message || "Unable to read current prompts.json from GitHub.");
  }

  const content = JSON.stringify(nextPrompts, null, 2);
  const putResponse = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Update prompt library on ${new Date().toISOString()}`,
      content: encodeBase64(content),
      sha: currentPayload.sha,
      branch: config.branch
    })
  });

  const putPayload = await putResponse.json();
  if (!putResponse.ok) {
    throw new Error(putPayload.message || "Unable to write prompts.json to GitHub.");
  }

  return nextPrompts;
}

function renderAdminUI() {
  els.siteHeader.classList.toggle("admin-active", state.adminUnlocked);
  els.adminIndicator.classList.toggle("visible", state.adminUnlocked);
  els.addPromptButton.classList.toggle("hidden", !state.adminUnlocked);
}

function applyPreferences() {
  els.body.dataset.theme = state.theme;
  els.body.dataset.palette = state.palette;
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  applyPreferences();
  updateThemeUI();
}

function updateThemeUI() {
  els.themeToggleLabel.textContent = state.theme === "light" ? "Dark" : "Light";
}

function setView(view) {
  state.view = view;
  localStorage.setItem(STORAGE_KEYS.view, view);
  updateViewUI();
  renderPromptCollection();
}

function updateViewUI() {
  els.viewToggleLabel.textContent = state.view === "grid" ? "List" : "Grid";
}

function renderPaletteSwitcher() {
  els.paletteSwitcher.innerHTML = PALETTES.map((palette) => `
    <button
      class="palette-button ${palette.id === state.palette ? "is-active" : ""}"
      type="button"
      aria-label="Switch to ${escapeAttribute(palette.label)} palette"
      data-palette="${escapeAttribute(palette.id)}"
      style="background: linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1]});"
    ></button>
  `).join("");

  els.paletteSwitcher.querySelectorAll("[data-palette]").forEach((button) => {
    button.addEventListener("click", () => {
      state.palette = button.dataset.palette;
      localStorage.setItem(STORAGE_KEYS.palette, state.palette);
      applyPreferences();
      renderPaletteSwitcher();
    });
  });
}

function openCommandPalette() {
  state.commandPaletteOpen = true;
  state.commandQuery = "";
  state.commandActiveIndex = 0;
  updateCommandResults();
  renderCommandPalette();
  openOverlay(els.commandPaletteOverlay);
  requestAnimationFrame(() => els.commandPaletteInput.focus());
}

function updateCommandResults() {
  state.commandResults = getRankedResults(state.commandQuery);
}

function renderCommandPalette() {
  const results = state.commandResults.slice(0, 12);
  if (results.length === 0) {
    els.commandPaletteResults.innerHTML = '<div class="empty-state"><p>No prompts matched that query.</p></div>';
    return;
  }

  els.commandPaletteResults.innerHTML = results.map((prompt, index) => `
    <button class="command-item ${index === state.commandActiveIndex ? "is-active" : ""}" type="button" data-command-id="${escapeAttribute(prompt.id)}">
      <h3>${escapeHtml(prompt.title)}</h3>
      <p>${escapeHtml(prompt.description)}</p>
      <div class="command-item-meta">
        <span class="shortcut-chip">⌨ ${escapeHtml(prompt.shortcut)}</span>
        <span>${escapeHtml(prompt.category)}</span>
      </div>
    </button>
  `).join("");

  els.commandPaletteResults.querySelectorAll("[data-command-id]").forEach((button) => {
    button.addEventListener("click", () => {
      closeOverlay("commandPaletteOverlay");
      openPromptModal(button.dataset.commandId);
    });
  });
}

function handleCommandPaletteKeys(event) {
  if (!state.commandPaletteOpen) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.commandActiveIndex = Math.min(state.commandActiveIndex + 1, Math.max(state.commandResults.length - 1, 0));
    renderCommandPalette();
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    state.commandActiveIndex = Math.max(state.commandActiveIndex - 1, 0);
    renderCommandPalette();
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const selected = state.commandResults[state.commandActiveIndex];
    if (selected) {
      closeOverlay("commandPaletteOverlay");
      openPromptModal(selected.id);
    }
  }
}

function getRankedResults(query) {
  const trimmed = query.trim().toLowerCase();
  const pool = state.prompts.slice();
  if (!trimmed) {
    return pool.sort((a, b) => a.title.localeCompare(b.title));
  }

  return pool
    .map((prompt) => ({ prompt, score: scorePrompt(prompt, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.prompt.title.localeCompare(b.prompt.title))
    .map((entry) => entry.prompt);
}

function scorePrompt(prompt, query) {
  const haystacks = [prompt.title || "", prompt.description || "", prompt.category || "", prompt.shortcut || "", ...(prompt.tags || [])];
  let score = 0;
  for (const item of haystacks) {
    const value = item.toLowerCase();
    if (value.includes(query)) {
      score += value === query ? 120 : 70;
      if (value.startsWith(query)) score += 25;
    } else if (isSubsequence(query, value)) {
      score += 24;
    }
  }
  return score;
}

function matchesPrompt(prompt, search) {
  if (!search) return true;
  return scorePrompt(prompt, search.toLowerCase()) > 0;
}

function isSubsequence(query, text) {
  let index = 0;
  for (const char of text) {
    if (char === query[index]) index += 1;
    if (index === query.length) return true;
  }
  return false;
}

function onGlobalKeyDown(event) {
  const targetTag = document.activeElement?.tagName;
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(targetTag);
  const lowerKey = event.key.toLowerCase();

  if ((event.metaKey || event.ctrlKey) && lowerKey === "k") {
    event.preventDefault();
    openCommandPalette();
    return;
  }

  if (event.key === "Escape") {
    closeTopOverlay();
    return;
  }

  if (!isTyping) {
    if (lowerKey === "?") {
      event.preventDefault();
      openOverlay(els.helpOverlay);
    }
    if (lowerKey === "d") {
      toggleTheme();
    }
    handleViewSequence(lowerKey);
  }

  state.keySequence.push({ key: lowerKey, ts: Date.now() });
  state.keySequence = state.keySequence.filter((entry) => Date.now() - entry.ts < 800);

  const keys = new Set([...state.keySequence.map((entry) => entry.key), event.shiftKey ? "shift" : null].filter(Boolean));
  if (keys.has("shift") && keys.has("a") && keys.has("m")) {
    tryAdminUnlock();
    state.keySequence = [];
  }
}

function onGlobalKeyUp() {
  state.keySequence = state.keySequence.filter((entry) => Date.now() - entry.ts < 800);
}

function handleViewSequence(key) {
  state.keySequence = state.keySequence.filter((entry) => Date.now() - entry.ts < 700);
  const previous = state.keySequence[state.keySequence.length - 1];
  if (previous?.key === "g" && key === "l") setView("list");
  if (previous?.key === "g" && key === "c") setView("grid");
}

function tryAdminUnlock() {
  if (state.adminUnlocked) return;
  const attempt = window.prompt("Admin password");
  if (!attempt) return;
  if (attempt !== ADMIN_PASSWORD) {
    showToast("Incorrect admin password.", "error");
    return;
  }

  state.adminUnlocked = true;
  sessionStorage.setItem(STORAGE_KEYS.admin, "true");
  renderAdminUI();
  showToast("Admin mode unlocked for this tab.", "success");
  if (!state.githubConfig) openConfigModal();
}

function closeTopOverlay() {
  const openOverlays = ["helpOverlay", "configModalOverlay", "confirmModalOverlay", "formModalOverlay", "promptModalOverlay", "commandPaletteOverlay"]
    .filter((id) => !document.getElementById(id).classList.contains("hidden"));
  const topOverlayId = openOverlays[openOverlays.length - 1];
  if (topOverlayId) closeOverlay(topOverlayId);
}

function openOverlay(overlay) {
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  if (overlay.id === "commandPaletteOverlay") state.commandPaletteOpen = true;
}

function closeOverlay(id) {
  const overlay = typeof id === "string" ? document.getElementById(id) : id;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  if (overlay.id === "commandPaletteOverlay") {
    state.commandPaletteOpen = false;
    state.commandQuery = "";
  }
  if (overlay.id === "promptModalOverlay") clearDeepLink();
  if (overlay.id === "confirmModalOverlay") state.pendingDeleteId = null;
}

function renderEmptyState(message) {
  els.promptCollection.className = `library-grid ${state.view}-view`;
  els.promptCollection.innerHTML = `
    <div class="empty-state">
      <h3>Prompt shelf is quiet</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function showToast(message, variant = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${variant}`;
  toast.textContent = message;
  els.toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function handleDeepLink() {
  const promptId = new URL(window.location.href).searchParams.get("prompt");
  if (promptId && state.prompts.some((prompt) => prompt.id === promptId)) {
    openPromptModal(promptId);
  }
}

function updateDeepLink(promptId) {
  const url = new URL(window.location.href);
  url.searchParams.set("prompt", promptId);
  history.replaceState({}, "", url);
}

function clearDeepLink() {
  const url = new URL(window.location.href);
  url.searchParams.delete("prompt");
  history.replaceState({}, "", url);
}

function formatDate(dateString, label) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return `${label}: ${dateString}`;
  return `${label}: ${date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function encodeBase64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
