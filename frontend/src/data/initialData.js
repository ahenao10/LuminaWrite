const envApiUrl = import.meta.env?.VITE_API_URL;
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export const API_BASE_URL = (
  envApiUrl ||
  (isLocalhost
    ? "http://localhost:8000"
    : "https://luminawrite.onrender.com")
).replace(/\/+$/, "");

export const CEFR_LEVELS = [
  { code: "A1", name: "Beginner", label: "Level A1 Beginner" },
  { code: "A2", name: "Elementary", label: "Level A2 Elementary" },
  { code: "B1", name: "Intermediate", label: "Level B1 Intermediate" },
  { code: "B2", name: "Upper-Intermediate", label: "Level B2 Upper-Intermediate" },
  { code: "C1", name: "Advanced", label: "Level C1 Advanced" },
  { code: "C2", name: "Mastery", label: "Level C2 Mastery" },
];

export const SUGGESTED_TOPICS = [
  "Daily Lifestyle",
  "All Topics",
  "Work & Career",
  "Technology & AI",
  "Culture & Society",
  "Education",
  "Environment",
  "Travel & Lifestyle",
];

export const DEFAULT_PROMPT = {
  topic: "Daily Lifestyle",
  suggested_title: "My Day: Past, Present, and Plans",
  question:
    "Describe your day today: what did you do earlier, what are you working on right now, and what are your plans for the rest of the day?",
  min_words: 15,
  tips: [
    "Use past simple for things you already did today (e.g., 'This morning I woke up early and...').",
    "Use present continuous or present simple for what you are doing right now (e.g., 'Currently, I am studying...').",
    "Use 'going to' or 'will' to talk about your plans for later today (e.g., 'Tonight I am going to...').",
  ],
};

export const INITIAL_JOURNAL_ENTRIES = [];