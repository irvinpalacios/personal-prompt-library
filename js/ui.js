function formatCount(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function createAppElements() {
  return {
    promptCount: document.querySelector("#promptCount"),
    categoryCount: document.querySelector("#categoryCount"),
    searchInput: document.querySelector("#searchInput"),
    resultSummary: document.querySelector("#resultSummary"),
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
    promptDescription: document.querySelector("#promptDescription"),
    promptBody: document.querySelector("#promptBody"),
    promptTags: document.querySelector("#promptTags"),
    promptFavorite: document.querySelector("#promptFavorite"),
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

export function renderPrompts(elements, prompts) {
  elements.promptGrid.innerHTML = prompts
    .map(
      (prompt) => `
        <article class="prompt-card">
          <div class="prompt-meta">
            <span class="category-pill">${escapeHtml(prompt.category)}</span>
            ${prompt.favorite ? '<span class="favorite-badge">Featured</span>' : ""}
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
              <p class="eyebrow">${escapeHtml(prompt.category)}</p>
              <h5>${escapeHtml(prompt.title)}</h5>
            </div>
            ${prompt.favorite ? '<span class="favorite-badge">Featured</span>' : ""}
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

export function updateSummary(elements, totalPrompts, filteredPrompts, categoryCount) {
  elements.promptCount.textContent = String(totalPrompts);
  elements.categoryCount.textContent = String(categoryCount);
  elements.resultSummary.textContent = `${formatCount(filteredPrompts, "prompt")} visible`;
  elements.adminSummary.textContent = `${formatCount(totalPrompts, "record")} in this browser`;
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
  elements.promptDescription.value = prompt?.description || "";
  elements.promptBody.value = prompt?.body || "";
  elements.promptTags.value = prompt?.tags?.join(", ") || "";
  elements.promptFavorite.checked = Boolean(prompt?.favorite);

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
