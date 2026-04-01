export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  prompts: "prompt-library.prompts.v1",
  theme: "prompt-library.theme",
  adminSession: "prompt-library.admin-session",
};

export const ADMIN_PASSWORD = "teal-library";

export const DEFAULT_THEME = "dark";

export const seedPrompts = [
  {
    id: "code-review-assistant",
    title: "Code Review Assistant",
    category: "Coding",
    description:
      "Audit a code change for correctness, regressions, maintainability, and test gaps with senior-level precision.",
    body:
      "You are a meticulous senior software engineer reviewing a pull request. Analyze the proposed change for correctness, security concerns, performance risks, regressions, and readability issues. Return:\n1. Critical findings first.\n2. Medium-risk concerns next.\n3. Missing test scenarios.\n4. A concise merge recommendation.\nKeep feedback specific, technically defensible, and easy to action.",
    tags: ["review", "debugging", "quality"],
    favorite: true,
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-01T08:00:00.000Z",
  },
  {
    id: "blog-post-writer",
    title: "Blog Post Writer",
    category: "Writing",
    description:
      "Turn a topic into a clean, structured article with an opening hook, strong narrative flow, and practical insight.",
    body:
      "Write a comprehensive blog post about [TOPIC]. Start with a concise hook, explain the core idea in plain language, and organize the article into 3-5 sections with descriptive subheadings. Include one concrete example, one common mistake to avoid, and a sharp closing takeaway. Tone: informed, lucid, and human.",
    tags: ["blog", "content", "editorial"],
    favorite: false,
    createdAt: "2026-04-01T08:05:00.000Z",
    updatedAt: "2026-04-01T08:05:00.000Z",
  },
  {
    id: "creative-story-starter",
    title: "Creative Story Starter",
    category: "Creative",
    description:
      "Generate a vivid opening paragraph that establishes tone, setting, and narrative momentum without overexplaining.",
    body:
      "Write an opening paragraph for a story in the [GENRE] genre. Introduce a main character in motion, establish a distinct atmosphere, and imply a larger conflict without explaining everything directly. Use evocative detail, a clear voice, and an ending sentence that creates narrative pull.",
    tags: ["fiction", "storytelling", "opening"],
    favorite: true,
    createdAt: "2026-04-01T08:10:00.000Z",
    updatedAt: "2026-04-01T08:10:00.000Z",
  },
  {
    id: "email-pitch-template",
    title: "Email Pitch Template",
    category: "Business",
    description:
      "Create a concise cold email that sounds credible, benefit-led, and respectful of the reader’s time.",
    body:
      "Draft a professional cold email to [RECIPIENT TYPE] about [PRODUCT OR SERVICE]. Keep it under 150 words. Lead with a relevant observation, explain one meaningful benefit, include a short proof point, and close with a low-friction call to action. Avoid hype and generic sales phrases.",
    tags: ["email", "sales", "outreach"],
    favorite: false,
    createdAt: "2026-04-01T08:15:00.000Z",
    updatedAt: "2026-04-01T08:15:00.000Z",
  },
  {
    id: "research-summary",
    title: "Research Summary",
    category: "Research",
    description:
      "Condense dense source material into a clean briefing with findings, implications, and open questions.",
    body:
      "Summarize the following research paper or report. Structure the response as:\n1. Core thesis.\n2. Three key findings.\n3. Why the findings matter in practice.\n4. Two open questions or limitations.\nKeep the language precise and accessible for a non-specialist stakeholder.",
    tags: ["academic", "summary", "analysis"],
    favorite: true,
    createdAt: "2026-04-01T08:20:00.000Z",
    updatedAt: "2026-04-01T08:20:00.000Z",
  },
  {
    id: "social-media-caption",
    title: "Social Media Caption",
    category: "Marketing",
    description:
      "Write a concise, energetic social caption with a hook, rhythm, and clear brand relevance.",
    body:
      "Write a social media caption for [PLATFORM] about [TOPIC OR PRODUCT]. Open with a short hook, keep the tone lively and polished, and end with a gentle engagement cue. Avoid filler hashtags and generic hype. Keep it adaptable to a premium modern brand voice.",
    tags: ["social", "engagement", "brand"],
    favorite: false,
    createdAt: "2026-04-01T08:25:00.000Z",
    updatedAt: "2026-04-01T08:25:00.000Z",
  },
  {
    id: "api-documentation",
    title: "API Documentation",
    category: "Coding",
    description:
      "Explain an endpoint with the structure and precision needed for an engineering handoff.",
    body:
      "Write API documentation for the following endpoint. Include purpose, authentication requirements, request parameters, request example, response example, failure cases, and implementation notes. Use clear headings and keep the language compact and engineering-focused.",
    tags: ["documentation", "api", "developer"],
    favorite: false,
    createdAt: "2026-04-01T08:30:00.000Z",
    updatedAt: "2026-04-01T08:30:00.000Z",
  },
  {
    id: "product-description",
    title: "Product Description",
    category: "Marketing",
    description:
      "Craft a modern product description that balances benefit, texture, and clarity without sounding inflated.",
    body:
      "Write a product description for [PRODUCT]. Lead with the core promise, highlight the three strongest benefits, and describe the product in language that feels tactile and contemporary. Keep the tone polished, confident, and readable. Avoid cliches and exaggerated claims.",
    tags: ["copywriting", "ecommerce", "product"],
    favorite: true,
    createdAt: "2026-04-01T08:35:00.000Z",
    updatedAt: "2026-04-01T08:35:00.000Z",
  },
];
