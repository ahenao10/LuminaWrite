import asyncio
import json
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

try:
    from backend.supabase_client import supabase_auth_request, supabase_rest_request
except ModuleNotFoundError:
    from supabase_client import supabase_auth_request, supabase_rest_request

# Load environment variables from backend/.env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
FALLBACK_MODEL_NAME = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite")

app = FastAPI(
    title="Lumina Write API",
    description="AI English Writing Lab Backend powered by FastAPI, Google GenAI, and Supabase",
    version="2.0.0",
)

# Enable CORS for local Vite dev server and Vercel production frontend
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://writelumina.vercel.app",
]
extra_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
ALLOWED_ORIGINS = list(dict.fromkeys(DEFAULT_ALLOWED_ORIGINS + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_genai_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured in backend/.env",
        )
    return genai.Client(api_key=api_key)


def load_system_prompt() -> str:
    prompt_path = BASE_DIR / "prompt.md"
    if not prompt_path.exists():
        raise HTTPException(
            status_code=500,
            detail="System instruction file backend/prompt.md not found.",
        )
    return prompt_path.read_text(encoding="utf-8")


async def generate_with_retry(
    client: genai.Client,
    contents: str,
    config: types.GenerateContentConfig,
):
    """Call Gemini with fast fallback on transient 503/429/404 errors."""
    models_to_try = [MODEL_NAME]
    for candidate in (FALLBACK_MODEL_NAME, "gemini-3.7-flash", "gemini-3.6-flash"):
        if candidate and candidate not in models_to_try:
            models_to_try.append(candidate)

    last_exc: Optional[Exception] = None
    for model_name in models_to_try:
        try:
            return await asyncio.to_thread(
                client.models.generate_content,
                model=model_name,
                contents=contents,
                config=config,
            )
        except Exception as exc:
            last_exc = exc
            err_str = str(exc).upper()
            is_retryable = (
                "503" in err_str
                or "UNAVAILABLE" in err_str
                or "429" in err_str
                or "RESOURCE_EXHAUSTED" in err_str
                or "HIGH DEMAND" in err_str
                or "404" in err_str
                or "NOT_FOUND" in err_str
            )
            if not is_retryable:
                raise
            await asyncio.sleep(0.3)

    if last_exc:
        raise last_exc
    raise RuntimeError("Gemini generation failed without an exception.")


def extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not isinstance(authorization, str):
        return None
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1].strip():
        return parts[1].strip()
    return None


def require_bearer_token(authorization: Optional[str]) -> str:
    token = extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization Bearer token.",
        )
    return token


# ==========================================
# Pydantic Schemas
# ==========================================

