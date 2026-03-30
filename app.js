const APP_TITLE = "PromptOS";
const ADMIN_PASSWORD = "shift-am-owner";
const PROMPTS_URL = "./prompts.json";

const STORAGE_KEYS = {
  theme: "prompt-library-theme",
  github: "prompt-library-github-config",
  admin: "prompt-library-admin-unlocked"
};

const state = {
  prompts: [],
  filteredPrompts: [],
  selectedCategory: "All",
  selectedTag: "",
  search: "",
  selectedPromptId: null,
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "dark",
  adminUnlocked: sessionStorage.getItem(STORAGE_KEYS.admin) === "true",
  githubConfig: readGitHubConfig(),
  commandPaletteOpen: false,
  commandQuery: "",
  commandResults: [],
  commandActiveIndex: 0,
  pendingDeleteId: null,
  formMode: "create",
  keyBuffer: []
};

const els = {
  body: document.body,
  categoryList: document.getElementById("categoryList"),
  tagList: document.getElementById("tagList"),
  searchInput: document.getElementById("searchInput"),
  currentCategoryTitle: document.getElementById("currentCategoryTitle"),
  promptCount: document.getElementById("promptCount"),
  promptCollection: document.getElementById("promptCollection"),
  themeToggle: document.getElementById("themeToggle"),
  themeToggleLabel: document.getElementById("themeToggleLabel"),
  adminIndicator: document.getElementById("adminIndicator"),
  addPromptButton: document.getElementById("addPromptButton"),
  configButton: document.getElementById("configButton"),
  promptModalOverlay: document.getElementById("promptModalOverlay"),
  promptModalContent: document.getElementById("promptModalContent"),
  formModalOverlay: document.getElementById("formModalOverlay"),
  promptForm: document.getElementById("promptForm"),
  formModalTitle: document.getElementById("formModalTitle"),
  savePromptButton: document.getElementById("savePromptButton"),
  confirmModalOverlay: document.getElementById("confirmModalOverlay"),
  confirmModalText: document.getElementById("confirmModalText"),
  confirmDeleteButton: document.getElementById("confirmDeleteButton"),
  configModalOverlay: document.getElementById("configModalOverlay"),
  configForm: document.getElementById("configForm"),
  commandPaletteOverlay: document.getElementById("commandPaletteOverlay"),
  commandPaletteInput: document.getElementById("commandPaletteInput"),
  commandPaletteResults: document.getElementById("commandPaletteResults"),
  openPaletteButton: document.getElementById("openPaletteButton"),
  helpOverlay: document.getElementById("helpOverlay"),
  toastRegion: document.getElementById("toastRegion")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  document.title = APP_TITLE;
  applyTheme();
  bindEvents();

  try {
    state.prompts = await fetchLocalPrompts();
    hydratePromptDates();
    syncDerivedData();
    renderAll();
    handleDeepLink();
  } catch (error) {
    console.error(error);
    renderEmptyState("Unable to load prompts.");
    showToast("Failed to load prompts.json.", "error");
  }
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    if (!state.search) {
      state.selectedTag = "";
    }
    syncDerivedData();
    renderAll();
  });

  els.themeToggle.addEventListener("click", toggleTheme);
  els.openPaletteButton.addEventListener("click", openCommandPalette);
  els.addPromptButton.addEventListener("click", () => openPromptForm());
  els.configButton.addEventListener("click", openConfigModal);
  els.promptForm.addEventListener("submit", onPromptFormSubmit);
  els.confirmDeleteButton.addEventListener("click", onConfirmDelete);
  els.configForm.addEventListener("submit", onConfigFormSubmit);

  els.commandPaletteInput.addEventListener("input", (event) => {
    state.commandQuery = event.target.value;
    updateCommandResults();
    renderCommandPalette();
  });
  els.commandPaletteInput.addEventListener("keydown", handleCommandPaletteKeys);

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
    const matchesCategory = state.selectedCategory === "All" || prompt.category === state.selectedCategory;
    const matchesTag = !state.selectedTag || (prompt.tags || []).includes(state.selectedTag);
    const matchesSearch = matchesPrompt(prompt, state.search);
    return matchesCategory && matchesTag && matchesSearch;
  });

  updateCommandResults();
  if (state.commandActiveIndex >= state.commandResults.length) {
    state.commandActiveIndex = 0;
  }
}

function renderAll() {
  renderCategories();
  renderTags();
  renderPromptCount();
  renderPromptCollection();
  renderAdminUI();
  updateThemeUI();
}

