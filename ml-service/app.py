#!/usr/bin/env python3
"""
FastAPI wrapper for:
- MBA Resume Analysis Pipeline (v5.4.x)
- B-School Match Pipeline
- Resume Writer Pipeline

Deployed on Render.com
"""

import os
import sys
import tempfile
import json
from typing import Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

# ------------------------------------------------------------
# Path setup
# ------------------------------------------------------------
sys.path.insert(0, os.path.dirname(__file__))

# ------------------------------------------------------------
# Pipeline imports
# ------------------------------------------------------------
try:
    from pipeline.mba_hybrid_pipeline import run_pipeline
    PIPELINE_VERSION = "5.4.x"
except ImportError as e:
    print(f"[IMPORT ERROR] mba_hybrid_pipeline: {e}", file=sys.stderr)
    def run_pipeline(*args, **kwargs):
        raise HTTPException(500, "Resume analysis pipeline not available")
    PIPELINE_VERSION = "unknown"

try:
    from pipeline.bschool_match_pipeline import run_bschool_match
except ImportError as e:
    print(f"[IMPORT ERROR] bschool_match_pipeline: {e}", file=sys.stderr)
    def run_bschool_match(profile):
        raise HTTPException(500, "B-school match pipeline not available")

try:
    from pipeline.resume_writer_pipeline import generate_resume
except ImportError as e:
    print(f"[IMPORT ERROR] resume_writer_pipeline: {e}", file=sys.stderr)
    def generate_resume(payload):
        raise HTTPException(500, "Resume writer pipeline not available")

# ------------------------------------------------------------
# PDF extraction
# ------------------------------------------------------------
try:
    import PyPDF2

    def extract_text_from_pdf(pdf_path: str) -> str:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
except ImportError:
    def extract_text_from_pdf(pdf_path: str) -> str:
        raise HTTPException(
            status_code=500,
            detail="PDF support not available (PyPDF2 not installed)",
        )

# ------------------------------------------------------------
# FastAPI app
# ------------------------------------------------------------
app = FastAPI(
    title="MBA Tools API",
    description="AI-powered resume analysis + B-school match + resume writer",
    version=PIPELINE_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# Health
# ------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "pipeline_version": PIPELINE_VERSION,
        "endpoints": {
            "analyze": "POST /analyze",
            "rewrite": "POST /rewrite",
            "bschool_match": "POST /bschool-match",
            "resumewriter": "POST /resumewriter",
            "health": "GET /health",
        },
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "pipeline_version": PIPELINE_VERSION,
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
    }

# ------------------------------------------------------------
# /analyze — Resume Analysis (NO narrative)
# ------------------------------------------------------------
@app.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    context: Optional[str] = Form(None),
):
    if not file and not resume_text:
        raise HTTPException(
            status_code=400,
            detail="Provide either a PDF file or resume_text",
        )

    # --- PDF handling ---
    if file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(400, "Only PDF files are supported")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        try:
            resume_text = extract_text_from_pdf(tmp_path)
            print(f"[API] Extracted {len(resume_text)} chars from PDF", file=sys.stderr)
        finally:
            os.unlink(tmp_path)

    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(400, "Resume text too short")

    if len(resume_text) > 50000:
        resume_text = resume_text[:50000]

    # --- Context parsing ---
    context_dict = None
    if context:
        try:
            context_dict = json.loads(context)
        except json.JSONDecodeError:
            print("[API] Invalid context JSON, ignoring", file=sys.stderr)

    # --- Run pipeline (CRITICAL FIX HERE) ---
    try:
        print("[API] Running MBA pipeline (no narrative)", file=sys.stderr)

        result = run_pipeline(
            resume_text=resume_text,
            context=context_dict,
            include_narrative=False,  # ✅ token-safe, UI-aligned
        )

        print(f"[API] Pipeline complete. Keys: {list(result.keys())}", file=sys.stderr)
        return result

    except Exception as e:
        print(f"[API] Analysis failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(500, f"Analysis failed: {str(e)}")

# ------------------------------------------------------------
# /rewrite — Disabled
# ------------------------------------------------------------
@app.post("/rewrite")
async def rewrite_resume(resume_text: str = Form(...)):
    raise HTTPException(
        status_code=501,
        detail="Resume rewrite currently disabled",
    )

# ------------------------------------------------------------
# /bschool-match
# ------------------------------------------------------------
@app.post("/bschool-match")
async def bschool_match(
    candidate_profile: Dict[str, Any] = Body(...),
):
    if not candidate_profile:
        raise HTTPException(400, "candidate_profile must be non-empty")

    try:
        return run_bschool_match(candidate_profile)
    except Exception as e:
        raise HTTPException(500, f"B-school match failed: {str(e)}")

# ------------------------------------------------------------
# /resumewriter
# ------------------------------------------------------------
@app.post("/resumewriter")
async def resume_writer(payload: Dict[str, Any] = Body(...)):
    if not payload:
        raise HTTPException(400, "Payload must be non-empty")

    try:
        return generate_resume(payload)
    except Exception as e:
        raise HTTPException(500, f"Resume writer failed: {str(e)}")

# ------------------------------------------------------------
# Entrypoint
# ------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