class AuthCredentialsRequest(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    target_cefr: Optional[str] = None
    daily_word_goal: Optional[int] = Field(default=None, ge=15, le=2000)


class GeneratePromptRequest(BaseModel):
    cefr_level: str = Field(
        default="B1",
        description="Target CEFR level (A1, A2, B1, B2, C1, C2)",
    )
    topic: Optional[str] = Field(
        default=None,
        description="Optional topic or theme for the writing prompt",
    )
    focus_areas: Optional[List[str]] = Field(
        default=None,
        description="Optional specific grammar or language skills to practice",
    )
    previous_question: Optional[str] = Field(
        default=None,
        description="Previous prompt question to avoid repeating",
    )


class GeneratePromptResponse(BaseModel):
    topic: str = Field(description="Short title or category of the writing topic in English")
    suggested_title: str = Field(
        description="A short, natural, engaging essay title in English matching the prompt and CEFR level"
    )
    question: str = Field(description="Engaging writing prompt question in English tailored to the CEFR level")
    min_words: int = Field(description="Recommended minimum word count (at least 15 words)")
    tips: List[str] = Field(
        description="3 practical writing tips (vocabulary, grammar, or discourse markers) in clear, simple English"
    )


class EvaluateRequest(BaseModel):
    prompt_question: str = Field(description="The writing prompt question answered by the user")
    user_text: str = Field(description="The original text submitted by the user")
    title: Optional[str] = Field(default=None, description="Optional essay title for saving")
    topic: Optional[str] = Field(default="General", description="Optional topic name for saving")


class RubricScores(BaseModel):
    grammar: int = Field(ge=0, le=100, description="Grammar and syntax accuracy score (0-100)")
    vocabulary: int = Field(ge=0, le=100, description="Vocabulary range and precision score (0-100)")
    cohesion: int = Field(ge=0, le=100, description="Cohesion, structure, and flow score (0-100)")
    task_achievement: int = Field(ge=0, le=100, description="Task achievement and relevance score (0-100)")


class CorrectionItem(BaseModel):
    original_snippet: str = Field(
        description="EXACT character-by-character substring from user_text containing the error or weak phrasing"
    )
    corrected_snippet: str = Field(
        description="EXACT character-by-character substring from enhanced_text that replaces original_snippet"
    )
    explanation: str = Field(
        description="Clear, simple, and concise explanation in English of why it was corrected"
    )
    category: str = Field(
        description="Category of correction: Grammar, Vocabulary, Spelling, Punctuation, Cohesion, or Style"
    )


class EvaluateAISchema(BaseModel):
    score: int = Field(ge=0, le=100, description="Overall writing score from 0 to 100")
    cefr_level: Literal["A1", "A2", "B1", "B2", "C1", "C2"] = Field(
        description="Detected CEFR proficiency level of the submission"
    )
    rubric: RubricScores
    enhanced_text: str = Field(
        description="Full corrected and polished version of the user's text"
    )
    corrections: List[CorrectionItem] = Field(
        description="List of specific character-exact corrections between user_text and enhanced_text"
    )


class EvaluateResponse(EvaluateAISchema):
    saved_entry: Optional[Dict[str, Any]] = Field(
        default=None,
        description="The persisted Supabase writing_entries row if authenticated",
    )


class CreateEntryRequest(BaseModel):
    title: Optional[str] = None
    topic: str = "General"
    prompt_question: str
    original_text: str
    enhanced_text: Optional[str] = None
    word_count: int = 0
    score: Optional[int] = Field(default=None, ge=0, le=100)
    cefr_level: Optional[str] = None
    rubric: Optional[Dict[str, Any]] = None
    corrections: Optional[List[Dict[str, Any]]] = None
    status: Literal["draft", "reviewed", "perfected"] = "draft"


# ==========================================
# Health & Status
# ==========================================

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "supabase_url": os.getenv("SUPABASE_URL", ""),
    }


# ==========================================
# Supabase Authentication & Profile Endpoints
# ==========================================

async def _fetch_or_create_profile(user: Dict[str, Any], access_token: str) -> Dict[str, Any]:
    user_id = user.get("id")
    if not user_id:
        return {}
    rows = await supabase_rest_request(
        "GET",
        f"profiles?id=eq.{user_id}&select=*",
        access_token=access_token,
    )
    if isinstance(rows, list) and len(rows) > 0:
        return rows[0]

    display_name = (
        (user.get("user_metadata") or {}).get("display_name")
        or (user.get("email") or "Learner").split("@")[0]
    )
    created = await supabase_rest_request(
        "POST",
        "profiles",
        access_token=access_token,
        body={
            "id": user_id,
            "display_name": display_name,
            "target_cefr": "B1",
            "daily_word_goal": 150,
        },
        prefer="return=representation",
    )
    if isinstance(created, list) and len(created) > 0:
        return created[0]
    return {}


