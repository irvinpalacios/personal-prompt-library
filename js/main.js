import { createPromptRecord, validatePromptRecord, verifyAdminPassword } from "./admin.js";
import { deriveCategories, filterPrompts } from "./filters.js";
import { getPaletteCommand } from "./palette.js";
import {
  loadAdminSession,
  loadPrompts,
  loadTheme,
  saveAdminSession,
  savePrompts,
  saveTheme,
} from "./storage.js";
import {
  applyTheme,
  closeModal,
  createAppElements,
  fillPromptForm,
  focusPromptForm,
  markCopied,
  openModal,
  renderAdminList,
  renderFilters,
  renderPrompts,
  resetPromptForm,
  showToast,
  toggleEmptyState,
  updateSummary,
} from "./ui.js";

const elements = createAppElements();

const state = {
  prompts: loadPrompts(),
  query: "",
  activeCategory: "All",
  theme: loadTheme(),
  isAdmin: loadAdminSession(),
  editingPromptId: null,
};

applyTheme(state.theme, elements);
syncAdminVisibility();
render();
bindEvents();

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });

  elements.categoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) {
      return;
    }

    state.activeCategory = button.dataset.category;
    render();
  });

  elements.promptGrid.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-id]");
    if (!copyButton) {
      return;
    }

    const prompt = state.prompts.find((item) => item.id === copyButton.dataset.copyId);
    if (!prompt) {
      return;
    }

    await copyText(prompt.body);
    markCopied(copyButton);
    showToast(elements, "Prompt copied");
  });

  elements.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme(state.theme, elements);
    saveTheme(state.theme);
  });

  elements.promptForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const existingPrompt = state.prompts.find((prompt) => prompt.id === state.editingPromptId);
    const nextPrompt = createPromptRecord(readPromptForm(), existingPrompt);
    const error = validatePromptRecord(nextPrompt);

    if (error) {
      showToast(elements, error);
      return;
    }

    const duplicateId = state.prompts.find(
      (prompt) => prompt.id === nextPrompt.id && prompt.id !== state.editingPromptId,
    );

    if (duplicateId) {
      showToast(elements, "A prompt with that title already exists");
      return;
    }

    if (existingPrompt) {
      state.prompts = state.prompts.map((prompt) =>
        prompt.id === existingPrompt.id ? nextPrompt : prompt,
      );
      showToast(elements, "Prompt updated");
    } else {
      state.prompts = [nextPrompt, ...state.prompts];
      showToast(elements, "Prompt added");
    }

    state.editingPromptId = null;
    savePrompts(state.prompts);
    resetPromptForm(elements);
    render();
    focusPromptForm(elements);
  });

  elements.deletePromptButton.addEventListener("click", () => {
    if (!state.editingPromptId) {
      return;
    }

    const prompt = state.prompts.find((item) => item.id === state.editingPromptId);
    if (!prompt) {
      return;
    }

    const confirmed = window.confirm(`Delete "${prompt.title}"?`);
    if (!confirmed) {
      return;
    }

    removePrompt(prompt.id);
  });

  elements.resetFormButton.addEventListener("click", () => {
    state.editingPromptId = null;
    resetPromptForm(elements);
    focusPromptForm(elements);
  });

  elements.adminList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (editButton) {
      const prompt = state.prompts.find((item) => item.id === editButton.dataset.editId);
      if (!prompt) {
        return;
      }

      state.editingPromptId = prompt.id;
      fillPromptForm(elements, prompt);
      focusPromptForm(elements);
      return;
    }

    if (deleteButton) {
      const confirmed = window.confirm("Delete this prompt?");
      if (!confirmed) {
        return;
      }

      removePrompt(deleteButton.dataset.deleteId);
    }
  });

  elements.openPaletteButton.addEventListener("click", () => {
    if (!state.isAdmin) {
      return;
    }

    openModal(elements.commandPaletteModal, elements.paletteList.querySelector("[data-command]"));
  });

  elements.adminLogoutButton.addEventListener("click", () => {
    state.isAdmin = false;
    saveAdminSession(false);
    syncAdminVisibility();
    closeModal(elements.commandPaletteModal);
    closeModal(elements.adminLoginModal);
    showToast(elements, "Admin mode closed");
  });

  elements.adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const password = elements.adminPasswordInput.value;
    if (!verifyAdminPassword(password)) {
      elements.adminLoginError.classList.remove("hidden");
      return;
    }

    state.isAdmin = true;
    saveAdminSession(true);
    syncAdminVisibility();
    elements.adminPasswordInput.value = "";
    elements.adminLoginError.classList.add("hidden");
    closeModal(elements.adminLoginModal);
    showToast(elements, "Admin mode unlocked");
    focusPromptForm(elements);
  });

  elements.commandPaletteModal.addEventListener("click", (event) => {
    const button = event.target.closest("[data-command]");
    if (!button) {
      return;
    }

    runPaletteCommand(button.dataset.command);
  });

  document.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-close]");
    if (!closeTarget) {
      return;
    }

    const modalId = closeTarget.dataset.close;
    const modal = document.getElementById(modalId);
    if (modal) {
      closeModal(modal);
    }
  });

  document.addEventListener("keydown", (event) => {
    const modifier = event.ctrlKey || event.metaKey;

    if (modifier && event.shiftKey && event.key.toLowerCase() === "a") {
      event.preventDefault();
      if (state.isAdmin) {
        showToast(elements, "Admin mode already active");
        return;
      }

      elements.adminLoginError.classList.add("hidden");
      elements.adminPasswordInput.value = "";
      openModal(elements.adminLoginModal, elements.adminPasswordInput);
      return;
    }

    if (state.isAdmin && modifier && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openModal(elements.commandPaletteModal, elements.paletteList.querySelector("[data-command]"));
      return;
    }

    if (event.key === "Escape") {
      closeModal(elements.adminLoginModal);
      closeModal(elements.commandPaletteModal);
    }
  });
}

