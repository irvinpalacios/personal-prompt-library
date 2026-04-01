import { ADMIN_PASSWORD } from "./data.js";

export function verifyAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

export function createPromptRecord(formValues, existingPrompt) {
  const timestamp = new Date().toISOString();
  const sanitizedTags = formValues.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const idSource = formValues.title.trim().toLowerCase();
  const id =
    existingPrompt?.id ||
    idSource
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  return {
    id,
    title: formValues.title.trim(),
    category: formValues.category.trim(),
    description: formValues.description.trim(),
    body: formValues.body.trim(),
    tags: sanitizedTags,
    favorite: formValues.favorite,
    createdAt: existingPrompt?.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

export function validatePromptRecord(prompt) {
  if (!prompt.id) {
    return "A title is required to generate an id.";
  }

  if (!prompt.title || !prompt.category || !prompt.description || !prompt.body) {
    return "Title, category, description, and prompt body are required.";
  }

  return "";
}
