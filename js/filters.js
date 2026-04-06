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

export function deriveWorkflows(prompts, workflows) {
  const promptIds = new Set(prompts.map((prompt) => prompt.id));

  return [
    { id: "all", name: "All workflows", promptCount: prompts.length },
    ...workflows
      .map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        summary: workflow.summary,
        promptCount: getWorkflowPromptIds(workflow).filter((promptId) => promptIds.has(promptId))
          .length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  ];
}

export function getWorkflowPromptIds(workflow) {
  return Array.from(
    new Set(
      (workflow?.steps || [])
        .map((step) => step.promptId)
        .filter(Boolean),
    ),
  );
}

export function getPromptWorkflows(promptId, workflows) {
  return workflows.filter((workflow) => getWorkflowPromptIds(workflow).includes(promptId));
}

export function getWorkflowPrompts(workflowId, prompts, workflows) {
  const workflow = workflows.find((item) => item.id === workflowId);
  if (!workflow) {
    return [];
  }

  const promptsById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  return getWorkflowPromptIds(workflow)
    .map((promptId) => promptsById.get(promptId))
    .filter(Boolean);
}

export function filterPrompts(prompts, query, category, activeWorkflowId, workflows) {
  const normalizedQuery = normalizeText(query);
  const normalizedCategory = normalizeText(category);
  const workflow = workflows.find((item) => item.id === activeWorkflowId);
  const workflowPromptIds =
    workflow && activeWorkflowId !== "all" ? new Set(getWorkflowPromptIds(workflow)) : null;

  return prompts.filter((prompt) => {
    const categoryMatches =
      !normalizedCategory ||
      normalizedCategory === "all" ||
      normalizeText(prompt.category) === normalizedCategory;

    if (!categoryMatches) {
      return false;
    }

    if (workflowPromptIds && !workflowPromptIds.has(prompt.id)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const relatedWorkflows = getPromptWorkflows(prompt.id, workflows);

    const haystack = [
      prompt.title,
      prompt.category,
      prompt.shortcut,
      prompt.description,
      prompt.body,
      ...prompt.tags,
      ...relatedWorkflows.map((item) => item.name),
      ...relatedWorkflows.map((item) => item.summary),
      ...relatedWorkflows.map((item) => item.whenToUse),
      ...relatedWorkflows.map((item) => item.output),
      ...relatedWorkflows.flatMap((item) => item.inputs),
      ...relatedWorkflows.flatMap((item) => item.steps.map((step) => step.title)),
      ...relatedWorkflows.flatMap((item) => item.steps.map((step) => step.instruction)),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
