#!/usr/bin/env python3
"""
FastAPI wrapper for:
- MBA Resume Analysis Pipeline (v5.4.0 with header_summary support)
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

# Add pipeline to path
sys.path.insert(0, os.path.dirname(__file__))

# Import the NEW v5.4.0 pipeline
try:
    from pipeline.mba_hybrid_pipeline import run_pipeline, LLMSettings, _env_default_settings
    PIPELINE_VERSION = "5.4.0"
except ImportError as e:
    print(f"[IMPORT ERROR] mba_llm_detailed_pipeline v5.4.0: {e}", file=sys.stderr)
    # Fallback to old pipeline if needed
    try:
        from pipeline.mba_hybrid_pipeline import run_pipeline
        PIPELINE_VERSION = "5.0.0-fallback"
    except ImportError:
        def run_pipeline(text, **kwargs):
            raise HTTPException(500, "Resume analysis pipeline not available")
        PIPELINE_VERSION = "unknown"

try:
    from pipeline.mba_hybrid_pipeline import PDF_SUPPORT
except ImportError:
    PDF_SUPPORT = False
    print("[IMPORT] PDF_SUPPORT not found, setting to False", file=sys.stderr)

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

# PDF extraction
try:
    import PyPDF2
    
    def extract_text_from_pdf(pdf_path: str) -> str:
        """Extract text from PDF file."""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
except ImportError:
    def extract_text_from_pdf(pdf_path: str) -> str:
        """Fallback if PyPDF2 not available."""
        raise HTTPException(
            status_code=500,
            detail="PDF support not available - PyPDF2 not installed"
        )

APP_VERSION = PIPELINE_VERSION

app = FastAPI(
    title="MBA Tools API",
    description="AI-powered resume analysis + B-school match + resume writer for MBA admissions",
    version=APP_VERSION,
)

# CORS - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        "pipeline_version": PIPELINE_VERSION,
        "endpoints": {
            "analyze": "POST /analyze",
            "rewrite": "POST /rewrite",
            "bschool_match": "POST /bschool-match",
            "resumewriter": "POST /resumewriter",
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
        "pipeline_version": PIPELINE_VERSION,
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "models": {
            "groq_model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            "gemini_model": os.getenv("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash"),
            "openai_model": os.getenv("OPENAI_PRIMARY_MODEL", "gpt-4o-mini"),
        },
        "features": {
            "header_summary": True,  # NEW in v5.4.0
            "multi_provider": True,
            "context_aware": True,
        },
        "extra": {
            "bschool_match_pipeline": True,
            "resume_writer_pipeline": True,
        },
    }


# ============================================================
# /analyze – Resume Analysis (v5.4.0 with header_summary)
# ============================================================
@app.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    context: Optional[str] = Form(None),  # NEW: optional context JSON string
):
    """
    Analyze resume from PDF file or direct text.

    Args:
        file: PDF file upload (optional)
        resume_text: Direct resume text (optional)
        context: Optional JSON string with context (goal, timeline, tier, etc.)

    Returns:
        Complete analysis with:
        - scores
        - header_summary (NEW in v5.4.0: summary, highlights, archetype)
        - strengths
        - improvements
        - recommendations
        - narrative (optional)
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

    # Parse optional context
    context_dict = None
    if context:
        try:
            context_dict = json.loads(context)
            print(f"[API] Received context: {list(context_dict.keys())}", file=sys.stderr)
        except json.JSONDecodeError:
            print(f"[API] Invalid context JSON, ignoring", file=sys.stderr)

    # Run ML pipeline (v5.4.0)
    try:
        print(
            f"[API] Starting analysis for {len(resume_text)} character resume",
            file=sys.stderr,
        )
        print("=" * 60, file=sys.stderr)
        print(
            f"MBA RESUME ANALYSIS PIPELINE v{PIPELINE_VERSION}",
            file=sys.stderr,
        )
        print("=" * 60, file=sys.stderr)

        # Get LLM settings from environment
        settings = _env_default_settings()
        print(f"[API] Using provider: {settings.provider}, model: {settings.model}", file=sys.stderr)

        # Call the v5.4.0 pipeline with context support
        result = run_pipeline(
            resume_text=resume_text,
            settings=settings,
            fallback=None,
            context=context_dict,
            include_narrative=False,  # Set to False to save tokens
        )

        print("[API] Analysis complete", file=sys.stderr)
        print(f"[API] Result keys: {list(result.keys())}", file=sys.stderr)
        
        # Verify header_summary is present
        if "header_summary" in result:
            print(f"[API] ✅ header_summary generated with keys: {list(result['header_summary'].keys())}", file=sys.stderr)
        else:
            print("[API] ⚠️  header_summary NOT in result!", file=sys.stderr)

        return result

    except Exception as e:
        print(f"[API] Analysis failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
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
    
    NOTE: This endpoint is currently disabled as improve_resume
    function is not available in the pipeline.
    """
    raise HTTPException(
        status_code=501,
        detail="Resume rewrite functionality is currently unavailable. This feature is under development."
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

    Expects JSON body with structured answers.

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
        print(f"[resumewriter][API] Payload keys: {list(payload.keys())}", file=sys.stderr)
        
        result = generate_resume(payload)
        
        print("[resumewriter][API] Resume generation complete", file=sys.stderr)
        return result
    except Exception as e:
        print(f"[resumewriter][API] Failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
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