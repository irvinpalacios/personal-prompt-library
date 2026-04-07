export const STORAGE_VERSION = 2;

export const STORAGE_KEYS = {
  prompts: "prompt-library.prompt-drafts.v2",
  theme: "prompt-library.theme",
  adminSession: "prompt-library.admin-session",
};

export const ADMIN_PASSWORD = "teal-library";

export const DEFAULT_THEME = "dark";

export const publishedPrompts = [
  {
    id: "project-meeting-notes",
    title: "Project Meeting Notes",
    category: "Operations",
    shortcut: ";meeting-notes",
    description:
      "Turn a meeting transcript into standardized project notes with decisions, blockers, and next steps.",
    body:
      "Convert the transcript below into project notes for [PROJECT NAME]. Return exactly these sections:\n1. Meeting overview\n2. Decisions made\n3. Risks or blockers\n4. Action items with owner and due date\n5. Follow-up needed\nKeep the writing concise, operational, and ready to paste into the project management record. If a detail is missing, label it as unknown instead of guessing.",
    tags: ["meetings", "operations", "project-management"],
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-01T08:00:00.000Z",
  },
  {
    id: "action-item-extractor",
    title: "Action Item Extractor",
    category: "Operations",
    shortcut: ";actions",
    description:
      "Extract next actions from a call or note set and normalize them into an owner-driven checklist.",
    body:
      "Review the material below and extract every concrete action item. Return a table with these columns:\n- Action\n- Owner\n- Due date\n- Dependency or blocker\nOnly include real commitments or explicit follow-ups. If the owner or due date is unclear, write unknown. Remove duplicate actions and merge obvious repeats.",
    tags: ["follow-up", "tasks", "operations"],
    createdAt: "2026-04-01T08:05:00.000Z",
    updatedAt: "2026-04-01T08:05:00.000Z",
  }
];

export const publishedWorkflows = [
  {
    id: "zoom-project-handoff",
    name: "Zoom Project Handoff",
    summary:
      "Turn a raw Zoom transcript into standardized project notes and a clean list of next actions.",
    whenToUse:
      "Use after internal project syncs, client check-ins, or implementation calls when you need to update the project system quickly and consistently.",
    inputs: [
      "Meeting transcript or transcript export",
      "Project name, meeting date, and participants",
      "Any explicit deadlines or decisions from the call",
    ],
    output:
      "A project management-ready note plus a normalized action-item list with owners and due dates.",
    steps: [
      {
        title: "Prepare the transcript",
        instruction:
          "Download the Zoom transcript, remove obvious speaker-label noise if needed, and keep the full context together in one pasteable block.",
      },
      {
        title: "Create the structured meeting note",
        instruction:
          "Run the transcript through the project-note prompt so the output is already formatted for your project record.",
        promptId: "project-meeting-notes",
      },
      {
        title: "Pull the follow-up list",
        instruction:
          "Run the same transcript or the cleaned notes through the action-item prompt to isolate owners, due dates, and blockers.",
        promptId: "action-item-extractor",
      },
    ],
  },
  {
    id: "client-discovery-capture",
    name: "Client Discovery Capture",
    summary:
      "Convert a discovery or sales call into reusable internal notes and a concise client brief.",
    whenToUse:
      "Use after discovery, qualification, or scoping calls when you need both an internal record and a brief that can be shared with account or delivery teams.",
    inputs: [
      "Call transcript or call notes",
      "Client name and opportunity context",
      "Open questions that still need follow-up",
    ],
    output:
      "A standardized call record and a client brief that highlights goals, constraints, objections, and recommended next steps.",
    steps: [
      {
        title: "Normalize the raw call",
        instruction:
          "Standardize the transcript first so the important decisions, blockers, and open items are easy to review.",
        promptId: "project-meeting-notes",
      },
      {
        title: "Write the discovery brief",
        instruction:
          "Generate a concise brief for downstream stakeholders, using the cleaned call record as the source material.",
        promptId: "client-discovery-brief",
      },
    ],
  }
];

export function clonePublishedPrompts() {
  return publishedPrompts.map((prompt) => ({ ...prompt, tags: [...prompt.tags] }));
}

export function clonePublishedWorkflows() {
  return publishedWorkflows.map((workflow) => ({
    ...workflow,
    inputs: [...workflow.inputs],
    steps: workflow.steps.map((step) => ({ ...step })),
  }));
}
