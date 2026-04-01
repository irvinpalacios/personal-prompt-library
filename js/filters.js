export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function deriveCategories(prompts) {
  const counts = new Map();

  prompts.forEach((prompt) => {
    const key = prompt.category.trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [
    { name: "All", count: prompts.length },
    ...Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count })),
  ];
}

export function filterPrompts(prompts, query, category) {
  const normalizedQuery = normalizeText(query);
  const normalizedCategory = normalizeText(category);

  return prompts.filter((prompt) => {
    const categoryMatches =
      !normalizedCategory ||
      normalizedCategory === "all" ||
      normalizeText(prompt.category) === normalizedCategory;

    if (!categoryMatches) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      prompt.title,
      prompt.category,
      prompt.description,
      prompt.body,
      ...prompt.tags,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
