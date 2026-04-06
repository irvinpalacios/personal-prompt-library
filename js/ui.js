function formatCount(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function createAppElements() {
  return {
    searchInput: document.querySelector("#searchInput"),
    resultSummary: document.querySelector("#resultSummary"),
    viewSwitch: document.querySelector("#viewSwitch"),
    workflowView: document.querySelector("#workflowView"),
    promptView: document.querySelector("#promptView"),
    workflowList: document.querySelector("#workflowList"),
    workflowEmptyState: document.querySelector("#workflowEmptyState"),
    categoryFilters: document.querySelector("#categoryFilters"),
    activeFilterBar: document.querySelector("#activeFilterBar"),
    promptGrid: document.querySelector("#promptGrid"),
    emptyState: document.querySelector("#emptyState"),
    emptyStateTitle: document.querySelector("#emptyStateTitle"),
    emptyStateMessage: document.querySelector("#emptyStateMessage"),
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
    promptDetailBackWorkflowButton: document.querySelector("#promptDetailBackWorkflowButton"),
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

export function renderActiveView(elements, activeView) {
  elements.workflowView.classList.toggle("hidden", activeView !== "workflows");
  elements.promptView.classList.toggle("hidden", activeView !== "prompts");
  elements.viewSwitch.querySelectorAll("[data-view]").forEach((button) => {
    const isActive = button.dataset.view === activeView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
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

export function renderWorkflowList(elements, workflows) {
  elements.workflowList.innerHTML = workflows
    .map(
      (workflow) => `
        <article class="workflow-card">
          <div class="workflow-card-main">
            <p class="eyebrow">${formatCount(workflow.steps.length, "step")} | ${formatCount(
              workflow.promptCount,
              "linked prompt",
            )}</p>
            <h3>${escapeHtml(workflow.name)}</h3>
            <p>${escapeHtml(workflow.summary)}</p>
          </div>
          <div class="workflow-card-detail">
            <p class="eyebrow">Expected output</p>
            <p>${escapeHtml(workflow.output)}</p>
          </div>
          <button
            class="primary-button"
            type="button"
            data-start-workflow-id="${workflow.id}"
            aria-label="Start workflow ${escapeHtml(workflow.name)}"
          >
            Start Workflow
          </button>
        </article>
      `,
    )
    .join("");
}

export function renderActiveFilters(elements, state) {
  const filters = [];

  if (state.query) {
    filters.push({ type: "query", label: `Search: ${state.query}` });
  }

  if (state.activeCategory && state.activeCategory !== "All") {
    filters.push({ type: "category", label: `Category: ${state.activeCategory}` });
  }

  elements.activeFilterBar.classList.toggle("hidden", filters.length === 0);
  elements.activeFilterBar.innerHTML =
    filters.length === 0
      ? ""
      : `
        ${filters
          .map(
            (filter) => `
              <button class="active-filter-chip" type="button" data-clear-filter="${filter.type}">
                ${escapeHtml(filter.label)} <span aria-hidden="true">x</span>
              </button>
            `,
          )
          .join("")}
        <button class="text-button active-filter-clear" type="button" data-clear-filter="all">
          Clear All
        </button>
      `;
}

export function renderPrompts(elements, prompts, workflows) {
  elements.promptGrid.innerHTML = prompts
    .map(
      (prompt) => {
        const relatedWorkflows = getPromptWorkflows(prompt.id, workflows);
        return `
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
          ${renderWorkflowMembership(relatedWorkflows)}
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
      `;
      },
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

export function updateSummary(elements, activeView, totalPrompts, filteredPrompts, filteredWorkflows) {
  elements.resultSummary.textContent =
    activeView === "workflows"
      ? `${formatCount(filteredWorkflows, "workflow guide")} visible`
      : `${formatCount(filteredPrompts, "prompt")} visible`;
  elements.adminSummary.textContent = `${formatCount(totalPrompts, "record")} in this browser`;
}

export function toggleEmptyState(elements, showEmpty) {
  elements.emptyState.classList.toggle("hidden", !showEmpty);
  elements.promptGrid.classList.toggle("hidden", showEmpty);

  elements.emptyStateTitle.textContent = "Nothing fits that search yet.";
  elements.emptyStateMessage.textContent =
    "Try another keyword, clear the active filters, or expand the library in admin mode.";
}

export function toggleWorkflowEmptyState(elements, showEmpty) {
  elements.workflowEmptyState.classList.toggle("hidden", !showEmpty);
  elements.workflowList.classList.toggle("hidden", showEmpty);
}

export function openModal(modal, focusTarget) {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
  if (focusTarget) {
    requestAnimationFrame(() => focusTarget.focus());
  }
}

export function closeModal(modal) {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  const visibleModal = document.querySelector(".modal:not(.hidden)");
  document.body.classList.toggle("is-modal-open", Boolean(visibleModal));
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

export function fillPromptDetail(elements, prompt, relatedWorkflows, workflowContext) {
  elements.promptDetailCategory.textContent = prompt.category;
  elements.promptDetailShortcut.classList.toggle("hidden", !prompt.shortcut);
  elements.promptDetailShortcut.textContent = prompt.shortcut || "";
  elements.promptDetailTitle.textContent = prompt.title;
  elements.promptDetailDescription.textContent = prompt.description;
  elements.promptDetailBody.textContent = prompt.body;
  elements.promptDetailCopyButton.dataset.copyPromptId = prompt.id;
  elements.promptDetailBackWorkflowButton.classList.toggle("hidden", !workflowContext);
  elements.promptDetailBackWorkflowButton.dataset.workflowId = workflowContext?.id || "";
  elements.promptDetailBackWorkflowButton.textContent = workflowContext
    ? `Back to ${workflowContext.name}`
    : "Back to Workflow";

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
  elements.workflowDetailSteps.innerHTML = renderWorkflowSteps(workflow.steps, linkedPrompts);
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

function renderWorkflowMembership(workflows) {
  if (workflows.length === 0) {
    return "";
  }

  const label =
    workflows.length === 1 ? `Used in ${workflows[0].name}` : `Used in ${workflows.length} workflows`;

  return `<p class="workflow-membership">${escapeHtml(label)}</p>`;
}

function renderWorkflowSteps(steps, linkedPrompts) {
  return steps
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
                <div class="workflow-step-actions">
                  <button class="workflow-link" type="button" data-open-prompt-id="${linkedPrompt.id}">
                    View Prompt
                  </button>
                  <button class="workflow-link secondary" type="button" data-copy-prompt-id="${linkedPrompt.id}">
                    Copy Prompt
                  </button>
                </div>
              `
              : ""
          }
        </li>
      `;
    })
    .join("");
}

function getPromptWorkflows(promptId, workflows) {
  return workflows.filter((workflow) =>
    workflow.steps.some((step) => step.promptId && step.promptId === promptId),
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