function renderCategories() {
  const categories = ["All", ...new Set(state.prompts.map((prompt) => prompt.category).filter(Boolean))];
  els.categoryList.innerHTML = categories.map((category) => {
    const active = category === state.selectedCategory ? "is-active" : "";
    const count = category === "All"
      ? state.prompts.length
      : state.prompts.filter((prompt) => prompt.category === category).length;

    return `
      <button class="category-button ${active}" type="button" data-category="${escapeAttribute(category)}">
        <span class="category-copy">
          <span class="category-icon">${category === "All" ? iconLayers() : iconFolder()}</span>
          <span>${escapeHtml(category)}</span>
        </span>
        <span class="count-pill">${count}</span>
      </button>
    `;
  }).join("");

  els.categoryList.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.category;
      syncDerivedData();
      renderAll();
    });
  });

  els.currentCategoryTitle.textContent = state.selectedCategory;
}

function renderTags() {
  const tags = [...new Set(state.prompts.flatMap((prompt) => prompt.tags || []))].slice(0, 15);
  els.tagList.innerHTML = tags.map((tag) => {
    const active = tag === state.selectedTag ? "is-active" : "";
    return `<button class="tag-button ${active}" type="button" data-tag="${escapeAttribute(tag)}">#${escapeHtml(tag)}</button>`;
  }).join("");

  els.tagList.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;
      state.selectedTag = state.selectedTag === tag ? "" : tag;
      state.search = state.selectedTag || "";
      els.searchInput.value = state.search;
      syncDerivedData();
      renderAll();
    });
  });
}

function renderPromptCount() {
  const label = state.filteredPrompts.length === 1 ? "prompt" : "prompts";
  els.promptCount.textContent = `${state.filteredPrompts.length} ${label} available`;
}

function renderPromptCollection() {
  if (state.filteredPrompts.length === 0) {
    renderEmptyState("We could not find any prompts matching your criteria. Try adjusting your search.");
    return;
  }

  els.promptCollection.innerHTML = state.filteredPrompts.map((prompt, index) => `
    <article class="prompt-card" data-prompt-id="${escapeAttribute(prompt.id)}" style="animation-delay:${index * 0.04}s">
      <div class="card-inner">
        <div class="card-toolbar">
          <span class="shortcut-badge">${iconTerminal()} ${escapeHtml(prompt.shortcut)}</span>
          <div class="card-actions">
            ${state.adminUnlocked ? `
              <button class="icon-button" type="button" data-action="edit" data-prompt-id="${escapeAttribute(prompt.id)}" aria-label="Edit prompt">${iconEdit()}</button>
              <button class="icon-button danger" type="button" data-action="delete" data-prompt-id="${escapeAttribute(prompt.id)}" aria-label="Delete prompt">${iconTrash()}</button>
            ` : ""}
          </div>
        </div>

        <div class="card-copy">
          <h3>${escapeHtml(prompt.title)}</h3>
          <p class="prompt-description">${escapeHtml(prompt.description)}</p>
        </div>

        <div class="tag-stack">
          ${(prompt.tags || []).slice(0, 3).map((tag) => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join("")}
        </div>

        <div class="card-footer">
          <div class="tag-stack">
            <span class="meta-pill">${escapeHtml(prompt.category)}</span>
            <span class="meta-pill">${formatDate(prompt.dateAdded, "Added")}</span>
          </div>
          <button class="copy-button" type="button" data-action="copy" data-prompt-id="${escapeAttribute(prompt.id)}">${iconCopy()} <span>Copy</span></button>
        </div>
      </div>
    </article>
  `).join("");

  bindCardActions();
  els.promptCollection.querySelectorAll(".prompt-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-action]")) {
        return;
      }
      openPromptModal(card.dataset.promptId);
    });
  });
}

function bindCardActions() {
  els.promptCollection.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const promptId = button.dataset.promptId;
      const action = button.dataset.action;

      if (action === "copy") {
        const prompt = state.prompts.find((entry) => entry.id === promptId);
        if (prompt) {
          await copyPromptText(prompt.body, button);
        }
      }
      if (action === "edit") {
        openPromptForm(promptId);
      }
      if (action === "delete") {
        openDeleteConfirm(promptId);
      }
    });
  });
}

