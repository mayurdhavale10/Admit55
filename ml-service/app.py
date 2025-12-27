#!/usr/bin/env python3
"""
app.py — FastAPI wrapper for:
- ProfileResumeTool (MBA resume analysis pipeline; modularized under pipeline/tools/profileresumetool)
- B-School Match Pipeline
- Resume Writer Pipeline

Deployed on Render.com
"""

import os
import sys
import json
import tempfile
import traceback  # ✅ NEW
from typing import Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ------------------------------------------------------------
# Path setup (so `pipeline/...` imports work on Render/local)
# ------------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, BASE_DIR)

# ------------------------------------------------------------
# Imports: ProfileResumeTool (NEW modular path)
# ------------------------------------------------------------
PIPELINE_VERSION = "unknown"
PDF_SUPPORT = False

PROFILE_PIPELINE_AVAILABLE = False  # ✅ NEW: track availability

try:
    # NEW: modularized tool path
    from pipeline.tools.profileresumetool import run_pipeline as run_profile_pipeline
    from pipeline.tools.profileresumetool import PIPELINE_VERSION as PROFILE_PIPELINE_VERSION

    PIPELINE_VERSION = str(PROFILE_PIPELINE_VERSION)
    PROFILE_PIPELINE_AVAILABLE = True
    print(f"[IMPORT] ✅ ProfileResumeTool v{PIPELINE_VERSION} loaded", file=sys.stderr)

except Exception as e:
    print(f"[IMPORT ERROR] profileresumetool pipeline: {repr(e)}", file=sys.stderr)
    print("[IMPORT ERROR] ---- FULL TRACEBACK (profileresumetool) ----", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)  # ✅ NEW: prints file + line number
    print("[IMPORT ERROR] ------------------------------------------", file=sys.stderr)
    print(f"[DEBUG] CWD: {os.getcwd()}", file=sys.stderr)
    print(f"[DEBUG] BASE_DIR: {BASE_DIR}", file=sys.stderr)
    print(f"[DEBUG] sys.path: {sys.path}", file=sys.stderr)

    # LAST resort fallback (if your old single-file pipeline still exists)
    try:
        from pipeline.mba_hybrid_pipeline import run_pipeline as run_profile_pipeline  # type: ignore
        PIPELINE_VERSION = "legacy-mba_hybrid_pipeline"
        PROFILE_PIPELINE_AVAILABLE = True
        print("[IMPORT] ⚠️  Using legacy pipeline", file=sys.stderr)

    except Exception as e2:
        print(f"[IMPORT ERROR] legacy mba_hybrid_pipeline: {repr(e2)}", file=sys.stderr)
        print("[IMPORT ERROR] ---- FULL TRACEBACK (legacy mba_hybrid_pipeline) ----", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)  # ✅ NEW
        print("[IMPORT ERROR] -----------------------------------------------------", file=sys.stderr)

        def run_profile_pipeline(*args, **kwargs):
            raise HTTPException(500, "ProfileResumeTool pipeline not available")


# ------------------------------------------------------------
# Imports: LLM Settings (prefer core/settings.py if present)
# ------------------------------------------------------------
def _fallback_env_default_settings() -> Dict[str, Any]:
    provider = (os.getenv("LLM_PROVIDER") or "").strip().lower()

    groq_key = os.getenv("GROQ_API_KEY", "")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_base = os.getenv("GROQ_API_URL") or "https://api.groq.com/openai/v1"

    openai_key = os.getenv("OPENAI_API_KEY", "")
    openai_model = os.getenv("OPENAI_PRIMARY_MODEL", "gpt-4o-mini")
    openai_base = os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    gem_key = os.getenv("GEMINI_API_KEY", "")
    gem_model = os.getenv("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")

    if provider == "groq" and groq_key:
        return {"provider": "groq", "api_key": groq_key, "model": groq_model, "base_url": groq_base}
    if provider == "openai" and openai_key:
        return {"provider": "openai", "api_key": openai_key, "model": openai_model, "base_url": openai_base}
    if provider == "gemini" and gem_key:
        return {"provider": "gemini", "api_key": gem_key, "model": gem_model, "base_url": None}

    if groq_key:
        return {"provider": "groq", "api_key": groq_key, "model": groq_model, "base_url": groq_base}
    if openai_key:
        return {"provider": "openai", "api_key": openai_key, "model": openai_model, "base_url": openai_base}
    if gem_key:
        return {"provider": "gemini", "api_key": gem_key, "model": gem_model, "base_url": None}

    return {"provider": "groq", "api_key": "", "model": groq_model, "base_url": groq_base}


