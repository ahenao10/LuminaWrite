export const API_BASE_URL = "http://localhost:8000";

export const CEFR_LEVELS = [
  { code: "A1", name: "Beginner", label: "Level A1 Beginner" },
  { code: "A2", name: "Elementary", label: "Level A2 Elementary" },
  { code: "B1", name: "Intermediate", label: "Level B1 Intermediate" },
  { code: "B2", name: "Upper-Intermediate", label: "Level B2 Upper-Intermediate" },
  { code: "C1", name: "Advanced", label: "Level C1 Advanced" },
  { code: "C2", name: "Mastery", label: "Level C2 Mastery" },
];

export const SUGGESTED_TOPICS = [
  "All Topics",
  "Work & Career",
  "Technology & AI",
  "Culture & Society",
  "Education",
  "Environment",
  "Travel & Lifestyle",
];

export const DEFAULT_PROMPT = {
  topic: "Work & Career",
  question:
    "Discuss whether remote work benefits work-life balance or leads to burnout. Support your stance with two personal examples or observations.",
  min_words: 15,
  tips: [
    "Use clear transition connectors such as 'Furthermore', 'However', and 'Consequently' to structure your argument.",
    "Maintain consistent verb tenses when shifting between general claims (present simple) and personal examples (past simple).",
    "Support your main point with at least one concrete example from work or study life.",
  ],
};

export const INITIAL_JOURNAL_ENTRIES = [];

