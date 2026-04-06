function formatCount(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function createAppElements() {
  return {
    searchInput: document.querySelector("#searchInput"),
    resultSummary: document.querySelector("#resultSummary"),
    workflowFilters: document.querySelector("#workflowFilters"),
    workflowSummary: document.querySelector("#workflowSummary"),
    activeWorkflowButton: document.querySelector("#activeWorkflowButton"),
    categoryFilters: document.querySelector("#categoryFilters"),
    promptGrid: document.querySelector("#promptGrid"),
    emptyState: document.querySelector("#emptyState"),
    themeToggle: document.querySelector("#themeToggle"),
    themeToggleLabel: document.querySelector("#themeToggleLabel"),
    toast: document.querySelector("#toast"),
    adminShell: document.querySelector("#adminShell"),
    adminSummary: document.querySelector("#adminSummary"),
    adminList: document.querySelector("#adminList"),
    formTitle: document.querySelector("#formTitle"),
    promptForm: document.querySelector("#promptForm"),
    promptId: document.querySelector("#promptId"),
    promptTitle: document.querySelector("#promptTitle"),
    promptCategory: document.querySelector("#promptCategory"),
    promptShortcut: document.querySelector("#promptShortcut"),
    promptDescription: document.querySelector("#promptDescription"),
    promptBody: document.querySelector("#promptBody"),
    promptTags: document.querySelector("#promptTags"),
    savePromptButton: document.querySelector("#savePromptButton"),
    deletePromptButton: document.querySelector("#deletePromptButton"),
    resetFormButton: document.querySelector("#resetFormButton"),
    openPaletteButton: document.querySelector("#openPaletteButton"),
    adminLogoutButton: document.querySelector("#adminLogoutButton"),
    adminLoginModal: document.querySelector("#adminLoginModal"),
    adminLoginForm: document.querySelector("#adminLoginForm"),
    adminPasswordInput: document.querySelector("#adminPasswordInput"),
    adminLoginError: document.querySelector("#adminLoginError"),
    commandPaletteModal: document.querySelector("#commandPaletteModal"),
    paletteList: document.querySelector("#paletteList"),
    promptDetailModal: document.querySelector("#promptDetailModal"),
    promptDetailCloseButton: document.querySelector("#promptDetailCloseButton"),
    promptDetailCategory: document.querySelector("#promptDetailCategory"),
    promptDetailShortcut: document.querySelector("#promptDetailShortcut"),
    promptDetailTitle: document.querySelector("#promptDetailTitle"),
    promptDetailDescription: document.querySelector("#promptDetailDescription"),
    promptDetailTags: document.querySelector("#promptDetailTags"),
    promptDetailBody: document.querySelector("#promptDetailBody"),
    promptDetailWorkflows: document.querySelector("#promptDetailWorkflows"),
    promptDetailWorkflowList: document.querySelector("#promptDetailWorkflowList"),
    promptDetailCopyButton: document.querySelector("#promptDetailCopyButton"),
    workflowDetailModal: document.querySelector("#workflowDetailModal"),
    workflowDetailCloseButton: document.querySelector("#workflowDetailCloseButton"),
    workflowDetailTitle: document.querySelector("#workflowDetailTitle"),
    workflowDetailSummary: document.querySelector("#workflowDetailSummary"),
    workflowDetailWhenToUse: document.querySelector("#workflowDetailWhenToUse"),
    workflowDetailInputs: document.querySelector("#workflowDetailInputs"),
    workflowDetailOutput: document.querySelector("#workflowDetailOutput"),
    workflowDetailSteps: document.querySelector("#workflowDetailSteps"),
    workflowDetailPrompts: document.querySelector("#workflowDetailPrompts"),
  };
}

export function applyTheme(theme, elements) {
  document.body.dataset.theme = theme;
  elements.themeToggleLabel.textContent = theme === "dark" ? "Dark" : "Light";
}

export function renderFilters(elements, categories, activeCategory) {
  elements.categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button
          class="filter-chip ${category.name === activeCategory ? "active" : ""}"
          type="button"
          data-category="${category.name}"
        >
          ${category.name} <span aria-hidden="true">${category.count}</span>
        </button>
      `,
    )
    .join("");
}

export function renderWorkflowFilters(elements, workflows, activeWorkflowId) {
  elements.workflowFilters.innerHTML = workflows
    .map(
      (workflow) => `
        <button
          class="filter-chip ${workflow.id === activeWorkflowId ? "active" : ""}"
          type="button"
          data-workflow-id="${workflow.id}"
        >
          ${escapeHtml(workflow.name)} <span aria-hidden="true">${workflow.promptCount}</span>
        </button>
      `,
    )
    .join("");
}

export function renderPrompts(elements, prompts) {
  elements.promptGrid.innerHTML = prompts
    .map(
      (prompt) => `
        <article
          class="prompt-card"
          data-prompt-id="${prompt.id}"
          tabindex="0"
          role="button"
          aria-label="Open prompt ${escapeHtml(prompt.title)}"
        >
          <div class="prompt-meta">
            <span class="category-pill">${escapeHtml(prompt.category)}</span>
            ${renderShortcutBadge(prompt.shortcut)}
          </div>
          <div>
            <h3>${escapeHtml(prompt.title)}</h3>
            <p class="prompt-description">${escapeHtml(prompt.description)}</p>
          </div>
          <p class="prompt-snippet">${escapeHtml(prompt.body)}</p>
          <div class="prompt-footer">
            <div class="tag-list">
              ${prompt.tags
                .slice(0, 3)
                .map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`)
                .join("")}
            </div>
            <button class="copy-button" type="button" data-copy-id="${prompt.id}">
              Copy
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

export function renderAdminList(elements, prompts) {
  elements.adminList.innerHTML = prompts
    .map(
      (prompt) => `
        <article class="admin-record" data-admin-id="${prompt.id}">
          <div class="admin-record-header">
            <div>
              <div class="admin-record-meta">
                <p class="eyebrow">${escapeHtml(prompt.category)}</p>
                ${renderShortcutBadge(prompt.shortcut)}
              </div>
              <h5>${escapeHtml(prompt.title)}</h5>
            </div>
          </div>
          <p>${escapeHtml(prompt.description)}</p>
          <div class="admin-record-actions">
            <button class="text-button" type="button" data-edit-id="${prompt.id}">Edit</button>
            <button class="text-button danger" type="button" data-delete-id="${prompt.id}">
              Delete
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

export function updateSummary(elements, totalPrompts, filteredPrompts, activeCategory, activeWorkflow) {
  const summaryParts = [`${formatCount(filteredPrompts, "prompt")} visible`];

  if (activeWorkflow && activeWorkflow.id !== "all") {
    summaryParts.push(`workflow: ${activeWorkflow.name}`);
  }

  if (activeCategory && activeCategory !== "All") {
    summaryParts.push(`category: ${activeCategory}`);
  }

  elements.resultSummary.textContent = summaryParts.join(" | ");
  elements.adminSummary.textContent = `${formatCount(totalPrompts, "record")} in this browser`;
}

export function updateWorkflowSummary(elements, workflows, activeWorkflow) {
  if (activeWorkflow && activeWorkflow.id !== "all") {
    elements.workflowSummary.textContent = activeWorkflow.summary;
    elements.activeWorkflowButton.classList.remove("hidden");
    elements.activeWorkflowButton.textContent = "View workflow guide";
    elements.activeWorkflowButton.dataset.workflowId = activeWorkflow.id;
    return;
  }

  elements.workflowSummary.textContent = `${formatCount(
    Math.max(workflows.length - 1, 0),
    "workflow guide",
  )} available. Select a workflow to narrow the library and open the guide.`;
  elements.activeWorkflowButton.classList.add("hidden");
  elements.activeWorkflowButton.dataset.workflowId = "";
}

export function toggleEmptyState(elements, showEmpty) {
  elements.emptyState.classList.toggle("hidden", !showEmpty);
  elements.promptGrid.classList.toggle("hidden", showEmpty);
}

export function openModal(modal, focusTarget) {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  if (focusTarget) {
    requestAnimationFrame(() => focusTarget.focus());
  }
}

export function closeModal(modal) {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

export function fillPromptForm(elements, prompt) {
  elements.promptId.value = prompt?.id || "";
  elements.promptTitle.value = prompt?.title || "";
  elements.promptCategory.value = prompt?.category || "";
  elements.promptShortcut.value = prompt?.shortcut || "";
  elements.promptDescription.value = prompt?.description || "";
  elements.promptBody.value = prompt?.body || "";
  elements.promptTags.value = prompt?.tags?.join(", ") || "";

  const isEditing = Boolean(prompt);
  elements.formTitle.textContent = isEditing ? "Edit prompt" : "Add prompt";
  elements.savePromptButton.textContent = isEditing ? "Update prompt" : "Save prompt";
  elements.deletePromptButton.classList.toggle("hidden", !isEditing);
  elements.resetFormButton.classList.toggle("hidden", !isEditing);
}

export function resetPromptForm(elements) {
  fillPromptForm(elements, null);
}

export function focusPromptForm(elements) {
  elements.promptTitle.focus();
}

export function showToast(elements, message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 1800);
}

export function markCopied(button) {
  const original = button.textContent;
  button.textContent = "Copied";
  button.classList.add("is-copied");

  window.setTimeout(() => {
    button.textContent = original;
    button.classList.remove("is-copied");
  }, 1300);
}

export function fillPromptDetail(elements, prompt, relatedWorkflows) {
  elements.promptDetailCategory.textContent = prompt.category;
  elements.promptDetailShortcut.classList.toggle("hidden", !prompt.shortcut);
  elements.promptDetailShortcut.textContent = prompt.shortcut || "";
  elements.promptDetailTitle.textContent = prompt.title;
  elements.promptDetailDescription.textContent = prompt.description;
  elements.promptDetailBody.textContent = prompt.body;
  elements.promptDetailCopyButton.dataset.copyPromptId = prompt.id;

  const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
  elements.promptDetailTags.classList.toggle("hidden", tags.length === 0);
  elements.promptDetailTags.innerHTML = tags
    .map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`)
    .join("");

  elements.promptDetailWorkflows.classList.toggle("hidden", relatedWorkflows.length === 0);
  elements.promptDetailWorkflowList.innerHTML = relatedWorkflows
    .map(
      (workflow) => `
        <button class="workflow-link" type="button" data-open-workflow-id="${workflow.id}">
          ${escapeHtml(workflow.name)}
        </button>
      `,
    )
    .join("");
}

export function fillWorkflowDetail(elements, workflow, linkedPrompts) {
  elements.workflowDetailTitle.textContent = workflow.name;
  elements.workflowDetailSummary.textContent = workflow.summary;
  elements.workflowDetailWhenToUse.textContent = workflow.whenToUse;
  elements.workflowDetailOutput.textContent = workflow.output;
  elements.workflowDetailInputs.innerHTML = workflow.inputs
    .map((input) => `<li>${escapeHtml(input)}</li>`)
    .join("");
  elements.workflowDetailSteps.innerHTML = workflow.steps
    .map((step, index) => {
      const linkedPrompt = linkedPrompts.find((prompt) => prompt.id === step.promptId);

      return `
        <li class="workflow-step">
          <div class="workflow-step-copy">
            <p class="workflow-step-title">${index + 1}. ${escapeHtml(step.title)}</p>
            <p>${escapeHtml(step.instruction)}</p>
          </div>
          ${
            linkedPrompt
              ? `
                <button class="workflow-link" type="button" data-open-prompt-id="${linkedPrompt.id}">
                  ${escapeHtml(linkedPrompt.title)}
                </button>
              `
              : ""
          }
        </li>
      `;
    })
    .join("");
  elements.workflowDetailPrompts.innerHTML =
    linkedPrompts.length > 0
      ? linkedPrompts
          .map(
            (prompt) => `
              <button class="workflow-link" type="button" data-open-prompt-id="${prompt.id}">
                ${escapeHtml(prompt.title)}
              </button>
            `,
          )
          .join("")
      : `<p class="workflow-empty-copy">This workflow is currently guide-only and does not require a library prompt.</p>`;
}

function renderShortcutBadge(shortcut) {
  if (!shortcut) {
    return "";
  }

  return `<span class="shortcut-badge">${escapeHtml(shortcut)}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