function openPromptModal(promptId) {
  const prompt = state.prompts.find((entry) => entry.id === promptId);
  if (!prompt) {
    return;
  }

  state.selectedPromptId = prompt.id;
  els.promptModalContent.innerHTML = `
    <div class="prompt-view-header">
      <div class="tag-stack">
        <span class="shortcut-badge">${iconFolder()} ${escapeHtml(prompt.category)}</span>
      </div>
      <div class="prompt-view-title">
        <h2 id="promptModalTitle">${escapeHtml(prompt.title)}</h2>
        <p class="modal-copy">${escapeHtml(prompt.description)}</p>
      </div>
      <div class="tag-stack">
        <span class="meta-pill">${formatDate(prompt.dateAdded, "Added")}</span>
        ${prompt.lastUpdated ? `<span class="meta-pill">${formatDate(prompt.lastUpdated, "Updated")}</span>` : ""}
      </div>
    </div>

    <div class="prompt-code-block">
      <button class="copy-button" id="modalCopyButton" type="button">${iconCopy()} <span>Copy Prompt</span></button>
      <pre>${escapeHtml(prompt.body)}</pre>
    </div>

    <div class="prompt-view-footer">
      <div class="tag-stack">
        ${(prompt.tags || []).map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="topbar-actions">
        ${state.adminUnlocked ? `<button class="ghost-button" id="modalEditButton" type="button">Edit</button><button class="danger-button" id="modalDeleteButton" type="button">Delete</button>` : ""}
      </div>
    </div>
  `;

  document.getElementById("modalCopyButton").addEventListener("click", async (event) => {
    await copyPromptText(prompt.body, event.currentTarget);
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
  els.formModalTitle.textContent = prompt ? "Edit Prompt" : "Create Prompt";
  els.savePromptButton.textContent = prompt ? "Save Prompt" : "Create Prompt";
  els.promptForm.reset();
  els.promptForm.elements.id.readOnly = Boolean(prompt);
  els.promptForm.elements.dateAdded.value = todayDate();
  els.promptForm.elements.lastUpdated.value = "";

  if (prompt) {
    els.promptForm.elements.id.value = prompt.id;
    els.promptForm.elements.title.value = prompt.title;
    els.promptForm.elements.description.value = prompt.description;
    els.promptForm.elements.body.value = prompt.body;
    els.promptForm.elements.category.value = prompt.category;
    els.promptForm.elements.shortcut.value = prompt.shortcut;
    els.promptForm.elements.tags.value = (prompt.tags || []).join(", ");
    els.promptForm.elements.dateAdded.value = prompt.dateAdded || todayDate();
    els.promptForm.elements.lastUpdated.value = prompt.lastUpdated || todayDate();
  }

  openOverlay(els.formModalOverlay);
}

function openDeleteConfirm(promptId) {
  const prompt = state.prompts.find((entry) => entry.id === promptId);
  if (!prompt) {
    return;
  }

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
    : [prompt, ...state.prompts];

  const saved = await persistPrompts(nextPrompts, state.formMode === "edit" ? "Updated prompt in GitHub." : "Added prompt to GitHub.");
  if (saved) {
    closeOverlay("formModalOverlay");
  }
}

async function onConfirmDelete() {
  if (!state.pendingDeleteId) {
    return;
  }
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
    await writePromptsToGitHub(nextPrompts);
    state.prompts = nextPrompts;
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
  } catch (_error) {
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
}

function applyTheme() {
  els.body.dataset.theme = state.theme;
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  applyTheme();
  updateThemeUI();
}

function updateThemeUI() {
  els.themeToggleLabel.textContent = state.theme === "dark" ? "Light" : "Dark";
}

function renderAdminUI() {
  els.adminIndicator.classList.toggle("visible", state.adminUnlocked);
  els.addPromptButton.classList.toggle("hidden", !state.adminUnlocked);
  els.configButton.classList.toggle("hidden", !state.adminUnlocked);
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
  const results = state.commandResults.slice(0, 5);
  if (results.length === 0) {
    els.commandPaletteResults.innerHTML = '<p class="empty-copy command-group-label">No matching prompts found.</p>';
    return;
  }

  els.commandPaletteResults.innerHTML = `
    <div class="command-group-label">Prompts</div>
    ${results.map((prompt, index) => `
      <button class="command-item ${index === state.commandActiveIndex ? "is-active" : ""}" type="button" data-command-id="${escapeAttribute(prompt.id)}">
        <div class="command-copy">
          <strong>${escapeHtml(prompt.title)}</strong>
          <span>${escapeHtml(prompt.description)}</span>
        </div>
        <div class="command-right">
          <span class="shortcut-badge">${escapeHtml(prompt.shortcut)}</span>
          <span class="chevron">${iconChevron()}</span>
        </div>
      </button>
    `).join("")}
  `;

  els.commandPaletteResults.querySelectorAll("[data-command-id]").forEach((button) => {
    button.addEventListener("click", () => {
      closeOverlay("commandPaletteOverlay");
      openPromptModal(button.dataset.commandId);
    });
  });
}

function handleCommandPaletteKeys(event) {
  if (!state.commandPaletteOpen) {
    return;
  }
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
    return pool.slice(0, 5);
  }

  return pool
    .map((prompt) => ({ prompt, score: scorePrompt(prompt, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.prompt.title.localeCompare(b.prompt.title))
    .map((entry) => entry.prompt);
}

function scorePrompt(prompt, query) {
  const haystacks = [
    prompt.title || "",
    prompt.description || "",
    prompt.category || "",
    prompt.shortcut || "",
    ...(prompt.tags || [])
  ];

  let score = 0;
  for (const item of haystacks) {
    const value = item.toLowerCase();
    if (value.includes(query)) {
      score += value === query ? 120 : 70;
      if (value.startsWith(query)) {
        score += 25;
      }
    } else if (isSubsequence(query, value)) {
      score += 24;
    }
  }
  return score;
}

function matchesPrompt(prompt, search) {
  if (!search) {
    return true;
  }
  return scorePrompt(prompt, search.toLowerCase()) > 0;
}

function isSubsequence(query, text) {
  let index = 0;
  for (const char of text) {
    if (char === query[index]) {
      index += 1;
    }
    if (index === query.length) {
      return true;
    }
  }
  return false;
}

function onGlobalKeyDown(event) {
  const activeTag = document.activeElement?.tagName;
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag);
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

  if (!isTyping && lowerKey === "d") {
    toggleTheme();
  }

  if (!isTyping && lowerKey === "?") {
    event.preventDefault();
    openOverlay(els.helpOverlay);
  }

  state.keyBuffer.push({ key: lowerKey, shift: event.shiftKey, ts: Date.now() });
  state.keyBuffer = state.keyBuffer.filter((entry) => Date.now() - entry.ts < 800);
  const keys = new Set(state.keyBuffer.map((entry) => entry.key));
  const hasShift = state.keyBuffer.some((entry) => entry.shift);

  if (hasShift && keys.has("a") && keys.has("m")) {
    tryAdminUnlock();
    state.keyBuffer = [];
  }
}

function tryAdminUnlock() {
  if (state.adminUnlocked) {
    return;
  }
  const attempt = window.prompt("Admin password");
  if (!attempt) {
    return;
  }
  if (attempt !== ADMIN_PASSWORD) {
    showToast("Incorrect admin password.", "error");
    return;
  }

  state.adminUnlocked = true;
  sessionStorage.setItem(STORAGE_KEYS.admin, "true");
  renderAdminUI();
  showToast("Admin mode unlocked for this tab.", "success");

  if (!state.githubConfig) {
    openConfigModal();
  }
}

function closeTopOverlay() {
  const openOverlays = [
    "helpOverlay",
    "configModalOverlay",
    "confirmModalOverlay",
    "formModalOverlay",
    "promptModalOverlay",
    "commandPaletteOverlay"
  ].filter((id) => !document.getElementById(id).classList.contains("hidden"));

  const top = openOverlays[openOverlays.length - 1];
  if (top) {
    closeOverlay(top);
  }
}

function openOverlay(overlay) {
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  if (overlay.id === "commandPaletteOverlay") {
    state.commandPaletteOpen = true;
  }
}

function closeOverlay(id) {
  const overlay = typeof id === "string" ? document.getElementById(id) : id;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");

  if (overlay.id === "promptModalOverlay") {
    clearDeepLink();
  }
  if (overlay.id === "commandPaletteOverlay") {
    state.commandPaletteOpen = false;
    state.commandQuery = "";
  }
  if (overlay.id === "confirmModalOverlay") {
    state.pendingDeleteId = null;
  }
}

function renderEmptyState(message) {
  els.promptCollection.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">${iconSearch()}</div>
      <h3>Nothing found</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

async function copyPromptText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }

  if (button) {
    const label = button.querySelector("span:last-child");
    const original = label ? label.textContent : "";
    button.classList.add("is-copied");
    if (label) {
      label.textContent = "Copied";
    }
    window.setTimeout(() => {
      button.classList.remove("is-copied");
      if (label) {
        label.textContent = original || "Copy";
      }
    }, 1800);
  }

  showToast("Prompt copied to clipboard.", "success");
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

function showToast(message, variant = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${variant}`;
  toast.textContent = message;
  els.toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString, label) {
  if (!dateString) {
    return "";
  }
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return `${label}: ${dateString}`;
  }
  return `${label}: ${date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`;
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

function iconSearch() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"></circle><path d="M20 20l-4.2-4.2"></path></svg>';
}

function iconTerminal() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6l5 5-5 5"></path><path d="M11 16h9"></path></svg>';
}

function iconEdit() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4.5-1 9-9-3.5-3.5-9 9L4 20z"></path><path d="M13 5l3.5 3.5"></path></svg>';
}

function iconTrash() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14"></path><path d="M9 7V4h6v3"></path><path d="M8 7l1 12h6l1-12"></path></svg>';
}

function iconCopy() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2"></rect><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"></path></svg>';
}

function iconFolder() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"></path></svg>';
}

function iconLayers() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5 9-5z"></path><path d="M3 12l9 5 9-5"></path></svg>';
}

function iconChevron() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>';
}
