const ADMIN_PASSWORD = "shift-am-owner";
const PROMPTS_URL = "./prompts.json";

const STORAGE_KEYS = {
  theme: "prompt-library-theme",
  palette: "prompt-library-palette",
  github: "prompt-library-github-config",
  admin: "prompt-library-admin-unlocked"
};

const PALETTES = [
  { id: "indigo", label: "Indigo" },
  { id: "ember", label: "Ember" },
  { id: "teal", label: "Teal" }
];

const DEFAULT_PROMPTS = [
  {
    id: "meeting-notes-001",
    title: "Zoom Meeting Notes",
    description: "Generates structured meeting notes from a Zoom transcript for internal team use.",
    body: "You are a project manager's assistant. Summarize the transcript into clear meeting notes...",
    tags: ["meetings", "project-management"],
    category: "Work",
    shortcut: "/meetingnotes",
    dateAdded: "2026-03-30",
    lastUpdated: "2026-03-30"
  }
];

const state = {
  prompts: [],
  search: "",
  selectedCategory: "All",
  selectedTag: "",
  selectedPromptId: null,
  adminUnlocked: sessionStorage.getItem(STORAGE_KEYS.admin) === "true",
  githubConfig: readGitHubConfig(),
  keySequence: [],
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
  palette: localStorage.getItem(STORAGE_KEYS.palette) || "teal",
  commandResults: []
};

const els = {
  doc: document.documentElement,
  promptGrid: document.getElementById("promptGrid"),
  categoryList: document.getElementById("categoryList"),
  tagList: document.getElementById("tagList"),
  paletteSwitcher: document.getElementById("paletteSwitcher"),
  searchInput: document.getElementById("searchInput"),
  cmdKBtn: document.getElementById("cmdKBtn"),
  cmdKInput: document.getElementById("cmdKInput"),
  cmdKResults: document.getElementById("cmdKResults"),
  viewTitle: document.getElementById("viewTitle"),
  viewCount: document.getElementById("viewCount"),
  emptyState: document.getElementById("emptyState"),
  adminBadge: document.getElementById("adminBadge"),
  newPromptBtn: document.getElementById("newPromptBtn"),
  configBtn: document.getElementById("configBtn"),
  viewModal: document.getElementById("viewModalOverlay"),
  formModal: document.getElementById("formModalOverlay"),
  cmdKModal: document.getElementById("cmdKModalOverlay"),
  configModal: document.getElementById("configModalOverlay"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  viewModalCategory: document.getElementById("viewModalCategory"),
  viewModalTitle: document.getElementById("viewModalTitle"),
  viewModalDesc: document.getElementById("viewModalDesc"),
  viewModalBody: document.getElementById("viewModalBody"),
  viewModalTags: document.getElementById("viewModalTags"),
  viewEditBtn: document.getElementById("viewEditBtn"),
  viewDeleteBtn: document.getElementById("viewDeleteBtn"),
  formModalHeader: document.getElementById("formModalHeader"),
  promptForm: document.getElementById("promptForm"),
  formId: document.getElementById("formId"),
  formTitle: document.getElementById("formTitle"),
  formDesc: document.getElementById("formDesc"),
  formCategory: document.getElementById("formCategory"),
  formShortcut: document.getElementById("formShortcut"),
  formTags: document.getElementById("formTags"),
  formBody: document.getElementById("formBody"),
  formDateAdded: document.getElementById("formDateAdded"),
  formLastUpdated: document.getElementById("formLastUpdated"),
  configForm: document.getElementById("configForm"),
  configToken: document.getElementById("configToken"),
  configOwner: document.getElementById("configOwner"),
  configRepo: document.getElementById("configRepo"),
  configBranch: document.getElementById("configBranch"),
  configPath: document.getElementById("configPath"),
  toastRegion: document.getElementById("toastRegion")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  applyTheme();
  applyPalette();
  renderPaletteSwitcher();

  try {
    const response = await fetch(PROMPTS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed");
    }
    state.prompts = normalizePromptList(await response.json());
  } catch (_error) {
    state.prompts = DEFAULT_PROMPTS;
    showToast("Using sample data. Could not fetch prompts.json.", "warning");
  }

  bindEvents();
  renderAll();
  handleDeepLink();
}

function normalizePromptList(prompts) {
  if (!Array.isArray(prompts)) {
    return DEFAULT_PROMPTS;
  }
  return prompts.map((prompt) => ({
    ...prompt,
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    lastUpdated: prompt.lastUpdated || ""
  }));
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    if (!state.search) {
      state.selectedTag = "";
    }
    renderAll();
  });

  els.cmdKInput.addEventListener("input", (event) => {
    renderCommandResults(event.target.value.trim().toLowerCase());
  });

  els.cmdKBtn.addEventListener("click", openCmdK);
  els.newPromptBtn.addEventListener("click", () => openFormModal());
  els.configBtn.addEventListener("click", openConfigModal);
  els.themeToggleBtn.addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    localStorage.setItem(STORAGE_KEYS.theme, state.theme);
    applyTheme();
  });

  els.promptForm.addEventListener("submit", onPromptSubmit);
  els.configForm.addEventListener("submit", onConfigSubmit);
  els.viewEditBtn.addEventListener("click", () => {
    const prompt = state.prompts.find((item) => item.id === state.selectedPromptId);
    if (prompt) {
      openFormModal(prompt);
    }
  });
  els.viewDeleteBtn.addEventListener("click", () => {
    if (state.selectedPromptId) {
      deletePrompt(state.selectedPromptId);
    }
  });

  document.querySelectorAll(".close-modal-btn").forEach((button) => {
    button.addEventListener("click", () => closeAllModals());
  });

  [els.viewModal, els.formModal, els.cmdKModal, els.configModal].forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeAllModals();
      }
    });
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const targetId = event.currentTarget.dataset.copyTarget;
      const target = document.getElementById(targetId);
      if (target) {
        handleCopy(target.textContent, event.currentTarget);
      }
    });
  });

  document.addEventListener("keydown", onKeyDown);
}

