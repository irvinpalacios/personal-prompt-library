import { createPromptRecord, validatePromptRecord, verifyAdminPassword } from "./admin.js";
import { clonePublishedWorkflows } from "./data.js";
import {
  deriveCategories,
  deriveWorkflows,
  filterPrompts,
  getPromptWorkflows,
  getWorkflowPrompts,
  normalizeText,
} from "./filters.js";
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
  fillPromptDetail,
  fillWorkflowDetail,
  focusPromptForm,
  markCopied,
  openModal,
  renderActiveView,
  renderActiveFilters,
  renderAdminList,
  renderFilters,
  renderPrompts,
  renderWorkflowList,
  resetPromptForm,
  showToast,
  toggleEmptyState,
  toggleWorkflowEmptyState,
  updateSummary,
} from "./ui.js";

const elements = createAppElements();

const state = {
  prompts: loadPrompts(),
  workflows: clonePublishedWorkflows(),
  query: "",
  activeView: "workflows",
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

  elements.viewSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) {
      return;
    }

    state.activeView = button.dataset.view;
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

  elements.workflowList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-start-workflow-id]");
    if (!button) {
      return;
    }

    openWorkflowDetail(button.dataset.startWorkflowId);
  });

  elements.activeFilterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-clear-filter]");
    if (!button) {
      return;
    }

    clearFilter(button.dataset.clearFilter);
  });

  elements.promptGrid.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-id]");
    if (copyButton) {
      await copyPromptById(copyButton.dataset.copyId, copyButton);
      return;
    }

    const promptCard = event.target.closest("[data-prompt-id]");
    if (!promptCard) {
      return;
    }

    const prompt = state.prompts.find((item) => item.id === promptCard.dataset.promptId);
    if (!prompt) {
      return;
    }

    openPromptDetail(prompt);
  });

  elements.promptGrid.addEventListener("keydown", (event) => {
    if (event.target.closest("[data-copy-id]")) {
      return;
    }

    const promptCard = event.target.closest("[data-prompt-id]");
    if (!promptCard) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    const prompt = state.prompts.find((item) => item.id === promptCard.dataset.promptId);
    if (!prompt) {
      return;
    }

    openPromptDetail(prompt);
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

  elements.adminShell.addEventListener("click", (event) => {
    if (!event.target.closest("[data-admin-close]")) {
      return;
    }

    closeAdminMode();
  });

  elements.adminLogoutButton.addEventListener("click", () => {
    closeAdminMode();
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

  elements.promptDetailCopyButton.addEventListener("click", async () => {
    await copyPromptById(
      elements.promptDetailCopyButton.dataset.copyPromptId,
      elements.promptDetailCopyButton,
    );
  });

  elements.promptDetailBackWorkflowButton.addEventListener("click", () => {
    const workflowId = elements.promptDetailBackWorkflowButton.dataset.workflowId;
    if (!workflowId) {
      return;
    }

    closeModal(elements.promptDetailModal);
    openWorkflowDetail(workflowId);
  });

  elements.promptDetailModal.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-workflow-id]");
    if (!button) {
      return;
    }

    closeModal(elements.promptDetailModal);
    openWorkflowDetail(button.dataset.openWorkflowId);
  });

  elements.workflowDetailModal.addEventListener("click", async (event) => {
    await handleWorkflowPromptAction(event, elements.workflowDetailModal.dataset.workflowId, true);
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
      closeModal(elements.promptDetailModal);
      closeModal(elements.workflowDetailModal);
    }
  });
}

function render() {
  const categories = deriveCategories(state.prompts);
  const workflows = deriveWorkflows(state.prompts, state.workflows);
  const workflowRecords = buildWorkflowRecords(workflows);
  const filteredWorkflows = filterWorkflowRecords(workflowRecords, state.query);
  const filteredPrompts = filterPrompts(
    state.prompts,
    state.query,
    state.activeCategory,
    "all",
    state.workflows,
  );

  renderActiveView(elements, state.activeView);
  renderWorkflowList(elements, filteredWorkflows);
  renderFilters(elements, categories, state.activeCategory);
  renderActiveFilters(elements, state);
  renderPrompts(elements, filteredPrompts, state.workflows);
  renderAdminList(elements, [...state.prompts].sort(sortByUpdatedAt));
  updateSummary(
    elements,
    state.activeView,
    state.prompts.length,
    filteredPrompts.length,
    filteredWorkflows.length,
  );
  toggleEmptyState(elements, filteredPrompts.length === 0);
  toggleWorkflowEmptyState(elements, filteredWorkflows.length === 0);
}