@app.post("/api/auth/signup")
async def signup(payload: AuthCredentialsRequest):
    display_name = (
        payload.display_name.strip()
        if payload.display_name and payload.display_name.strip()
        else payload.email.split("@")[0]
    )
    res = await supabase_auth_request(
        "POST",
        "/signup",
        body={
            "email": payload.email.strip(),
            "password": payload.password,
            "data": {"display_name": display_name},
        },
    )
    access_token = res.get("access_token")
    user = res.get("user") or {}
    profile = None
    if access_token and user.get("id"):
        try:
            profile = await _fetch_or_create_profile(user, access_token)
        except Exception:
            profile = None

    return {
        "access_token": access_token,
        "refresh_token": res.get("refresh_token"),
        "user": user,
        "profile": profile,
        "requires_email_confirmation": access_token is None,
    }


@app.post("/api/auth/login")
async def login(payload: AuthCredentialsRequest):
    res = await supabase_auth_request(
        "POST",
        "/token?grant_type=password",
        body={
            "email": payload.email.strip(),
            "password": payload.password,
        },
    )
    access_token = res.get("access_token")
    user = res.get("user") or {}
    profile = None
    if access_token and user.get("id"):
        profile = await _fetch_or_create_profile(user, access_token)

    return {
        "access_token": access_token,
        "refresh_token": res.get("refresh_token"),
        "user": user,
        "profile": profile,
    }


@app.post("/api/auth/logout")
async def logout(authorization: Optional[str] = Header(default=None)):
    token = extract_bearer_token(authorization)
    if token:
        try:
            await supabase_auth_request("POST", "/logout", access_token=token)
        except Exception:
            pass
    return {"status": "logged_out"}


@app.get("/api/auth/me")
async def get_me(authorization: Optional[str] = Header(default=None)):
    token = require_bearer_token(authorization)
    user = await supabase_auth_request("GET", "/user", access_token=token)
    profile = await _fetch_or_create_profile(user, token)
    return {"user": user, "profile": profile}


@app.patch("/api/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    authorization: Optional[str] = Header(default=None),
):
    token = require_bearer_token(authorization)
    user = await supabase_auth_request("GET", "/user", access_token=token)
    user_id = user.get("id")
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        return await _fetch_or_create_profile(user, token)
    updated = await supabase_rest_request(
        "PATCH",
        f"profiles?id=eq.{user_id}",
        access_token=token,
        body=updates,
        prefer="return=representation",
    )
    return updated[0] if isinstance(updated, list) and updated else updated


# ==========================================
# Supabase Writing Entries CRUD
# ==========================================

@app.get("/api/entries")
async def list_entries(authorization: Optional[str] = Header(default=None)):
    token = require_bearer_token(authorization)
    rows = await supabase_rest_request(
        "GET",
        "writing_entries?select=*&order=created_at.desc",
        access_token=token,
    )
    return {"entries": rows if isinstance(rows, list) else []}


@app.post("/api/entries")
async def create_entry(
    payload: CreateEntryRequest,
    authorization: Optional[str] = Header(default=None),
):
    token = require_bearer_token(authorization)
    user = await supabase_auth_request("GET", "/user", access_token=token)
    user_id = user.get("id")

    record = {
        "user_id": user_id,
        "title": payload.title or payload.topic or "Untitled Draft",
        "topic": payload.topic,
        "prompt_question": payload.prompt_question,
        "original_text": payload.original_text,
        "enhanced_text": payload.enhanced_text,
        "word_count": payload.word_count,
        "score": payload.score,
        "cefr_level": payload.cefr_level,
        "rubric": payload.rubric,
        "corrections": payload.corrections,
        "status": payload.status,
    }
    created = await supabase_rest_request(
        "POST",
        "writing_entries",
        access_token=token,
        body=record,
        prefer="return=representation",
    )
    entry = created[0] if isinstance(created, list) and created else created
    return {"entry": entry}


class UpdateEntryQuizRequest(BaseModel):
    correct: int = Field(ge=0)
    total: int = Field(ge=1)
    answered: int = Field(ge=0)
    answers: Dict[str, str] = Field(default_factory=dict)
    checked: Dict[str, bool] = Field(default_factory=dict)