function renderAll() {
  const filtered = getFilteredPrompts();

  els.viewTitle.textContent = state.selectedCategory;
  els.viewCount.textContent = `${filtered.length} prompt${filtered.length === 1 ? "" : "s"} available`;
  renderCategories();
  renderTags();
  renderPromptGrid(filtered);
  renderAdminState();
}

function getFilteredPrompts() {
  return state.prompts.filter((prompt) => {
    const searchLower = state.search.toLowerCase();
    const matchesSearch =
      (prompt.title || "").toLowerCase().includes(searchLower) ||
      (prompt.description || "").toLowerCase().includes(searchLower) ||
      (prompt.shortcut || "").toLowerCase().includes(searchLower) ||
      (prompt.category || "").toLowerCase().includes(searchLower) ||
      (prompt.tags || []).some((tag) => tag.toLowerCase().includes(searchLower));
    const matchesCategory = state.selectedCategory === "All" || prompt.category === state.selectedCategory;
    const matchesTag = !state.selectedTag || (prompt.tags || []).includes(state.selectedTag);
    return matchesSearch && matchesCategory && matchesTag;
  });
}

function renderPromptGrid(filtered) {
  els.promptGrid.innerHTML = "";
  els.promptGrid.dataset.count = String(filtered.length);
  if (filtered.length === 0) {
    els.emptyState.classList.remove("hidden-force");
    return;
  }

  els.emptyState.classList.add("hidden-force");
  filtered.forEach((prompt, index) => {
    els.promptGrid.appendChild(createPromptCard(prompt, index));
  });
}

function createPromptCard(prompt, index) {
  const card = document.createElement("article");
  card.className = "prompt-card";
  card.style.animationDelay = `${index * 0.05}s`;

  const adminHtml = state.adminUnlocked ? `
    <div class="admin-actions">
      <button class="action-icon edit-btn" type="button" aria-label="Edit prompt">${iconMarkup("edit")}</button>
      <button class="action-icon danger delete-btn" type="button" aria-label="Delete prompt">${iconMarkup("trash")}</button>
    </div>
  ` : "";

  card.innerHTML = `
    <div class="prompt-card-inner">
      <div class="prompt-toolbar">
        <span class="shortcut-pill">${iconMarkup("terminal", "small")} ${escapeHtml(prompt.shortcut || "")}</span>
        ${adminHtml}
      </div>

      <div>
        <h3>${escapeHtml(prompt.title)}</h3>
        <p class="prompt-description">${escapeHtml(prompt.description || "")}</p>
      </div>

      <div class="prompt-footer">
        <div class="tag-stack">
          ${(prompt.tags || []).slice(0, 3).map((tag, idx) => `<span class="stacked-tag" style="z-index:${3 - idx}">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="prompt-actions">
          <button class="card-open-btn" type="button">Open Prompt</button>
          <button class="copy-btn copy-btn-small circle-button" type="button" data-text="${escapeAttribute(prompt.body)}" aria-label="Copy prompt">${iconMarkup("copy")}</button>
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", () => openViewModal(prompt));

  const openBtn = card.querySelector(".card-open-btn");
  openBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openViewModal(prompt);
  });

  const copyBtn = card.querySelector(".copy-btn");
  copyBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    handleCopy(prompt.body, copyBtn);
  });

  if (state.adminUnlocked) {
    card.querySelector(".edit-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      openFormModal(prompt);
    });
    card.querySelector(".delete-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      deletePrompt(prompt.id);
    });
  }

  return card;
}