function syncAdminVisibility() {
  elements.adminShell.classList.toggle("hidden", !state.isAdmin);
  elements.adminShell.setAttribute("aria-hidden", String(!state.isAdmin));
  document.body.classList.toggle("is-admin-open", state.isAdmin);
  if (state.isAdmin) {
    resetPromptForm(elements);
  }
}

function readPromptForm() {
  return {
    title: elements.promptTitle.value,
    category: elements.promptCategory.value,
    shortcut: elements.promptShortcut.value,
    description: elements.promptDescription.value,
    body: elements.promptBody.value,
    tags: elements.promptTags.value,
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

function buildWorkflowRecords(workflowFilters) {
  const promptCountsByWorkflowId = new Map(
    workflowFilters.map((workflow) => [workflow.id, workflow.promptCount]),
  );

  return state.workflows.map((workflow) => ({
    ...workflow,
    promptCount: promptCountsByWorkflowId.get(workflow.id) || 0,
  }));
}

function filterWorkflowRecords(workflows, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return workflows;
  }

  return workflows.filter((workflow) => {
    const linkedPrompts = getWorkflowPrompts(workflow.id, state.prompts, state.workflows);
    const haystack = [
      workflow.name,
      workflow.summary,
      workflow.whenToUse,
      workflow.output,
      ...workflow.inputs,
      ...workflow.steps.map((step) => step.title),
      ...workflow.steps.map((step) => step.instruction),
      ...linkedPrompts.map((prompt) => prompt.title),
      ...linkedPrompts.map((prompt) => prompt.description),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function clearFilter(filterType) {
  if (filterType === "query" || filterType === "all") {
    state.query = "";
    elements.searchInput.value = "";
  }

  if (filterType === "category" || filterType === "all") {
    state.activeCategory = "All";
  }

  render();
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

function closeAdminMode() {
  state.isAdmin = false;
  saveAdminSession(false);
  syncAdminVisibility();
  closeModal(elements.commandPaletteModal);
  closeModal(elements.adminLoginModal);
  showToast(elements, "Admin mode closed");
}

function openPromptDetail(prompt, workflowContextId = "") {
  const relatedWorkflows = getPromptWorkflows(prompt.id, state.workflows);
  const workflowContext =
    workflowContextId && workflowContextId !== "all"
      ? state.workflows.find((workflow) => workflow.id === workflowContextId)
      : null;
  fillPromptDetail(elements, prompt, relatedWorkflows, workflowContext);
  openModal(elements.promptDetailModal, elements.promptDetailCloseButton);
}

function openWorkflowDetail(workflowId) {
  const workflow = state.workflows.find((item) => item.id === workflowId);
  if (!workflow) {
    return;
  }

  const linkedPrompts = getWorkflowPrompts(workflowId, state.prompts, state.workflows);
  elements.workflowDetailModal.dataset.workflowId = workflowId;
  fillWorkflowDetail(elements, workflow, linkedPrompts);
  openModal(elements.workflowDetailModal, elements.workflowDetailCloseButton);
}

async function handleWorkflowPromptAction(event, workflowId, closeWorkflowModal) {
  const copyButton = event.target.closest("[data-copy-prompt-id]");
  if (copyButton) {
    await copyPromptById(copyButton.dataset.copyPromptId, copyButton);
    return;
  }

  const openButton = event.target.closest("[data-open-prompt-id]");
  if (!openButton) {
    return;
  }

  const prompt = state.prompts.find((item) => item.id === openButton.dataset.openPromptId);
  if (!prompt) {
    return;
  }

  if (closeWorkflowModal) {
    closeModal(elements.workflowDetailModal);
  }

  openPromptDetail(prompt, workflowId);
}

async function copyPromptById(promptId, button) {
  const prompt = state.prompts.find((item) => item.id === promptId);
  if (!prompt) {
    return;
  }

  await copyText(prompt.body);
  if (button) {
    markCopied(button);
  }
  showToast(elements, "Prompt copied");
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