@app.delete("/api/entries/{entry_id}")
async def delete_entry(
    entry_id: str,
    authorization: Optional[str] = Header(default=None),
):
    token = require_bearer_token(authorization)
    user = await supabase_auth_request("GET", "/user", access_token=token)
    user_id = user.get("id")
    await supabase_rest_request(
        "DELETE",
        f"writing_entries?id=eq.{entry_id}&user_id=eq.{user_id}",
        access_token=token,
    )
    return {"deleted": True, "id": entry_id}


@app.patch("/api/entries/{entry_id}/quiz")
async def update_entry_quiz(
    entry_id: str,
    payload: UpdateEntryQuizRequest,
    authorization: Optional[str] = Header(default=None),
):
    token = require_bearer_token(authorization)
    user = await supabase_auth_request("GET", "/user", access_token=token)
    user_id = user.get("id")

    existing_rows = await supabase_rest_request(
        "GET",
        f"writing_entries?id=eq.{entry_id}&user_id=eq.{user_id}&select=id,rubric",
        access_token=token,
    )
    if not isinstance(existing_rows, list) or len(existing_rows) == 0:
        raise HTTPException(status_code=404, detail="Writing entry not found.")

    current_rubric = existing_rows[0].get("rubric")
    updated_rubric = dict(current_rubric) if isinstance(current_rubric, dict) else {}
    updated_rubric["quiz_result"] = {
        "correct": payload.correct,
        "total": payload.total,
        "answered": payload.answered,
        "answers": payload.answers,
        "checked": payload.checked,
    }

    updated = await supabase_rest_request(
        "PATCH",
        f"writing_entries?id=eq.{entry_id}&user_id=eq.{user_id}",
        access_token=token,
        body={"rubric": updated_rubric},
        prefer="return=representation",
    )
    entry = updated[0] if isinstance(updated, list) and updated else updated
    return {"entry": entry}


# ==========================================
# AI Prompt Generation & Evaluation Endpoints
# ==========================================

@app.post("/api/generate-prompt", response_model=GeneratePromptResponse)
async def generate_prompt(payload: GeneratePromptRequest):
    client = get_genai_client()
    level = payload.cefr_level.strip().upper()
    topic_clean = payload.topic.strip() if payload.topic else ""
    if topic_clean.lower() in ("daily lifestyle", "lifestyle"):
        topic_instruction = (
            "focusing on 'Daily Lifestyle' — ask a natural, relatable question where the learner can talk about "
            "their daily routine, what they did earlier today, what they are doing right now, or what they plan to do later today"
        )
    elif topic_clean:
        topic_instruction = f"focusing on the topic '{topic_clean}'"
    else:
        topic_instruction = (
            "choosing an engaging, relevant modern topic (e.g., Daily Lifestyle, Work & Career, Technology, Travel, Culture, Environment, or Education)"
        )

    system_instruction = (
        "You are an expert English Writing Professor designing a daily writing prompt for an English learner. "
        "All fields in your response (topic, suggested_title, question, tips) MUST be written in clear, natural English. "
        "Tailor the complexity of the question and the suggested vocabulary/grammar tips to the requested CEFR level. "
        "Set min_words to 15 as the minimum required words to submit, while encouraging a full response."
    )

    focus_list = [f.strip() for f in (payload.focus_areas or []) if f and f.strip() and f.strip().upper() != "ALL"]
    focus_instruction = (
        f"\n- Target practice focus: Design the prompt and tips so the learner naturally practices: {', '.join(focus_list)}."
        if focus_list
        else ""
    )
    random_seed = random.randint(1000, 99999)
    angles = [
        "a recent personal experience",
        "a practical everyday decision",
        "a change in habits or routine",
        "comparing two real-life options",
        "a memorable conversation or moment",
        "a future plan or personal goal",
        "an unexpected challenge and how to handle it",
        "a favorite place, activity, or tradition",
    ]
    chosen_angle = random.choice(angles)
    avoid_prev = (
        f"\n- Do NOT repeat or closely paraphrase this previous question: {payload.previous_question.strip()}"
        if payload.previous_question and payload.previous_question.strip()
        else ""
    )

    user_prompt = (
        f"[Variation Seed #{random_seed}] Create a fresh, distinct daily English writing prompt for CEFR Level {level}, "
        f"{topic_instruction}, framed around {chosen_angle}.{focus_instruction}{avoid_prev}\n"
        f"- 'topic': A concise, editorial-style topic category in English.\n"
        f"- 'suggested_title': A short, natural, engaging essay title in English (3 to 7 words) that fits this prompt and level {level}.\n"
        f"- 'question': A clear, thought-provoking writing prompt question suitable for level {level}.\n"
        f"- 'min_words': Set to 15.\n"
        f"- 'tips': Exactly 3 actionable writing tips in simple English (e.g., useful connectors, target grammar structures, or key vocabulary for this prompt)."
    )

    try:
        response = await generate_with_retry(
            client=client,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=GeneratePromptResponse,
                temperature=0.95,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        if not response.text:
            raise ValueError("Empty response from Gemini model.")
        data = json.loads(response.text)
        return GeneratePromptResponse(**data)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate writing prompt: {str(exc)}",
        ) from exc


