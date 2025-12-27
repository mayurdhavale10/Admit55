# ml-service/pipeline/tools/profileresumetool/version.py

PIPELINE_VERSION = "5.7.0"

# Token budgets (keep here so orchestrator/steps can import consistently)
TOKENS = {
    "scoring": 450,
    "header_summary": 650,
    "strengths": 950,
    "improvements": 950,
    "adcom_panel": 850,
    "recommendations": 1150,
}