function renderCategories() {
  const categories = ["All", ...new Set(state.prompts.map((prompt) => prompt.category).filter(Boolean))];
  els.categoryList.innerHTML = categories.map((category) => {
    const active = state.selectedCategory === category ? "active" : "";
    const count = category === "All" ? state.prompts.length : state.prompts.filter((prompt) => prompt.category === category).length;
    return `
      <button class="category-item ${active}" type="button" data-category="${escapeAttribute(category)}">
        <span class="left">${iconMarkup(category === "All" ? "layers" : "folder", "small")}<span>${escapeHtml(category)}</span></span>
        ${category === "All" ? `<span class="category-count">${count}</span>` : ""}
      </button>
    `;
  }).join("");

  els.categoryList.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.category;
      renderAll();
    });
  });
}

function renderTags() {
  const allTags = [...new Set(state.prompts.flatMap((prompt) => prompt.tags || []))].slice(0, 15);
  els.tagList.innerHTML = allTags.map((tag) => {
    const active = state.selectedTag === tag ? "active" : "";
    return `<button class="tag-chip ${active}" type="button" data-tag="${escapeAttribute(tag)}">#${escapeHtml(tag)}</button>`;
  }).join("");

  els.tagList.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;
      state.selectedTag = state.selectedTag === tag ? "" : tag;
      renderAll();
    });
  });
}

function renderPaletteSwitcher() {
  els.paletteSwitcher.innerHTML = PALETTES.map((palette) => `
    <button class="palette-dot ${state.palette === palette.id ? "active" : ""}" type="button" data-palette="${palette.id}" aria-label="${palette.label} palette"></button>
  `).join("");

  els.paletteSwitcher.querySelectorAll("[data-palette]").forEach((button) => {
    button.addEventListener("click", () => {
      state.palette = button.dataset.palette;
      localStorage.setItem(STORAGE_KEYS.palette, state.palette);
      applyPalette();
      renderPaletteSwitcher();
    });
  });
}

function renderAdminState() {
  const method = state.adminUnlocked ? "remove" : "add";
  els.adminBadge.classList[method]("hidden-force");
  els.newPromptBtn.classList[method]("hidden-force");
  els.configBtn.classList[method]("hidden-force");
  els.viewEditBtn.classList[method]("hidden-force");
  els.viewDeleteBtn.classList[method]("hidden-force");
}

function openViewModal(prompt) {
  state.selectedPromptId = prompt.id;
  els.viewModalCategory.textContent = prompt.category || "General";
  els.viewModalTitle.textContent = prompt.title;
  els.viewModalDesc.textContent = prompt.description || "";
  els.viewModalBody.textContent = prompt.body || "";
  els.viewModalTags.innerHTML = (prompt.tags || []).map((tag) => `<span class="tag-chip-static">#${escapeHtml(tag)}</span>`).join("");
  renderAdminState();
  updateDeepLink(prompt.id);
  openModal(els.viewModal);
}

function openFormModal(prompt = null) {
  const isEdit = Boolean(prompt);
  els.formModalHeader.innerHTML = `${iconMarkup("sparkles", "small")} <span>${isEdit ? "Edit" : "Create"} Prompt</span>`;
  els.formId.value = isEdit ? prompt.id : `prompt-${Date.now()}`;
  els.formTitle.value = isEdit ? prompt.title : "";
  els.formDesc.value = isEdit ? prompt.description : "";
  els.formCategory.value = isEdit ? prompt.category : "General";
  els.formShortcut.value = isEdit ? prompt.shortcut : "/";
  els.formTags.value = isEdit ? (prompt.tags || []).join(", ") : "";
  els.formBody.value = isEdit ? prompt.body : "";
  els.formDateAdded.value = isEdit ? prompt.dateAdded || todayDate() : todayDate();
  els.formLastUpdated.value = isEdit ? prompt.lastUpdated || todayDate() : "";
  openModal(els.formModal);
}