@app.post("/api/evaluate", response_model=EvaluateResponse)
async def evaluate_writing(
    payload: EvaluateRequest,
    authorization: Optional[str] = Header(default=None),
):
    user_text = payload.user_text.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="user_text cannot be empty.")

    client = get_genai_client()
    system_instruction = load_system_prompt()

    evaluation_input = (
        f"### Writing Prompt Question:\n{payload.prompt_question}\n\n"
        f"### Student's Original Text (`user_text`):\n{user_text}\n\n"
        "### Reminder of Critical Rules:\n"
        "1. Every `original_snippet` MUST be an exact, character-by-character substring of `user_text` above.\n"
        "2. Every `corrected_snippet` MUST be an exact, character-by-character substring of your `enhanced_text`.\n"
        "3. Every `explanation` MUST be in simple, clear, and concise English."
    )

    try:
        response = await generate_with_retry(
            client=client,
            contents=evaluation_input,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=EvaluateAISchema,
                temperature=0.2,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        if not response.text:
            raise ValueError("Empty response from Gemini model.")
        data = json.loads(response.text)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate writing: {str(exc)}",
        ) from exc

    saved_entry = None
    token = extract_bearer_token(authorization)
    if token:
        try:
            user = await supabase_auth_request("GET", "/user", access_token=token)
            user_id = user.get("id")
            if user_id:
                word_count = len(user_text.split())
                record = {
                    "user_id": user_id,
                    "title": payload.title or payload.topic or "Writing Practice",
                    "topic": payload.topic or "General",
                    "prompt_question": payload.prompt_question,
                    "original_text": user_text,
                    "enhanced_text": data.get("enhanced_text"),
                    "word_count": word_count,
                    "score": data.get("score"),
                    "cefr_level": data.get("cefr_level"),
                    "rubric": data.get("rubric"),
                    "corrections": data.get("corrections"),
                    "status": "reviewed",
                }
                created = await supabase_rest_request(
                    "POST",
                    "writing_entries",
                    access_token=token,
                    body=record,
                    prefer="return=representation",
                )
                if isinstance(created, list) and created:
                    saved_entry = created[0]
        except Exception as db_exc:
            # Don't fail the AI evaluation if DB persistence fails; log to stderr
            print(f"Warning: failed to persist evaluated entry to Supabase: {db_exc}")

    return EvaluateResponse(**data, saved_entry=saved_entry)


# ==========================================
# Vocabulary Practice Endpoints (ES -> EN)
# ==========================================

class VocabGenerateRequest(BaseModel):
    cefr_level: str = Field(default="B1")
    focus_areas: Optional[List[str]] = Field(default=None)
    recent_items: Optional[List[str]] = Field(default=None)


