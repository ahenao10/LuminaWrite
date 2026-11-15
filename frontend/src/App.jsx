import React, { useEffect, useState } from "react";
import CalendarProgressView from "./components/CalendarProgressView";
import DailyPracticeView from "./components/DailyPracticeView";
import JournalEntriesView from "./components/JournalEntriesView";
import LoginView from "./components/LoginView";
import SessionReviewView from "./components/SessionReviewView";
import {
  API_BASE_URL,
  CEFR_FOCUS_AREAS,
  CEFR_LEVELS,
  DEFAULT_PROMPT,
} from "./data/initialData";

function formatEntryDate(isoDate) {
  if (!isoDate) return "Just now";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "Just now";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapDbEntryToUi(row) {
  const createdDate = row.created_at ? new Date(row.created_at) : new Date();
  const hasEvaluation = row.score !== null && row.score !== undefined;
  const statusLabel =
    row.status === "draft"
      ? "Draft"
      : row.status === "perfected"
      ? "Perfected"
      : "Reviewed";

  return {
    id: row.id,
    promptId: `Entry #${String(row.id).slice(0, 6)}`,
    title: row.title || row.topic || "Writing Practice",
    topic: row.topic || "General",
    question: row.prompt_question,
    date: formatEntryDate(row.created_at),
    dayOfMonth: createdDate.getDate(),
    words: row.word_count || 0,
    status: statusLabel,
    user_text: row.original_text || "",
    evaluation: hasEvaluation
      ? {
          score: row.score,
          cefr_level: row.cefr_level || "B1",
          rubric: row.rubric || {
            grammar: 0,
            vocabulary: 0,
            cohesion: 0,
            task_achievement: 0,
          },
          enhanced_text: row.enhanced_text || "",
          corrections: Array.isArray(row.corrections) ? row.corrections : [],
        }
      : null,
    quizResult: row.rubric?.quiz_result || null,
  };
}

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("lumina_theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    try {
      localStorage.setItem("lumina_theme", isDarkMode ? "dark" : "light");
    } catch {
      // ignore storage error
    }
  }, [isDarkMode]);

  const [activeTab, setActiveTab] = useState("daily-practice");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCefr, setSelectedCefr] = useState("B1");
  const [selectedFocusAreas, setSelectedFocusAreas] = useState(
    () => CEFR_FOCUS_AREAS.B1 || []
  );
  const [selectedTopic, setSelectedTopic] = useState("Daily Lifestyle");
  const [promptData, setPromptData] = useState(DEFAULT_PROMPT);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [hasPendingPromptChanges, setHasPendingPromptChanges] = useState(false);

  const [essayTitle, setEssayTitle] = useState(
    DEFAULT_PROMPT.suggested_title || ""
  );
  const [userText, setUserText] = useState("");

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [latestEvaluation, setLatestEvaluation] = useState(null);

  const [journalEntries, setJournalEntries] = useState([]);
  const [activeReviewEntry, setActiveReviewEntry] = useState(null);

  const fetchEntriesFromDb = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      const mapped = Array.isArray(data.entries)
        ? data.entries.map(mapDbEntryToUi)
        : [];
      setJournalEntries(mapped);
    } catch {
      // ignore initial fetch error
    }
  };

  const handleSignIn = async ({ accessToken: token, user, profile }) => {
    setAccessToken(token);
    setCurrentUser(user);
    setUserProfile(profile);
    const initialLevel = profile?.target_cefr || selectedCefr;
    const initialFocus = CEFR_FOCUS_AREAS[initialLevel] || [];
    if (profile?.target_cefr) {
      setSelectedCefr(profile.target_cefr);
    }
    setSelectedFocusAreas(initialFocus);
    await fetchEntriesFromDb(token);
    handleGeneratePrompt(initialLevel, selectedTopic, initialFocus);
  };

  const handleSignOut = async () => {
    if (accessToken) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        // ignore logout error
      }
    }
    setAccessToken(null);
    setCurrentUser(null);
    setUserProfile(null);
    setJournalEntries([]);
    setActiveReviewEntry(null);
    setLatestEvaluation(null);
    setEssayTitle(DEFAULT_PROMPT.suggested_title || "");
    setUserText("");
    setSelectedCefr("B1");
    setSelectedFocusAreas(CEFR_FOCUS_AREAS.B1 || []);
    setHasPendingPromptChanges(false);
    setActiveTab("daily-practice");
  };

  if (!accessToken) {
    return (
      <LoginView
        onSignIn={handleSignIn}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />
    );
  }

  const handleGeneratePrompt = async (
    overrideLevel,
    overrideTopic,
    overrideFocusAreas
  ) => {
    const levelToUse =
      typeof overrideLevel === "string" ? overrideLevel : selectedCefr;
    const topicToUse =
      typeof overrideTopic === "string" ? overrideTopic : selectedTopic;
    const focusToUse = Array.isArray(overrideFocusAreas)
      ? overrideFocusAreas
      : selectedFocusAreas;
    const levelFocusOptions = CEFR_FOCUS_AREAS[levelToUse] || [];
    const isAllFocus =
      levelFocusOptions.length > 0 &&
      focusToUse.length >= levelFocusOptions.length;

    setIsGeneratingPrompt(true);
    setErrorMessage("");
    setUserText("");

    try {
      const body = {
        cefr_level: levelToUse,
        topic: topicToUse === "All Topics" ? null : topicToUse,
        focus_areas:
          isAllFocus || focusToUse.length === 0 ? null : focusToUse,
      };

      const res = await fetch(`${API_BASE_URL}/api/generate-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Server responded with status ${res.status}`
        );
      }

      const data = await res.json();
      const recommendedTitle =
        data.suggested_title ||
        `${data.topic || "Writing Practice"} — ${levelToUse} Essay`;
      setPromptData({
        topic: data.topic || "Daily Practice",
        suggested_title: recommendedTitle,
        question: data.question,
        min_words: Math.max(15, data.min_words || 15),
        tips: Array.isArray(data.tips) ? data.tips : [],
      });
      setEssayTitle(recommendedTitle);
      setLatestEvaluation(null);
      setHasPendingPromptChanges(false);
    } catch (err) {
      setErrorMessage(
        err.message ||
          `Could not connect to backend at ${API_BASE_URL}. Make sure the API server is running.`
      );
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSelectCefr = (newLevel) => {
    if (newLevel === selectedCefr) return;
    const defaultFocus = CEFR_FOCUS_AREAS[newLevel] || [];
    setSelectedCefr(newLevel);
    setSelectedFocusAreas(defaultFocus);
    setHasPendingPromptChanges(true);
  };

  const handleSelectFocusAreas = (nextFocusAreas) => {
    setSelectedFocusAreas(nextFocusAreas);
    setHasPendingPromptChanges(true);
  };

  const handleSelectTopic = (newTopic) => {
    setSelectedTopic(newTopic);
    handleGeneratePrompt(selectedCefr, newTopic, selectedFocusAreas);
  };

  const handleEvaluate = async () => {
    const trimmed = userText.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    if (words < 15) {
      setErrorMessage(
        "Please write at least 15 words before submitting your text for AI evaluation."
      );
      return;
    }

    setIsEvaluating(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt_question: promptData.question,
          user_text: trimmed,
          title: essayTitle.trim() || promptData.topic || "Writing Practice",
          topic: promptData.topic || "General",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Evaluation failed with status ${res.status}`
        );
      }

      const evalResult = await res.json();
      setLatestEvaluation(evalResult);

      const newEntry = evalResult.saved_entry
        ? mapDbEntryToUi(evalResult.saved_entry)
        : {
            id: `entry-${Date.now()}`,
            promptId: `Prompt #${journalEntries.length + 1}`,
            title: essayTitle.trim() || promptData.topic || "Writing Practice",
            topic: promptData.topic || "General",
            question: promptData.question,
            date: "Just now",
            dayOfMonth: new Date().getDate(),
            words,
            status: "Reviewed",
            user_text: trimmed,
            evaluation: evalResult,
          };

      setJournalEntries((prev) => [newEntry, ...prev]);
      setActiveReviewEntry(newEntry);

      // Clear editor, redirect to Session Review, and prepare a new optional prompt + title for Daily Practice
      setUserText("");
      setActiveTab("session-review");
      window.scrollTo({ top: 0, behavior: "smooth" });
      handleGeneratePrompt(selectedCefr);
    } catch (err) {
      setErrorMessage(
        err.message ||
          `Could not evaluate text. Ensure the backend is reachable at ${API_BASE_URL}.`
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveDraft = async () => {
    const trimmed = userText.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    if (words === 0) return;

    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: essayTitle.trim() || promptData.topic || "Untitled Draft",
          topic: promptData.topic || "General",
          prompt_question: promptData.question,
          original_text: trimmed,
          word_count: words,
          status: "draft",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to save draft to database.");
      }

      const data = await res.json();
      if (data.entry) {
        setJournalEntries((prev) => [mapDbEntryToUi(data.entry), ...prev]);
      }
    } catch (err) {
      setErrorMessage(err.message || "Could not save draft to Supabase.");
    }
  };

  const handleDeleteEntry = async (entryId) => {
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/entries/${entryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to delete entry.");
      }
      setJournalEntries((prev) => prev.filter((e) => e.id !== entryId));
      if (activeReviewEntry?.id === entryId) {
        setActiveReviewEntry(null);
      }
    } catch (err) {
      setErrorMessage(err.message || "Could not delete entry from Supabase.");
    }
  };

  const handleSaveQuizResult = async (entryId, quizResult) => {
    setJournalEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, quizResult } : e))
    );
    setActiveReviewEntry((prev) =>
      prev && prev.id === entryId ? { ...prev, quizResult } : prev
    );

    if (!accessToken || !entryId || String(entryId).startsWith("local-")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/entries/${entryId}/quiz`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(quizResult),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to save quiz results.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Could not save quiz results.");
    }
  };

  const handleSelectEntryForReview = (entry) => {
    setActiveReviewEntry(entry);
    setActiveTab("session-review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditEntryInPractice = (entry) => {
    if (entry.status !== "Draft") {
      handleSelectEntryForReview(entry);
      return;
    }
    setEssayTitle(entry.title || "");
    setUserText(entry.user_text || "");
    setPromptData((prev) => ({
      ...prev,
      topic: entry.topic || prev.topic,
      question: entry.question || prev.question,
    }));
    setLatestEvaluation(null);
    setActiveTab("daily-practice");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartNewWriting = () => {
    setEssayTitle(
      promptData.suggested_title ||
        DEFAULT_PROMPT.suggested_title ||
        `${promptData.topic || "Writing Practice"} — ${selectedCefr} Essay`
    );
    setUserText("");
    setLatestEvaluation(null);
    setActiveTab("daily-practice");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentCefrObj =
    CEFR_LEVELS.find(
      (l) => l.code === (latestEvaluation?.cefr_level || selectedCefr)
    ) || CEFR_LEVELS[2];

  const uniqueDaysLogged = new Set(
    journalEntries.map((e) => e.dayOfMonth).filter(Boolean)
  ).size;
  const goalProgressPercent = Math.min(
    100,
    Math.round((uniqueDaysLogged / 5) * 100)
  );

  const displayUserLabel =
    userProfile?.display_name || currentUser?.email || "Learner";

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface">
      {/* Left Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 hidden md:flex flex-col justify-between py-6 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div
            onClick={() => setActiveTab("daily-practice")}
            className="flex items-center gap-3 px-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                edit_note
              </span>
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Lumina Write
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("daily-practice")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                activeTab === "daily-practice"
                  ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                edit_note
              </span>
              <span className="font-label-lg text-label-lg">Daily Practice</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("session-review")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                activeTab === "session-review"
                  ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">
                  rate_review
                </span>
                <span className="font-label-lg text-label-lg">
                  Session Review
                </span>
              </span>
              {latestEvaluation && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-tertiary text-on-tertiary">
                  {latestEvaluation.score}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("journal-entries")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                activeTab === "journal-entries"
                  ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">
                  menu_book
                </span>
                <span className="font-label-lg text-label-lg">
                  Journal Entries
                </span>
              </span>
              <span className="font-label-sm text-label-sm opacity-75">
                {journalEntries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("calendar-and-progress")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                activeTab === "calendar-and-progress"
                  ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                calendar_month
              </span>
              <span className="font-label-lg text-label-lg">
                Calendar &amp; Progress
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Writing Goal Card & Sign Out */}
        <div className="flex flex-col gap-3 px-2">
          <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Writing Goal
              </span>
              <span className="font-label-sm text-label-sm text-primary font-bold">
                {Math.min(5, uniqueDaysLogged)}/5 Days
              </span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${goalProgressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="font-label-md text-label-md">Sign Out</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={isDarkMode ? "Light mode" : "Dark mode"}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDarkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64">
        {/* Top Fixed Header */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl z-40 pl-4 pr-16 md:px-4 lg:px-gutter-lg flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-surface-container text-on-surface shrink-0">
              <span className="text-sm sm:text-base leading-none">🔥</span>
              <span className="font-label-md text-xs sm:text-label-md font-semibold">
                {uniqueDaysLogged} {uniqueDaysLogged === 1 ? "Day" : "Days"}
                <span className="hidden sm:inline"> Streak</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-tertiary-container/15 text-tertiary min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>
              <span className="font-label-md text-xs sm:text-label-md font-semibold truncate">
                <span className="sm:hidden">{currentCefrObj.code}</span>
                <span className="hidden sm:inline">{currentCefrObj.label}</span>
              </span>
            </div>
            <span className="hidden xl:inline-block font-label-sm text-label-sm text-on-surface-variant">
              {displayUserLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "calendar-and-progress" && (
              <button
                type="button"
                onClick={handleStartNewWriting}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="font-label-lg text-label-lg hidden sm:inline">
                  New Writing
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Floating Top-Right Navigation Menu */}
        <div className="md:hidden">
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          <div className="fixed top-3 right-3 z-50 flex flex-col items-end">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              className="w-10 h-10 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:bg-primary-container transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">
                {isMobileMenuOpen ? "close" : "menu"}
              </span>
            </button>

            {isMobileMenuOpen && (
              <div className="mt-2 w-56 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl p-2 flex flex-col gap-1">
                {[
                  { id: "daily-practice", label: "Practice", icon: "edit_square" },
                  { id: "session-review", label: "Review", icon: "fact_check" },
                  { id: "journal-entries", label: "Journal", icon: "book_2" },
                  {
                    id: "calendar-and-progress",
                    label: "Calendar & Progress",
                    icon: "calendar_month",
                  },
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary text-on-primary font-semibold"
                          : "text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.icon}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}

                <div className="my-1 border-t border-outline-variant/30" />

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      logout
                    </span>
                    <span>Sign Out</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDarkMode((prev) => !prev)}
                    aria-label={
                      isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                    }
                    className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] block">
                      {isDarkMode ? "light_mode" : "dark_mode"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Container */}
        <main className="w-full pt-16 bg-surface px-4 sm:px-space-xl max-w-[1440px] mx-auto">
          {activeTab === "daily-practice" && (
            <DailyPracticeView
              selectedCefr={selectedCefr}
              onSelectCefr={handleSelectCefr}
              selectedFocusAreas={selectedFocusAreas}
              onSelectFocusAreas={handleSelectFocusAreas}
              selectedTopic={selectedTopic}
              onSelectTopic={handleSelectTopic}
              promptData={promptData}
              isGeneratingPrompt={isGeneratingPrompt}
              hasPendingPromptChanges={hasPendingPromptChanges}
              onGeneratePrompt={handleGeneratePrompt}
              essayTitle={essayTitle}
              onChangeTitle={setEssayTitle}
              userText={userText}
              onChangeUserText={setUserText}
              isEvaluating={isEvaluating}
              onEvaluate={handleEvaluate}
              onSaveDraft={handleSaveDraft}
              errorMessage={errorMessage}
            />
          )}

          {activeTab === "session-review" && (
            <SessionReviewView
              activeEntry={activeReviewEntry}
              dayEntries={journalEntries.filter(
                (e) =>
                  e.evaluation != null &&
                  e.dayOfMonth ===
                    (activeReviewEntry?.dayOfMonth ?? new Date().getDate())
              )}
              onSelectEntry={(entry) => {
                setActiveReviewEntry(entry);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onNavigateToPractice={() => setActiveTab("daily-practice")}
              onNavigateToJournal={() => setActiveTab("journal-entries")}
              onSaveQuizResult={handleSaveQuizResult}
            />
          )}

          {activeTab === "journal-entries" && (
            <JournalEntriesView
              entries={journalEntries}
              onSelectEntryForReview={handleSelectEntryForReview}
              onEditEntryInPractice={handleEditEntryInPractice}
              onDeleteEntry={handleDeleteEntry}
              onNewWriting={handleStartNewWriting}
            />
          )}

          {activeTab === "calendar-and-progress" && (
            <CalendarProgressView
              entries={journalEntries}
              currentCefr={currentCefrObj.code}
              onSelectEntryForReview={handleSelectEntryForReview}
              onStartWriting={handleStartNewWriting}
            />
          )}
        </main>
      </div>
    </div>
  );
}
