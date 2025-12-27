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
from typing import Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

# ------------------------------------------------------------
# Path setup (so `pipeline/...` imports work on Render/local)
# ------------------------------------------------------------
sys.path.insert(0, os.path.dirname(__file__))

# ------------------------------------------------------------
# Imports: ProfileResumeTool (NEW modular path)
# ------------------------------------------------------------
PIPELINE_VERSION = "unknown"
PDF_SUPPORT = False

try:
    # NEW: modularized tool path
    from pipeline.tools.profileresumetool import run_pipeline as run_profile_pipeline
    from pipeline.tools.profileresumetool import PIPELINE_VERSION as PROFILE_PIPELINE_VERSION

    PIPELINE_VERSION = str(PROFILE_PIPELINE_VERSION)
except Exception as e:
    print(f"[IMPORT ERROR] profileresumetool pipeline: {e}", file=sys.stderr)

    # LAST resort fallback (if your old single-file pipeline still exists)
    try:
        from pipeline.mba_hybrid_pipeline import run_pipeline as run_profile_pipeline  # type: ignore
        PIPELINE_VERSION = "legacy-mba_hybrid_pipeline"
    except Exception as e2:
        print(f"[IMPORT ERROR] legacy mba_hybrid_pipeline: {e2}", file=sys.stderr)

        def run_profile_pipeline(*args, **kwargs):
            raise HTTPException(500, "ProfileResumeTool pipeline not available")


# ------------------------------------------------------------
# Imports: LLM Settings (prefer core/settings.py if present)
# ------------------------------------------------------------
def _fallback_env_default_settings() -> Dict[str, Any]:
    """
    Minimal safe settings snapshot if core/settings.py isn't ready yet.
    Your run_profile_pipeline can ignore this if it reads env internally.
    """
    provider = (os.getenv("LLM_PROVIDER") or "").strip().lower()

    groq_key = os.getenv("GROQ_API_KEY", "")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_base = os.getenv("GROQ_API_URL") or "https://api.groq.com/openai/v1"

    openai_key = os.getenv("OPENAI_API_KEY", "")
    openai_model = os.getenv("OPENAI_PRIMARY_MODEL", "gpt-4o-mini")
    openai_base = os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    gem_key = os.getenv("GEMINI_API_KEY", "")
    gem_model = os.getenv("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")

    # Explicit provider first
    if provider == "groq" and groq_key:
        return {"provider": "groq", "api_key": groq_key, "model": groq_model, "base_url": groq_base}
    if provider == "openai" and openai_key:
        return {"provider": "openai", "api_key": openai_key, "model": openai_model, "base_url": openai_base}
    if provider == "gemini" and gem_key:
        return {"provider": "gemini", "api_key": gem_key, "model": gem_model, "base_url": None}

    # Auto-pick
    if groq_key:
        return {"provider": "groq", "api_key": groq_key, "model": groq_model, "base_url": groq_base}
    if openai_key:
        return {"provider": "openai", "api_key": openai_key, "model": openai_model, "base_url": openai_base}
    if gem_key:
        return {"provider": "gemini", "api_key": gem_key, "model": gem_model, "base_url": None}

    return {"provider": "groq", "api_key": "", "model": groq_model, "base_url": groq_base}


try:
    # if you implemented these in pipeline/core/settings.py (recommended)
    from pipeline.core.settings import LLMSettings, env_default_settings  # type: ignore
except Exception:
    LLMSettings = None  # type: ignore

    def env_default_settings():  # type: ignore
        return _fallback_env_default_settings()


# ------------------------------------------------------------
# Imports: other pipelines (unchanged)
# ------------------------------------------------------------
try:
    from pipeline.bschool_match_pipeline import run_bschool_match
except Exception as e:
    print(f"[IMPORT ERROR] bschool_match_pipeline: {e}", file=sys.stderr)

    def run_bschool_match(*args, **kwargs):
        raise HTTPException(500, "B-school match pipeline not available")


try:
    from pipeline.resume_writer_pipeline import generate_resume
except Exception as e:
    print(f"[IMPORT ERROR] resume_writer_pipeline: {e}", file=sys.stderr)

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

except Exception:
    PDF_SUPPORT = False

    def extract_text_from_pdf(pdf_path: str) -> str:
        raise HTTPException(status_code=500, detail="PDF support not available (PyPDF2 not installed)")


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
    # support both dict fallback and dataclass settings
    provider = getattr(settings, "provider", None) or (settings.get("provider") if isinstance(settings, dict) else None)
    model = getattr(settings, "model", None) or (settings.get("model") if isinstance(settings, dict) else None)

    return {
        "status": "healthy",
        "pdf_support": PDF_SUPPORT,
        "profile_resume_tool_version": PIPELINE_VERSION,
        "llm": {
            "provider": provider,
            "model": model,
            "groq_configured": bool(os.getenv("GROQ_API_KEY")),
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
            "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        },
        "pipelines": {
            "profileresumetool": True,
            "bschool_match": True,
            "resume_writer": True,
        },
        "features": {
            "narrative": False,  # you said you don't want narrative
            "multi_provider": True,
            "context_aware": True,
        },
    }


# ============================================================
# /analyze — ProfileResumeTool (NO narrative)
# ============================================================
@app.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    context: Optional[str] = Form(None),  # optional JSON string
):
    if not file and not resume_text:
        raise HTTPException(status_code=400, detail="Provide either 'file' (PDF) or 'resume_text'")

    # PDF path -> text
    if file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name

            try:
                resume_text = extract_text_from_pdf(tmp_path)
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

    # Validate text
    resume_text = (resume_text or "").strip()
    if len(resume_text) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short (min 50 chars)")

    if len(resume_text) > 50000:
        resume_text = resume_text[:50000]

    # Parse context JSON (optional)
    context_dict: Optional[Dict[str, Any]] = None
    if context:
        try:
            parsed = json.loads(context)
            context_dict = parsed if isinstance(parsed, dict) else None
        except Exception:
            context_dict = None

    # Run pipeline
    try:
        settings = env_default_settings()

        # If core/settings.py returns a dataclass, pass it through.
        # If fallback dict, still pass it (your orchestrator can ignore or handle it).
        result = run_profile_pipeline(
            resume_text=resume_text,
            settings=settings,
            fallback=None,
            context=context_dict,
            include_narrative=False,  # ALWAYS OFF
        )
        return result

    except Exception as e:
        import traceback

        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Analysis pipeline failed: {str(e)}")


# ============================================================
# /bschool-match — unchanged
# ============================================================
@app.post("/bschool-match")
async def bschool_match(
    candidate_profile: Dict[str, Any] = Body(..., description="Structured candidate profile JSON"),
):
    if not isinstance(candidate_profile, dict) or not candidate_profile:
        raise HTTPException(status_code=400, detail="candidate_profile must be a non-empty JSON object")

    try:
        return run_bschool_match(candidate_profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"B-school match pipeline failed: {str(e)}")


# ============================================================
# /resumewriter — unchanged
# ============================================================
@app.post("/resumewriter")
async def resume_writer_endpoint(
    payload: Dict[str, Any] = Body(..., description="Structured answers from resume Q&A form"),
):
    if not isinstance(payload, dict) or not payload:
        raise HTTPException(status_code=400, detail="Payload must be a non-empty JSON object")

    try:
        return generate_resume(payload)
    except Exception as e:
        import traceback

        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Resume writer failed: {str(e)}")


# ============================================================
# /test — liveness
# ============================================================
@app.post("/test")
async def test_endpoint(text: str = Form(...)):
    return {"received": text[:100], "length": len(text), "status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