class VocabGenerateResponse(BaseModel):
    spanish_text: str = Field(description="Word, expression, or short phrase in Spanish")
    item_type: Literal["word", "expression", "phrase"] = Field(
        description="Whether the item is a single word, expression, or short phrase"
    )
    hint: str = Field(description="Brief context hint in simple English without revealing the translation")
    cefr_level: str


class VocabEvaluateRequest(BaseModel):
    spanish_text: str
    user_translation: str = Field(default="")
    cefr_level: str = Field(default="B1")
    focus_areas: Optional[List[str]] = Field(default=None)
    skipped: bool = Field(default=False)


class VocabEvaluateAISchema(BaseModel):
    score: int = Field(ge=0, le=100)
    expected_translation: str = Field(description="Natural English translation of the Spanish text")
    feedback: str = Field(description="Brief, clear explanation in simple English")


class VocabEvaluateResponse(VocabEvaluateAISchema):
    accuracy: Literal["low", "medium", "standard", "high"]
    saved_entry: Optional[Dict[str, Any]] = None


def compute_accuracy_tier(score: int) -> Literal["low", "medium", "standard", "high"]:
    if score >= 85:
        return "high"
    if score >= 65:
        return "standard"
    if score >= 40:
        return "medium"
    return "low"


@app.post("/api/vocabulary/generate", response_model=VocabGenerateResponse)
async def generate_vocabulary_item(payload: VocabGenerateRequest):
    client = get_genai_client()
    level = payload.cefr_level.strip().upper() or "B1"
    focus_list = [
        f.strip()
        for f in (payload.focus_areas or [])
        if f and f.strip() and f.strip().upper() != "ALL"
    ]
    focus_instruction = (
        f" that specifically practices: {', '.join(focus_list)}"
        if focus_list
        else ""
    )
    default_avoid = ["Echar de menos", "Echar una mano", "Estar sin blanca"]
    recent = [r.strip() for r in (payload.recent_items or []) if r and r.strip()][:12]
    all_avoid = list(dict.fromkeys(default_avoid + recent))
    avoid_instruction = (
        f"\nDo NOT use or repeat any of these Spanish items: {', '.join(all_avoid)}."
    )

    target_type = random.choice(["word", "expression", "phrase"])
    themes = [
        "travel and transportation",
        "work and career",
        "technology and communication",
        "food and cooking",
        "health and well-being",
        "friendship and social life",
        "nature and environment",
        "shopping and money",
        "hobbies and leisure",
        "education and learning",
        "feelings and emotions",
        "daily routines",
        "time and scheduling",
        "weather and seasons",
        "home and living",
        "problem-solving and decisions",
    ]
    chosen_theme = random.choice(themes)
    random_seed = random.randint(1000, 99999)

    system_instruction = (
        "You are an expert bilingual English-Spanish language coach. "
        "Generate ONE meaningful, practical, everyday Spanish word, expression, or short phrase that makes clear sense to a learner for translating into modern, natural English. "
        "Avoid obscure, dated, overly regional, or nonsensical idioms (such as 'estar sin blanca'). "
        "Match the difficulty to the requested CEFR level and focus areas. "
        "The 'hint' must be in simple, neutral English and give context WITHOUT giving away the English translation."
    )
    user_prompt = (
        f"[Variation Seed #{random_seed}] Generate a Spanish {target_type} related to '{chosen_theme}' "
        f"for CEFR Level {level}{focus_instruction}.{avoid_instruction}\n"
        f"- 'spanish_text': Natural Spanish {target_type}.\n"
        f"- 'item_type': '{target_type}'.\n"
        f"- 'hint': Short context hint in simple English.\n"
        f"- 'cefr_level': '{level}'."
    )

    try:
        response = await generate_with_retry(
            client=client,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=VocabGenerateResponse,
                temperature=1.0,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        if not response.text:
            raise ValueError("Empty response from Gemini model.")
        data = json.loads(response.text)
        data["cefr_level"] = level
        return VocabGenerateResponse(**data)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate vocabulary item: {str(exc)}",
        ) from exc


