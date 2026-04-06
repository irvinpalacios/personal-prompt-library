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
  },
  {
    id: "client-discovery-brief",
    title: "Client Discovery Brief",
    category: "Business",
    shortcut: ";discovery-brief",
    description:
      "Turn a discovery call into a concise brief covering goals, constraints, objections, and next steps.",
    body:
      "Use the transcript or notes below to produce a client discovery brief. Structure the response as:\n1. Client goals\n2. Current pain points\n3. Constraints or non-negotiables\n4. Buying signals and objections\n5. Recommended next step\nKeep the language practical and CRM-ready. Highlight anything that needs clarification in a final open questions section.",
    tags: ["sales", "discovery", "briefing"],
    createdAt: "2026-04-01T08:10:00.000Z",
    updatedAt: "2026-04-01T08:10:00.000Z",
  },
  {
    id: "code-review-assistant",
    title: "Code Review Assistant",
    category: "Coding",
    shortcut: ";review",
    description:
      "Audit a code change for correctness, regressions, maintainability, and test gaps with senior-level precision.",
    body:
      "You are a meticulous senior software engineer reviewing a pull request. Analyze the proposed change for correctness, security concerns, performance risks, regressions, and readability issues. Return:\n1. Critical findings first.\n2. Medium-risk concerns next.\n3. Missing test scenarios.\n4. A concise merge recommendation.\nKeep feedback specific, technically defensible, and easy to action.",
    tags: ["review", "debugging", "quality"],
    createdAt: "2026-04-01T08:15:00.000Z",
    updatedAt: "2026-04-01T08:15:00.000Z",
  },
  {
    id: "blog-post-writer",
    title: "Blog Post Writer",
    category: "Writing",
    shortcut: ";blog",
    description:
      "Turn a topic into a clean, structured article with an opening hook, strong narrative flow, and practical insight.",
    body:
      "Write a comprehensive blog post about [TOPIC]. Start with a concise hook, explain the core idea in plain language, and organize the article into 3-5 sections with descriptive subheadings. Include one concrete example, one common mistake to avoid, and a sharp closing takeaway. Tone: informed, lucid, and human.",
    tags: ["blog", "content", "editorial"],
    createdAt: "2026-04-01T08:20:00.000Z",
    updatedAt: "2026-04-01T08:20:00.000Z",
  },
  {
    id: "creative-story-starter",
    title: "Creative Story Starter",
    category: "Creative",
    shortcut: ";story",
    description:
      "Generate a vivid opening paragraph that establishes tone, setting, and narrative momentum without overexplaining.",
    body:
      "Write an opening paragraph for a story in the [GENRE] genre. Introduce a main character in motion, establish a distinct atmosphere, and imply a larger conflict without explaining everything directly. Use evocative detail, a clear voice, and an ending sentence that creates narrative pull.",
    tags: ["fiction", "storytelling", "opening"],
    createdAt: "2026-04-01T08:25:00.000Z",
    updatedAt: "2026-04-01T08:25:00.000Z",
  },
  {
    id: "email-pitch-template",
    title: "Email Pitch Template",
    category: "Business",
    shortcut: ";pitch",
    description:
      "Create a concise cold email that sounds credible, benefit-led, and respectful of the reader's time.",
    body:
      "Draft a professional cold email to [RECIPIENT TYPE] about [PRODUCT OR SERVICE]. Keep it under 150 words. Lead with a relevant observation, explain one meaningful benefit, include a short proof point, and close with a low-friction call to action. Avoid hype and generic sales phrases.",
    tags: ["email", "sales", "outreach"],
    createdAt: "2026-04-01T08:30:00.000Z",
    updatedAt: "2026-04-01T08:30:00.000Z",
  },
  {
    id: "research-summary",
    title: "Research Summary",
    category: "Research",
    shortcut: ";summary",
    description:
      "Condense dense source material into a clean briefing with findings, implications, and open questions.",
    body:
      "Summarize the following research paper or report. Structure the response as:\n1. Core thesis.\n2. Three key findings.\n3. Why the findings matter in practice.\n4. Two open questions or limitations.\nKeep the language precise and accessible for a non-specialist stakeholder.",
    tags: ["academic", "summary", "analysis"],
    createdAt: "2026-04-01T08:35:00.000Z",
    updatedAt: "2026-04-01T08:35:00.000Z",
  },
  {
    id: "social-media-caption",
    title: "Social Media Caption",
    category: "Marketing",
    shortcut: ";caption",
    description:
      "Write a concise, energetic social caption with a hook, rhythm, and clear brand relevance.",
    body:
      "Write a social media caption for [PLATFORM] about [TOPIC OR PRODUCT]. Open with a short hook, keep the tone lively and polished, and end with a gentle engagement cue. Avoid filler hashtags and generic hype. Keep it adaptable to a premium modern brand voice.",
    tags: ["social", "engagement", "brand"],
    createdAt: "2026-04-01T08:40:00.000Z",
    updatedAt: "2026-04-01T08:40:00.000Z",
  },
  {
    id: "api-documentation",
    title: "API Documentation",
    category: "Coding",
    shortcut: ";api-doc",
    description:
      "Explain an endpoint with the structure and precision needed for an engineering handoff.",
    body:
      "Write API documentation for the following endpoint. Include purpose, authentication requirements, request parameters, request example, response example, failure cases, and implementation notes. Use clear headings and keep the language compact and engineering-focused.",
    tags: ["documentation", "api", "developer"],
    createdAt: "2026-04-01T08:45:00.000Z",
    updatedAt: "2026-04-01T08:45:00.000Z",
  },
  {
    id: "product-description",
    title: "Product Description",
    category: "Marketing",
    shortcut: ";product",
    description:
      "Craft a modern product description that balances benefit, texture, and clarity without sounding inflated.",
    body:
      "Write a product description for [PRODUCT]. Lead with the core promise, highlight the three strongest benefits, and describe the product in language that feels tactile and contemporary. Keep the tone polished, confident, and readable. Avoid cliches and exaggerated claims.",
    tags: ["copywriting", "ecommerce", "product"],
    createdAt: "2026-04-01T08:50:00.000Z",
    updatedAt: "2026-04-01T08:50:00.000Z",
  },
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
  },
  {
    id: "decision-log-routine",
    name: "Decision Log Routine",
    summary:
      "Capture key decisions from a meeting and log them manually when you do not need a dedicated prompt yet.",
    whenToUse:
      "Use for smaller internal calls where the goal is simply to preserve final decisions and rationale without producing a full note package.",
    inputs: [
      "Short meeting transcript or manual notes",
      "Project context",
    ],
    output:
      "A concise manual decision log entry with the decision, reasoning, and any follow-up needed.",
    steps: [
      {
        title: "Review the source material",
        instruction:
          "Scan the transcript or notes and isolate only confirmed decisions, not proposals or open questions.",
      },
      {
        title: "Record the final call",
        instruction:
          "Write a brief decision log entry with the choice made, why it was made, and who needs to be informed next.",
      },
    ],
  },
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
