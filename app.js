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
  els.viewCount.textContent = `${filtered.length} prompts available`;
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
  overlay.classList.remove("hidden-force");
}

function closeAllModals() {
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
  return `<span class="icon icon-${name} ${sizeClass}"></span>`;
}