@app.post("/api/vocabulary/evaluate", response_model=VocabEvaluateResponse)
async def evaluate_vocabulary_item(
    payload: VocabEvaluateRequest,
    authorization: Optional[str] = Header(default=None),
):
    client = get_genai_client()
    level = payload.cefr_level.strip().upper() or "B1"
    user_translation = payload.user_translation.strip()

    if not payload.skipped and not user_translation:
        raise HTTPException(
            status_code=400,
            detail="Please enter an English translation or click 'I don't know'.",
        )

    if payload.skipped:
        system_instruction = (
            "You are a supportive English coach. The learner skipped translating a Spanish item into English. "
            "Provide the most common, modern, natural English translation accepted by standard English academies "
            "(avoid dated idioms like 'to rain cats and dogs'; prefer everyday phrasing like \"It's pouring\" or \"It's pouring down\"), "
            "and a short, clear explanation in simple English. Set score to 0."
        )
        user_prompt = (
            f"Spanish text (CEFR {level}): {payload.spanish_text}\n"
            "Return score = 0, expected_translation (common, modern, natural English), and brief feedback explaining its meaning and usage."
        )
    else:
        system_instruction = (
            "You are an accurate, fair English-Spanish translation evaluator for English learners. "
            "Grade how accurately and naturally the learner translated the Spanish text into English on a 0-100 scale. "
            "Accept valid synonymous translations when natural and accurate. For expected_translation, always provide "
            "common, modern, everyday English accepted by standard English academies (avoid dated idioms like 'to rain cats and dogs'; "
            "prefer natural phrasing like \"It's pouring\"). Keep feedback concise, neutral, and easy to understand."
        )
        user_prompt = (
            f"CEFR Level: {level}\n"
            f"Spanish text: {payload.spanish_text}\n"
            f"Learner's English translation: {user_translation}\n"
            "Return score (0-100), expected_translation (most natural English version), and concise feedback."
        )

    try:
        response = await generate_with_retry(
            client=client,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=VocabEvaluateAISchema,
                temperature=0.2,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        if not response.text:
            raise ValueError("Empty response from Gemini model.")
        data = json.loads(response.text)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate vocabulary translation: {str(exc)}",
        ) from exc

    score = 0 if payload.skipped else max(0, min(100, int(data.get("score", 0))))
    accuracy = compute_accuracy_tier(score)
    expected_translation = data.get("expected_translation", "")
    feedback = data.get("feedback", "")

    saved_entry = None
    token = extract_bearer_token(authorization)
    if token:
        try:
            user = await supabase_auth_request("GET", "/user", access_token=token)
            user_id = user.get("id")
            if user_id:
                word_count = len(user_translation.split()) if user_translation else 0
                record = {
                    "user_id": user_id,
                    "title": f"Vocab: {payload.spanish_text[:60]}",
                    "topic": "Vocabulary Practice",
                    "prompt_question": payload.spanish_text,
                    "original_text": user_translation or "(Skipped — I don't know)",
                    "enhanced_text": expected_translation,
                    "word_count": word_count,
                    "score": score,
                    "cefr_level": level,
                    "rubric": {
                        "entry_type": "vocabulary",
                        "accuracy": accuracy,
                        "feedback": feedback,
                        "skipped": payload.skipped,
                    },
                    "corrections": [],
                    "status": "reviewed",
                }
                created = await supabase_rest_request(
                    "POST",
                    "writing_entries",
                    access_token=token,
                    body=record,
                    prefer="return=representation",
                )
                if isinstance(created, list) and created:
                    saved_entry = created[0]
        except Exception as db_exc:
            print(f"Warning: failed to persist vocabulary entry to Supabase: {db_exc}")

    return VocabEvaluateResponse(
        score=score,
        accuracy=accuracy,
        expected_translation=expected_translation,
        feedback=feedback,
        saved_entry=saved_entry,
    )
