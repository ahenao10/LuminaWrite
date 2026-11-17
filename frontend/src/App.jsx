import React, { useEffect, useState } from "react";
import CalendarProgressView from "./components/CalendarProgressView";
import DailyPracticeView from "./components/DailyPracticeView";
import JournalEntriesView from "./components/JournalEntriesView";
import LoginView from "./components/LoginView";
import SessionReviewView from "./components/SessionReviewView";
import VocabularyPracticeView from "./components/VocabularyPracticeView";
import AppHeader from "./components/layout/AppHeader";
import AppSidebar from "./components/layout/AppSidebar";
import {
  API_BASE_URL,
  CEFR_FOCUS_AREAS,
  CEFR_LEVELS,
} from "./data/initialData";
import defaultPromptsByCefr from "./data/defaultPrompts.json";
import { getRandomDefaultQuizQuestions } from "./components/review/RetentionQuizCard";

function getRandomDefaultPrompt(cefrLevel = "B1") {
  const pool = defaultPromptsByCefr[cefrLevel] || defaultPromptsByCefr.B1 || [];
  if (pool.length === 0) return null;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return {
    topic: chosen.topic,
    suggested_title: chosen.suggested_title,
    question: chosen.question,
    min_words: Math.max(15, chosen.min_words || 15),
    tips: Array.isArray(chosen.tips) ? chosen.tips : [],
    isDefaultPrompt: true,
  };
}

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
  const now = new Date();
  const isToday =
    createdDate.getFullYear() === now.getFullYear() &&
    createdDate.getMonth() === now.getMonth() &&
    createdDate.getDate() === now.getDate();
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
    isToday,
    words: row.word_count || 0,
    status: statusLabel,
    user_text: row.original_text || "",
    entryType:
      row.rubric?.entry_type === "vocabulary" ||
      row.topic === "Vocabulary Practice"
        ? "vocabulary"
        : "writing",
    accuracy: row.rubric?.accuracy || null,
    vocabFeedback: row.rubric?.feedback || "",
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
    isDefaultPrompt: Boolean(row.rubric?.is_default_prompt),
    quizQuestions: Array.isArray(row.rubric?.quiz_questions)
      ? row.rubric.quiz_questions
      : null,
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
  const [promptData, setPromptData] = useState(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [hasPendingPromptChanges, setHasPendingPromptChanges] = useState(false);

  const [essayTitle, setEssayTitle] = useState("");
  const [userText, setUserText] = useState("");

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [latestEvaluation, setLatestEvaluation] = useState(null);

  const [journalEntries, setJournalEntries] = useState([]);
  const [activeReviewEntry, setActiveReviewEntry] = useState(null);

  // Vocabulary Practice state
  const [vocabCefr, setVocabCefr] = useState("B1");
  const [vocabFocusAreas, setVocabFocusAreas] = useState(
    () => CEFR_FOCUS_AREAS.B1 || []
  );
  const [hasPendingVocabChanges, setHasPendingVocabChanges] = useState(false);
  const [vocabItem, setVocabItem] = useState(null);
  const [isGeneratingVocab, setIsGeneratingVocab] = useState(false);
  const [vocabTranslation, setVocabTranslation] = useState("");
  const [isEvaluatingVocab, setIsEvaluatingVocab] = useState(false);
  const [vocabResult, setVocabResult] = useState(null);
  const [recentVocabItems, setRecentVocabItems] = useState([]);
  const [vocabError, setVocabError] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");

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
    const initialLevel = "B1";
    const initialFocus = CEFR_FOCUS_AREAS[initialLevel] || [];
    const initialPrompt = getRandomDefaultPrompt(initialLevel);
    setSelectedCefr(initialLevel);
    setSelectedFocusAreas(initialFocus);
    setVocabCefr(initialLevel);
    setVocabFocusAreas(initialFocus);
    setPromptData(initialPrompt);
    setEssayTitle(initialPrompt?.suggested_title || "");
    setUserText("");
    fetchEntriesFromDb(token);
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
    setPromptData(null);
    setEssayTitle("");
    setUserText("");
    setSelectedCefr("B1");
    setSelectedFocusAreas(CEFR_FOCUS_AREAS.B1 || []);
    setHasPendingPromptChanges(false);
    setVocabCefr("B1");
    setVocabFocusAreas(CEFR_FOCUS_AREAS.B1 || []);
    setHasPendingVocabChanges(false);
    setVocabItem(null);
    setVocabTranslation("");
    setVocabResult(null);
    setRecentVocabItems([]);
    setVocabError("");
    setActiveTab("daily-practice");
  };

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const body = {
        cefr_level: levelToUse,
        topic: topicToUse === "All Topics" ? null : topicToUse,
        focus_areas:
          isAllFocus || focusToUse.length === 0 ? null : focusToUse,
        previous_question: promptData?.question || null,
      };

      const res = await fetch(`${API_BASE_URL}/api/generate-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
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
        isDefaultPrompt: false,
      });
      setEssayTitle(recommendedTitle);
      setLatestEvaluation(null);
      setHasPendingPromptChanges(false);
    } catch (err) {
      setErrorMessage(
        err.name === "AbortError"
          ? "Request timed out while generating a prompt. Please try again."
          : err.message ||
              `Could not connect to backend at ${API_BASE_URL}. Make sure the API server is running.`
      );
    } finally {
      clearTimeout(timeoutId);
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

  const handleGenerateVocab = async (overrideLevel, overrideFocusAreas) => {
    const levelToUse =
      typeof overrideLevel === "string" ? overrideLevel : vocabCefr;
    const focusToUse = Array.isArray(overrideFocusAreas)
      ? overrideFocusAreas
      : vocabFocusAreas;
    const levelFocusOptions = CEFR_FOCUS_AREAS[levelToUse] || [];
    const isAllFocus =
      levelFocusOptions.length > 0 &&
      focusToUse.length >= levelFocusOptions.length;

    setIsGeneratingVocab(true);
    setVocabError("");
    setVocabTranslation("");
    setVocabResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/vocabulary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cefr_level: levelToUse,
          focus_areas:
            isAllFocus || focusToUse.length === 0 ? null : focusToUse,
          recent_items: recentVocabItems,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Server responded with status ${res.status}`
        );
      }
      const data = await res.json();
      setVocabItem(data);
      if (data.spanish_text) {
        setRecentVocabItems((prev) => [data.spanish_text, ...prev].slice(0, 12));
      }
      setHasPendingVocabChanges(false);
    } catch (err) {
      setVocabError(
        err.message || `Could not connect to backend at ${API_BASE_URL}.`
      );
    } finally {
      setIsGeneratingVocab(false);
    }
  };

  const handleSelectVocabCefr = (newLevel) => {
    if (newLevel === vocabCefr) return;
    const defaultFocus = CEFR_FOCUS_AREAS[newLevel] || [];
    setVocabCefr(newLevel);
    setVocabFocusAreas(defaultFocus);
    setHasPendingVocabChanges(true);
  };

  const handleSelectVocabFocusAreas = (nextFocus) => {
    setVocabFocusAreas(nextFocus);
    setHasPendingVocabChanges(true);
  };

  const handleEvaluateVocab = async (skipped = false) => {
    if (!vocabItem?.spanish_text) return;
    const trimmed = vocabTranslation.trim();
    if (!skipped && !trimmed) return;

    setIsEvaluatingVocab(true);
    setVocabError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/vocabulary/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          spanish_text: vocabItem.spanish_text,
          user_translation: trimmed,
          cefr_level: vocabCefr,
          focus_areas: vocabFocusAreas,
          skipped,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Server responded with status ${res.status}`
        );
      }
      const data = await res.json();
      setVocabResult({
        ...data,
        skipped,
        user_translation: trimmed,
      });

      const savedRow = data.saved_entry;
      const newEntry = savedRow
        ? mapDbEntryToUi(savedRow)
        : {
            id: `local-vocab-${Date.now()}`,
            promptId: `Vocab #${journalEntries.length + 1}`,
            title: `Vocab: ${vocabItem.spanish_text}`,
            topic: "Vocabulary Practice",
            question: vocabItem.spanish_text,
            date: "Just now",
            dayOfMonth: new Date().getDate(),
            isToday: true,
            words: trimmed ? trimmed.split(/\s+/).length : 0,
            status: "Reviewed",
            user_text: trimmed || "(Skipped — I don't know)",
            entryType: "vocabulary",
            accuracy: data.accuracy,
            vocabFeedback: data.feedback,
            evaluation: {
              score: data.score,
              cefr_level: vocabCefr,
              rubric: {
                entry_type: "vocabulary",
                accuracy: data.accuracy,
                feedback: data.feedback,
              },
              enhanced_text: data.expected_translation,
              corrections: [],
            },
          };

      setJournalEntries((prev) => [newEntry, ...prev]);
    } catch (err) {
      setVocabError(
        err.message || `Could not connect to backend at ${API_BASE_URL}.`
      );
    } finally {
      setIsEvaluatingVocab(false);
    }
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
          cefr_level: selectedCefr,
          focus_areas: selectedFocusAreas,
          is_default_prompt: Boolean(promptData?.isDefaultPrompt),
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
            isToday: true,
            words,
            status: "Reviewed",
            user_text: trimmed,
            evaluation: evalResult,
            isDefaultPrompt: Boolean(promptData?.isDefaultPrompt),
            quizQuestions: promptData?.isDefaultPrompt
              ? getRandomDefaultQuizQuestions(5)
              : null,
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
  };

  const handleGenerateEntryQuiz = async (entry) => {
    if (!entry) return;
    if (Array.isArray(entry.quizQuestions) && entry.quizQuestions.length > 0) {
      return;
    }

    // Default login prompts use the local 15-question JSON pool instead of calling the AI API
    if (entry.isDefaultPrompt) {
      const defaultQuestions = getRandomDefaultQuizQuestions(5);
      setJournalEntries((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? { ...item, quizQuestions: defaultQuestions }
            : item
        )
      );
      setActiveReviewEntry((prev) =>
        prev && prev.id === entry.id
          ? { ...prev, quizQuestions: defaultQuestions }
          : prev
      );
      return;
    }

    setIsGeneratingQuiz(true);
    setQuizError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          entry_id: String(entry.id || "").startsWith("local-") ||
            String(entry.id || "").startsWith("entry-")
            ? null
            : entry.id,
          prompt_question: entry.question || "",
          user_text: entry.user_text || "",
          enhanced_text: entry.evaluation?.enhanced_text || "",
          corrections: entry.evaluation?.corrections || [],
          cefr_level: entry.evaluation?.cefr_level || selectedCefr || "B1",
          topic: entry.topic || "General",
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Failed to generate quiz (${res.status}).`
        );
      }
      const data = await res.json();
      const generatedQuestions = Array.isArray(data.quiz_questions)
        ? data.quiz_questions
        : [];
      setJournalEntries((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? { ...item, quizQuestions: generatedQuestions }
            : item
        )
      );
      setActiveReviewEntry((prev) =>
        prev && prev.id === entry.id
          ? { ...prev, quizQuestions: generatedQuestions }
          : prev
      );
    } catch (err) {
      setQuizError(
        err.message || "Could not generate quiz questions. Please try again."
      );
    } finally {
      setIsGeneratingQuiz(false);
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
      promptData?.suggested_title ||
        `${promptData?.topic || "Writing Practice"} — ${selectedCefr} Essay`
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
    journalEntries
      .filter((e) => e.entryType !== "vocabulary" && e.evaluation != null)
      .map((e) => e.dayOfMonth)
      .filter(Boolean)
  ).size;
  const goalProgressPercent = Math.min(
    100,
    Math.round((uniqueDaysLogged / 5) * 100)
  );

  const displayUserLabel =
    userProfile?.display_name || currentUser?.email || "Learner";

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "vocabulary-practice") {
      handleGenerateVocab(vocabCefr, vocabFocusAreas);
    }
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

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface">
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        latestEvaluationScore={latestEvaluation?.score}
        journalCount={journalEntries.length}
        uniqueDaysLogged={uniqueDaysLogged}
        goalProgressPercent={goalProgressPercent}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="md:pl-64">
        <AppHeader
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          uniqueDaysLogged={uniqueDaysLogged}
          currentCefrObj={currentCefrObj}
          displayUserLabel={displayUserLabel}
          onStartNewWriting={handleStartNewWriting}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          onSignOut={handleSignOut}
        />

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

          {activeTab === "vocabulary-practice" && (
            <VocabularyPracticeView
              vocabItem={vocabItem}
              isGeneratingVocab={isGeneratingVocab}
              selectedCefr={vocabCefr}
              onSelectCefr={handleSelectVocabCefr}
              selectedFocusAreas={vocabFocusAreas}
              onSelectFocusAreas={handleSelectVocabFocusAreas}
              hasPendingChanges={hasPendingVocabChanges}
              onApplyOrRegenerate={() =>
                handleGenerateVocab(vocabCefr, vocabFocusAreas)
              }
              translationInput={vocabTranslation}
              onChangeTranslation={setVocabTranslation}
              isEvaluatingVocab={isEvaluatingVocab}
              vocabResult={vocabResult}
              onEvaluateVocab={() => handleEvaluateVocab(false)}
              onDontKnow={() => handleEvaluateVocab(true)}
              onContinue={() =>
                handleGenerateVocab(vocabCefr, vocabFocusAreas)
              }
              errorMessage={vocabError}
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
              onNavigateToVocabulary={() =>
                handleSelectTab("vocabulary-practice")
              }
              onNavigateToJournal={() => setActiveTab("journal-entries")}
              onSaveQuizResult={handleSaveQuizResult}
              onGenerateEntryQuiz={handleGenerateEntryQuiz}
              isGeneratingQuiz={isGeneratingQuiz}
              quizError={quizError}
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
