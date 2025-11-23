#!/usr/bin/env python3
"""
FastAPI wrapper for MBA Resume Analysis Pipeline
Deployed on Render.com
"""
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import sys
from typing import Optional

# Add pipeline to path
sys.path.insert(0, os.path.dirname(__file__))

from pipeline.mba_hybrid_pipeline import run_pipeline, extract_text_from_pdf, PDF_SUPPORT

app = FastAPI(
    title="MBA Resume Analyzer API",
    description="AI-powered resume analysis for MBA admissions",
    version="3.2.0"
)

# CORS - Allow Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify your Vercel domain
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "MBA Resume Analyzer",
        "version": "3.2.0",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health"
        }
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "pdf_support": PDF_SUPPORT,
        "hf_configured": bool(os.getenv("HF_API_KEY")),
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "use_huggingface": os.getenv("USE_HUGGINGFACE", "false").lower() == "true",
        "hf_model": os.getenv("HF_MODEL", "not_set"),
        "pipeline_version": "3.2.0"
    }

@app.post("/analyze")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None)
):
    """
    Analyze resume from PDF file or direct text
    
    Args:
        file: PDF file upload (optional)
        resume_text: Direct resume text (optional)
    
    Returns:
        Complete analysis with scores, strengths, improvements, recommendations
    """
    
    # Validate input
    if not file and not resume_text:
        raise HTTPException(
            status_code=400,
            detail="Please provide either 'file' (PDF) or 'resume_text' parameter"
        )
    
    # Handle file upload (PDF)
    if file:
        # Validate PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported for file upload"
            )
        
        # Save to temp file
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                content = await file.read()
                tmp.write(content)
                tmp_path = tmp.name
            
            print(f"[API] Saved PDF to: {tmp_path}", file=sys.stderr)
            
            # Extract text from PDF
            try:
                resume_text = extract_text_from_pdf(tmp_path)
                print(f"[API] Extracted {len(resume_text)} characters from PDF", file=sys.stderr)
            except Exception as e:
                raise HTTPException(
                    status_code=422,
                    detail=f"Failed to extract text from PDF: {str(e)}"
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
                detail=f"Failed to process PDF file: {str(e)}"
            )
    
    # Validate text length
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Resume text is too short (minimum 50 characters)"
        )
    
    if len(resume_text) > 50000:
        print(f"[API] Truncating resume from {len(resume_text)} to 50000 chars", file=sys.stderr)
        resume_text = resume_text[:50000]
    
    # Run ML pipeline
    try:
        print(f"[API] Starting analysis for {len(resume_text)} character resume", file=sys.stderr)
        result = run_pipeline(resume_text)
        print(f"[API] Analysis complete", file=sys.stderr)
        return result
        
    except Exception as e:
        print(f"[API] Analysis failed: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis pipeline failed: {str(e)}"
        )

@app.post("/test")
async def test_endpoint(text: str = Form(...)):
    """Simple test endpoint"""
    return {
        "received": text[:100],
        "length": len(text),
        "status": "ok"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)