try:
    from pipeline.core.settings import LLMSettings, env_default_settings  # type: ignore
    print("[IMPORT] ✅ Using pipeline.core.settings", file=sys.stderr)
except Exception:
    LLMSettings = None  # type: ignore
    print("[IMPORT] ⚠️  Using fallback settings", file=sys.stderr)

    def env_default_settings():  # type: ignore
        return _fallback_env_default_settings()


# ------------------------------------------------------------
# Imports: other pipelines (unchanged)
# ------------------------------------------------------------
try:
    from pipeline.bschool_match_pipeline import run_bschool_match
    print("[IMPORT] ✅ B-school match pipeline loaded", file=sys.stderr)
except Exception as e:
    print(f"[IMPORT ERROR] bschool_match_pipeline: {repr(e)}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

    def run_bschool_match(*args, **kwargs):
        raise HTTPException(500, "B-school match pipeline not available")


try:
    from pipeline.resume_writer_pipeline import generate_resume
    print("[IMPORT] ✅ Resume writer pipeline loaded", file=sys.stderr)
except Exception as e:
    print(f"[IMPORT ERROR] resume_writer_pipeline: {repr(e)}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

    def generate_resume(*args, **kwargs):
        raise HTTPException(500, "Resume writer pipeline not available")


# ------------------------------------------------------------
# Optional PDF extraction
# ------------------------------------------------------------
try:
    import PyPDF2  # type: ignore

    PDF_SUPPORT = True

    def extract_text_from_pdf(pdf_path: str) -> str:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            out = []
            for page in reader.pages:
                out.append(page.extract_text() or "")
            return "\n".join(out).strip()

    print("[IMPORT] ✅ PDF support enabled (PyPDF2)", file=sys.stderr)
except Exception:
    PDF_SUPPORT = False
    print("[IMPORT] ⚠️  PDF support disabled (PyPDF2 not installed)", file=sys.stderr)

    def extract_text_from_pdf(pdf_path: str) -> str:
        raise HTTPException(status_code=500, detail="PDF support not available (PyPDF2 not installed)")


# ------------------------------------------------------------
# Pydantic models
# ------------------------------------------------------------
class AnalyzeTextRequest(BaseModel):
    resume_text: str
    discovery_answers: Optional[Dict[str, str]] = None


# ------------------------------------------------------------
# FastAPI app
# ------------------------------------------------------------
APP_VERSION = PIPELINE_VERSION

app = FastAPI(
    title="MBA Tools API",
    description="AI-powered resume analysis + B-school match + resume writer for MBA admissions",
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "MBA Tools",
        "version": APP_VERSION,
        "profile_resume_tool_version": PIPELINE_VERSION,
        "profile_pipeline_available": PROFILE_PIPELINE_AVAILABLE,  # ✅ NEW
        "endpoints": {
            "analyze": "POST /analyze",
            "bschool_match": "POST /bschool-match",
            "resumewriter": "POST /resumewriter",
            "health": "GET /health",
            "test": "POST /test",
        },
    }


@app.get("/health")
async def health():
    settings = env_default_settings()
    provider = getattr(settings, "provider", None) or (settings.get("provider") if isinstance(settings, dict) else None)
    model = getattr(settings, "model", None) or (settings.get("model") if isinstance(settings, dict) else None)

    return {
        "status": "healthy",
        "pdf_support": PDF_SUPPORT,
        "profile_resume_tool_version": PIPELINE_VERSION,
        "profile_pipeline_available": PROFILE_PIPELINE_AVAILABLE,  # ✅ NEW
        "llm": {
            "provider": provider,
            "model": model,
            "groq_configured": bool(os.getenv("GROQ_API_KEY")),
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
            "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        },
        "pipelines": {
            "profileresumetool": PROFILE_PIPELINE_AVAILABLE,  # ✅ FIX: truthful
            "bschool_match": True,
            "resume_writer": True,
        },
        "features": {
            "narrative": False,
            "multi_provider": True,
            "context_aware": True,
            "modular_architecture": True,
            "consultant_mode": True,
            "discovery_questions": True,
        },
    }


# ============================================================
# /analyze — ProfileResumeTool with Discovery Context
# ============================================================
@app.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    discovery_answers: Optional[str] = Form(None),
    context: Optional[str] = Form(None),
):
    if not file and not resume_text:
        raise HTTPException(status_code=400, detail="Provide either 'file' (PDF) or 'resume_text'")

    if file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                content = await file.read()
                tmp.write(content)
                tmp_path = tmp.name

            print(f"[API] Saved PDF to: {tmp_path}", file=sys.stderr)

            try:
                resume_text = extract_text_from_pdf(tmp_path)
                print(f"[API] Extracted {len(resume_text)} characters from PDF", file=sys.stderr)
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Failed to extract text from PDF: {str(e)}")
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

    resume_text = (resume_text or "").strip()
    if len(resume_text) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short (min 50 chars)")

    if len(resume_text) > 50000:
        print(f"[API] Truncating resume from {len(resume_text)} to 50000 chars", file=sys.stderr)
        resume_text = resume_text[:50000]

    discovery_dict: Optional[Dict[str, str]] = None

    if discovery_answers:
        try:
            parsed = json.loads(discovery_answers)
            if isinstance(parsed, dict):
                discovery_dict = parsed
                print(f"[API] ✅ Received discovery answers: {list(discovery_dict.keys())}", file=sys.stderr)
        except Exception as e:
            print(f"[API] ⚠️  Invalid discovery_answers JSON, ignoring: {str(e)}", file=sys.stderr)

    if not discovery_dict and context:
        try:
            parsed = json.loads(context)
            if isinstance(parsed, dict):
                discovery_dict = parsed
                print(f"[API] ℹ️  Using legacy context field: {list(discovery_dict.keys())}", file=sys.stderr)
        except Exception as e:
            print(f"[API] Invalid context JSON, ignoring: {str(e)}", file=sys.stderr)

    try:
        print(f"[API] Starting analysis for {len(resume_text)} character resume", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(f"MBA RESUME ANALYSIS PIPELINE v{PIPELINE_VERSION}", file=sys.stderr)
        print("🎯 MODE: CONSULTANT" if discovery_dict else "📊 MODE: GENERIC", file=sys.stderr)
        print("=" * 60, file=sys.stderr)

        settings = env_default_settings()

        if isinstance(settings, dict):
            prov = settings.get("provider", "unknown")
            mod = settings.get("model", "unknown")
        else:
            prov = getattr(settings, "provider", "unknown")
            mod = getattr(settings, "model", "unknown")

        print(f"[API] Using provider: {prov}, model: {mod}", file=sys.stderr)

        result = run_profile_pipeline(
            resume_text=resume_text,
            settings=settings,
            fallback=None,
            discovery_answers=discovery_dict,
        )

        print("[API] ✅ Analysis complete", file=sys.stderr)
        return result

    except Exception as e:
        print(f"[API] ❌ Analysis failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Analysis pipeline failed: {str(e)}")


@app.post("/analyze-json")
async def analyze_resume_json(request: AnalyzeTextRequest):
    resume_text = request.resume_text.strip()

    if len(resume_text) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short (min 50 chars)")

    if len(resume_text) > 50000:
        print(f"[API] Truncating resume from {len(resume_text)} to 50000 chars", file=sys.stderr)
        resume_text = resume_text[:50000]

    discovery_dict = request.discovery_answers

    try:
        settings = env_default_settings()
        result = run_profile_pipeline(
            resume_text=resume_text,
            settings=settings,
            fallback=None,
            discovery_answers=discovery_dict,
        )
        return result
    except Exception as e:
        print(f"[API] ❌ JSON analysis failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Analysis pipeline failed: {str(e)}")


@app.post("/bschool-match")
async def bschool_match(candidate_profile: Dict[str, Any] = Body(...)):
    if not isinstance(candidate_profile, dict) or not candidate_profile:
        raise HTTPException(status_code=400, detail="candidate_profile must be a non-empty JSON object")
    try:
        result = run_bschool_match(candidate_profile)
        return result
    except Exception as e:
        print(f"[BSchoolMatch API] ❌ Match pipeline failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"B-school match pipeline failed: {str(e)}")


@app.post("/resumewriter")
async def resume_writer_endpoint(payload: Dict[str, Any] = Body(...)):
    if not isinstance(payload, dict) or not payload:
        raise HTTPException(status_code=400, detail="Payload must be a non-empty JSON object")
    try:
        result = generate_resume(payload)
        return result
    except Exception as e:
        print(f"[resumewriter][API] ❌ Failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Resume writer failed: {str(e)}")


@app.post("/test")
async def test_endpoint(text: str = Form(...)):
    return {"received": text[:100], "length": len(text), "status": "ok", "version": APP_VERSION}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    print(f"[STARTUP] Starting server on port {port}", file=sys.stderr)
    print(f"[STARTUP] Pipeline version: {PIPELINE_VERSION}", file=sys.stderr)
    print(f"[STARTUP] Profile pipeline available: {PROFILE_PIPELINE_AVAILABLE}", file=sys.stderr)
    uvicorn.run(app, host="0.0.0.0", port=port)