function openCmdK() {
  openModal(els.cmdKModal);
  els.cmdKInput.value = "";
  renderCommandResults("");
  window.setTimeout(() => els.cmdKInput.focus(), 50);
}

function openConfigModal() {
  const conf = state.githubConfig || {};
  els.configToken.value = conf.token || "";
  els.configOwner.value = conf.owner || "";
  els.configRepo.value = conf.repo || "";
  els.configBranch.value = conf.branch || "main";
  els.configPath.value = conf.path || "prompts.json";
  openModal(els.configModal);
}

function renderCommandResults(query) {
  const normalized = query.toLowerCase();
  let results = state.prompts;
  if (normalized) {
    results = state.prompts.filter((prompt) =>
      (prompt.title || "").toLowerCase().includes(normalized) ||
      (prompt.shortcut || "").toLowerCase().includes(normalized) ||
      (prompt.category || "").toLowerCase().includes(normalized) ||
      (prompt.tags || []).some((tag) => tag.toLowerCase().includes(normalized))
    );
  }
  state.commandResults = results.slice(0, 6);
  if (state.commandResults.length === 0) {
    els.cmdKResults.innerHTML = `
      <div class="palette-group-label">Prompts</div>
      <div class="palette-empty-state">
        <img class="palette-empty-art" src="./assets/command-orb.svg" alt="" width="72" height="72">
        <p>No matching prompts.</p>
        <span>Try a different title, tag, or shortcut.</span>
      </div>
    `;
    return;
  }

  els.cmdKResults.innerHTML = `
    <div class="palette-group-label">Prompts</div>
    ${state.commandResults.map((prompt) => `
      <button class="palette-result" type="button" data-id="${escapeAttribute(prompt.id)}">
        <span class="left">
          <span class="terminal-box">${iconMarkup("terminal", "small")}</span>
          <span class="meta">
            <span class="title">${escapeHtml(prompt.title)}</span>
            <span class="description">${escapeHtml(prompt.description || "")}</span>
          </span>
        </span>
        <span class="shortcut">${escapeHtml(prompt.shortcut || "")}</span>
      </button>
    `).join("")}
  `;

  els.cmdKResults.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = state.prompts.find((entry) => entry.id === button.dataset.id);
      closeAllModals();
      if (prompt) {
        openViewModal(prompt);
      }
    });
  });
}

function applyTheme() {
  if (state.theme === "dark") {
    els.doc.classList.add("dark");
  } else {
    els.doc.classList.remove("dark");
  }
  const lightIcon = els.themeToggleBtn.querySelector(".theme-icon-light");
  const darkIcon = els.themeToggleBtn.querySelector(".theme-icon-dark");
  lightIcon.classList.toggle("hidden-force", state.theme === "dark");
  darkIcon.classList.toggle("hidden-force", state.theme !== "dark");
}

function applyPalette() {
  els.doc.dataset.palette = state.palette;
}

async function handleCopy(text, button) {
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

  const original = button.innerHTML;
  if (button.classList.contains("copy-btn-small")) {
    button.innerHTML = iconMarkup("check");
  } else {
    button.innerHTML = `${iconMarkup("check", "small")} <span>Copied!</span>`;
  }
  button.classList.add("copied-state");
  window.setTimeout(() => {
    button.innerHTML = original;
    button.classList.remove("copied-state");
  }, 1800);
}

function onKeyDown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCmdK();
  }

  if (event.key === "Escape") {
    closeAllModals();
  }

  if (event.key) {
    state.keySequence.push(event.key.toLowerCase());
    if (state.keySequence.length > 3) {
      state.keySequence.shift();
    }
    if (event.shiftKey && state.keySequence.includes("a") && state.keySequence.includes("m")) {
      toggleAdmin();
      state.keySequence = [];
    }
  }
}

function toggleAdmin() {
  if (state.adminUnlocked) {
    state.adminUnlocked = false;
    sessionStorage.setItem(STORAGE_KEYS.admin, "false");
    renderAll();
    showToast("Admin locked.", "success");
    return;
  }

  const password = window.prompt("Admin Password:");
  if (password === ADMIN_PASSWORD) {
    state.adminUnlocked = true;
    sessionStorage.setItem(STORAGE_KEYS.admin, "true");
    renderAll();
    showToast("Admin unlocked.", "success");
    if (!state.githubConfig) {
      openConfigModal();
    }
  } else if (password !== null) {
    showToast("Incorrect password.", "error");
  }
}

function openModal(overlay) {
  document.body.classList.add("modal-open");
  overlay.classList.remove("hidden-force");
}