function render() {
  const categories = deriveCategories(state.prompts);
  const filteredPrompts = filterPrompts(state.prompts, state.query, state.activeCategory);

  renderFilters(elements, categories, state.activeCategory);
  renderPrompts(elements, filteredPrompts);
  renderAdminList(elements, [...state.prompts].sort(sortByUpdatedAt));
  updateSummary(elements, state.prompts.length, filteredPrompts.length, categories.length - 1);
  toggleEmptyState(elements, filteredPrompts.length === 0);
}

function syncAdminVisibility() {
  elements.adminShell.classList.toggle("hidden", !state.isAdmin);
  if (state.isAdmin) {
    resetPromptForm(elements);
  }
}

function readPromptForm() {
  return {
    title: elements.promptTitle.value,
    category: elements.promptCategory.value,
    description: elements.promptDescription.value,
    body: elements.promptBody.value,
    tags: elements.promptTags.value,
    favorite: elements.promptFavorite.checked,
  };
}

function removePrompt(promptId) {
  const prompt = state.prompts.find((item) => item.id === promptId);
  state.prompts = state.prompts.filter((item) => item.id !== promptId);
  savePrompts(state.prompts);

  if (state.editingPromptId === promptId) {
    state.editingPromptId = null;
    resetPromptForm(elements);
  }

  if (state.activeCategory !== "All") {
    const categoryStillExists = state.prompts.some((item) => item.category === state.activeCategory);
    if (!categoryStillExists) {
      state.activeCategory = "All";
    }
  }

  render();
  showToast(elements, `${prompt?.title || "Prompt"} deleted`);
}

function runPaletteCommand(commandId) {
  const command = getPaletteCommand(commandId);
  if (!command) {
    return;
  }

  if (command.id === "new-prompt") {
    state.editingPromptId = null;
    resetPromptForm(elements);
    closeModal(elements.commandPaletteModal);
    focusPromptForm(elements);
    showToast(elements, "Ready for a new prompt");
  }
}

function sortByUpdatedAt(a, b) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  document.body.removeChild(helper);
}
