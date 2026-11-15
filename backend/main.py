import asyncio
import json
import os
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
    await supabase_rest_request(
        "DELETE",
        f"writing_entries?id=eq.{entry_id}",
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
    await supabase_auth_request("GET", "/user", access_token=token)

    existing_rows = await supabase_rest_request(
        "GET",
        f"writing_entries?id=eq.{entry_id}&select=id,rubric",
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
        f"writing_entries?id=eq.{entry_id}",
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

    user_prompt = (
        f"Create a daily English writing prompt for CEFR Level {level}, {topic_instruction}.{focus_instruction}\n"
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
                temperature=0.75,
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