function closeAllModals() {
  document.body.classList.remove("modal-open");
  [els.viewModal, els.formModal, els.cmdKModal, els.configModal].forEach((overlay) => {
    overlay.classList.add("hidden-force");
  });
  clearDeepLink();
}

async function onPromptSubmit(event) {
  event.preventDefault();
  if (!ensureConfig()) {
    return;
  }

  const data = new FormData(event.target);
  const prompt = {
    id: data.get("id"),
    title: data.get("title"),
    description: data.get("description"),
    category: data.get("category"),
    shortcut: data.get("shortcut"),
    body: data.get("body"),
    tags: String(data.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    dateAdded: data.get("dateAdded") || todayDate(),
    lastUpdated: data.get("lastUpdated") || todayDate()
  };

  const index = state.prompts.findIndex((item) => item.id === prompt.id);
  const nextPrompts = [...state.prompts];
  if (index >= 0) {
    nextPrompts[index] = prompt;
  } else {
    nextPrompts.unshift(prompt);
  }

  const saved = await persist(nextPrompts, "Prompt saved.");
  if (saved) {
    closeAllModals();
  }
}

function onConfigSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  state.githubConfig = {
    token: String(data.get("token") || "").trim(),
    owner: String(data.get("owner") || "").trim(),
    repo: String(data.get("repo") || "").trim(),
    branch: String(data.get("branch") || "").trim(),
    path: String(data.get("path") || "").trim()
  };
  localStorage.setItem(STORAGE_KEYS.github, JSON.stringify(state.githubConfig));
  closeAllModals();
  showToast("GitHub config saved.", "success");
}

function ensureConfig() {
  if (state.githubConfig && state.githubConfig.token) {
    return true;
  }
  openConfigModal();
  showToast("GitHub config required.", "error");
  return false;
}

async function deletePrompt(id) {
  if (!ensureConfig()) {
    return;
  }
  if (!window.confirm("Permanently delete this prompt?")) {
    return;
  }
  const nextPrompts = state.prompts.filter((prompt) => prompt.id !== id);
  const saved = await persist(nextPrompts, "Prompt deleted.");
  if (saved) {
    closeAllModals();
  }
}

async function persist(nextPrompts, message) {
  try {
    const conf = state.githubConfig;
    const endpoint = `https://api.github.com/repos/${conf.owner}/${conf.repo}/contents/${conf.path}`;
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${conf.token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    };

    const response = await fetch(`${endpoint}?ref=${conf.branch}`, { headers });
    const currentPayload = await response.json();
    if (!response.ok) {
      throw new Error(currentPayload.message || "Failed to read file.");
    }

    const contentStr = JSON.stringify(nextPrompts, null, 2);
    const writeResponse = await fetch(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Update prompts via PromptOS UI",
        content: encodeBase64(contentStr),
        sha: currentPayload.sha,
        branch: conf.branch
      })
    });

    const writePayload = await writeResponse.json();
    if (!writeResponse.ok) {
      throw new Error(writePayload.message || "Write failed.");
    }

    state.prompts = normalizePromptList(nextPrompts);
    renderAll();
    showToast(message, "success");
    return true;
  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
    return false;
  }
}

function handleDeepLink() {
  const promptId = new URL(window.location.href).searchParams.get("prompt");
  if (!promptId) {
    return;
  }
  const prompt = state.prompts.find((entry) => entry.id === promptId);
  if (prompt) {
    openViewModal(prompt);
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

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  els.toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3000);
}

function readGitHubConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.github) || "null");
  } catch (_error) {
    return null;
  }
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
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

function iconMarkup(name, sizeClass = "") {
  const size = sizeClass === "small" ? 16 : sizeClass === "large" ? 32 : 20;
  const paths = {
    zap:      `<path d="M13 2L3 14h9l-1 8 9-12h-9l1-8z"/>`,
    unlock:   `<rect width="14" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`,
    moon:     `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>`,
    sun:      `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>`,
    search:   `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`,
    plus:     `<path d="M5 12h14M12 5v14"/>`,
    copy:     `<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`,
    check:    `<path d="M20 6 9 17l-5-5"/>`,
    x:        `<path d="M18 6 6 18M6 6l12 12"/>`,
    terminal: `<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>`,
    edit:     `<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>`,
    trash:    `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
    folder:   `<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>`,
    layers:   `<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>`,
    github:   `<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>`,
    sparkles: `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>`,
    command:  `<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>`
  };
  const inner = paths[name] ?? "";
  return `<svg class="icon ${sizeClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
