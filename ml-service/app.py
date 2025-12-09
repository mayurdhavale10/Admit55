#!/usr/bin/env python3
"""
FastAPI wrapper for:
- MBA Resume Analysis Pipeline (Groq single-call v5.0)
- B-School Match Pipeline
- Resume Writer Pipeline (Groq)

Deployed on Render.com
"""

import os
import sys
import tempfile
from typing import Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

# Add pipeline to path
sys.path.insert(0, os.path.dirname(__file__))

from pipeline.mba_hybrid_pipeline import (
    run_pipeline,
    extract_text_from_pdf,
    improve_resume,
    PDF_SUPPORT,
)
from pipeline.bschool_match_pipeline import run_bschool_match
from pipeline.resume_writer_pipeline import generate_resume  # 🔥 NEW IMPORT

APP_VERSION = "5.0.0"

app = FastAPI(
    title="MBA Tools API",
    description="AI-powered resume analysis + B-school match + resume writer for MBA admissions",
    version=APP_VERSION,
)

# CORS - Allow Vercel domains (you can restrict later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: restrict to your frontend domains
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Basic health/info endpoint."""
    return {
        "status": "healthy",
        "service": "MBA Tools",
        "version": APP_VERSION,
        "endpoints": {
            "analyze": "POST /analyze",
            "rewrite": "POST /rewrite",
            "bschool_match": "POST /bschool-match",
            "resumewriter": "POST /resumewriter",  # 🔥 FIXED - removed hyphen
            "health": "GET /health",
            "test": "POST /test",
        },
    }


@app.get("/health")
async def health():
    """Detailed health check + LLM config snapshot."""
    return {
        "status": "healthy",
        "pdf_support": PDF_SUPPORT,
        # Groq-only config
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "models": {
            "groq_model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        },
        "pipeline_version": APP_VERSION,
        "extra": {
            "bschool_match_pipeline": True,
            "resume_writer_pipeline": True,  # 🔥 NEW FLAG
        },
    }


# ============================================================
# /analyze – Resume Analysis (Profiler / Resume Tool)
# ============================================================
@app.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
):
    """
    Analyze resume from PDF file or direct text.

    Args:
        file: PDF file upload (optional)
        resume_text: Direct resume text (optional)

    Returns:
        Complete analysis with scores, strengths, improvements, recommendations.
        NOTE: Does NOT include improved_resume (use /rewrite for that).
    """

    # Validate input
    if not file and not resume_text:
        raise HTTPException(
            status_code=400,
            detail="Please provide either 'file' (PDF) or 'resume_text' parameter",
        )

    # Handle file upload (PDF)
    if file:
        # Validate PDF extension
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported for file upload",
            )

        try:
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                content = await file.read()
                tmp.write(content)
                tmp_path = tmp.name

            print(f"[API] Saved PDF to: {tmp_path}", file=sys.stderr)

            # Extract text from PDF
            try:
                resume_text = extract_text_from_pdf(tmp_path)
                print(
                    f"[API] Extracted {len(resume_text)} characters from PDF",
                    file=sys.stderr,
                )
            except Exception as e:
                raise HTTPException(
                    status_code=422,
                    detail=f"Failed to extract text from PDF: {str(e)}",
                )
            finally:
                # Cleanup temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except HTTPException:
            # Re-raise HTTP errors as-is
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process PDF file: {str(e)}",
            )

    # Validate text length
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Resume text is too short (minimum 50 characters)",
        )

    if len(resume_text) > 50000:
        print(
            f"[API] Truncating resume from {len(resume_text)} to 50000 chars",
            file=sys.stderr,
        )
        resume_text = resume_text[:50000]

    # Run ML pipeline (Groq single-call)
    try:
        print(
            f"[API] Starting analysis for {len(resume_text)} character resume",
            file=sys.stderr,
        )
        print(
            "============================================================",
            file=sys.stderr,
        )
        print(
            f"MBA RESUME ANALYSIS PIPELINE v{APP_VERSION} (Groq single-call)",
            file=sys.stderr,
        )
        print(
            f"[LLM] Using Groq model: {os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')}",
            file=sys.stderr,
        )
        print(
            "============================================================",
            file=sys.stderr,
        )

        # v5.0 Groq single-call – include_improvement flag kept for compatibility
        result = run_pipeline(resume_text, include_improvement=False)

        # Extra safety: drop improved_resume if pipeline still sends it
        if isinstance(result, dict) and "improved_resume" in result:
            del result["improved_resume"]

        print("[API] Analysis complete", file=sys.stderr)
        return result

    except Exception as e:
        print(f"[API] Analysis failed: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis pipeline failed: {str(e)}",
        )


# ============================================================
# /rewrite – On-Demand Resume Improvement
# ============================================================
@app.post("/rewrite")
async def rewrite_resume(
    resume_text: str = Form(...),
):
    """
    Improve resume text (on-demand, separate from analysis).

    Args:
        resume_text: Original resume text to improve (required)

    Returns:
        {
            "improved_resume": "...",
            "meta": { ... }
        }
    """

    # Validate input
    if not resume_text or not isinstance(resume_text, str):
        raise HTTPException(
            status_code=400,
            detail="resume_text is required and must be a string",
        )

    trimmed = resume_text.strip()

    if len(trimmed) < 50:
        raise HTTPException(
            status_code=400,
            detail=(
                "Resume text too short. Minimum 50 characters required. "
                f"Received: {len(trimmed)}"
            ),
        )

    if len(trimmed) > 50000:
        print(
            f"[Rewrite API] Truncating from {len(trimmed)} to 50000 chars",
            file=sys.stderr,
        )
        trimmed = trimmed[:50000]

    # Call improve_resume function (Groq inside)
    try:
        print(
            f"[Rewrite API] Starting improvement for {len(trimmed)} character resume",
            file=sys.stderr,
        )
        improved = improve_resume(trimmed)
        print(
            f"[Rewrite API] Improvement complete: {len(improved)} characters",
            file=sys.stderr,
        )

        return {
            "improved_resume": improved,
            "meta": {
                "source": "pipeline.mba_hybrid_pipeline.improve_resume",
                "original_length": len(trimmed),
                "improved_length": len(improved),
                "pipeline_version": APP_VERSION,
            },
        }

    except Exception as e:
        print(f"[Rewrite API] Improvement failed: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Resume improvement failed: {str(e)}",
        )


# ============================================================
# /bschool-match – LLM B-School Match Engine
# ============================================================
@app.post("/bschool-match")
async def bschool_match(
    candidate_profile: Dict[str, Any] = Body(..., description="Structured candidate profile JSON"),
):
    """
    B-School Match engine.
    """

    if not isinstance(candidate_profile, dict) or not candidate_profile:
        raise HTTPException(
            status_code=400,
            detail="candidate_profile must be a non-empty JSON object",
        )

    try:
        print("[BSchoolMatch API] Starting B-school match pipeline", file=sys.stderr)
        result = run_bschool_match(candidate_profile)
        print("[BSchoolMatch API] Match pipeline complete", file=sys.stderr)
        return result
    except Exception as e:
        print(f"[BSchoolMatch API] Match pipeline failed: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"B-school match pipeline failed: {str(e)}",
        )


# ============================================================
# /resumewriter – Resume Generation from Q&A (NO HYPHEN)
# ============================================================
@app.post("/resumewriter")
async def resume_writer_endpoint(
    payload: Dict[str, Any] = Body(..., description="Structured answers from resume Q&A form"),
):
    """
    Resume Writer endpoint.

    Expects JSON body with structured answers, e.g.:

    {
      "basic_info": {...},
      "work_experience": [...],
      "education": [...],
      "projects": [...],
      "leadership": [...],
      "skills": {...},
      "preferences": {...}
    }

    Returns:
      {
        "resume_text": "string",
        "sections": {...},
        "meta": {...}
      }
    """

    if not isinstance(payload, dict) or not payload:
        raise HTTPException(
            status_code=400,
            detail="Payload must be a non-empty JSON object of answers",
        )

    try:
        print("[resumewriter][API] Starting resume generation", file=sys.stderr)
        result = generate_resume(payload)
        print("[resumewriter][API] Resume generation complete", file=sys.stderr)
        return result
    except Exception as e:
        print(f"[resumewriter][API] Failed: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Resume writer failed: {str(e)}",
        )


# ============================================================
# /test – Simple Liveness Test
# ============================================================
@app.post("/test")
async def test_endpoint(text: str = Form(...)):
    """Simple test endpoint to verify FastAPI is alive."""
    return {
        "received": text[:100],
        "length": len(text),
        "status": "ok",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)