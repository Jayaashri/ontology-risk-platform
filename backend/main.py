from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    Depends,
    HTTPException
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models

from database import engine, get_db

from services.rdf_parser import extract_risks_from_rdf

from services.llm_service import (
    test_gemini_connection,
    analyze_driving_image,
    get_available_providers
)

from services.ontology_service import (
    load_ontology,
    get_ontology_classes,
    get_ontology_relationships
)


# --------------------------------------------------
# FASTAPI APP
# --------------------------------------------------

app = FastAPI(
    title="Ontology Risk Analysis API",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# Allows React frontend to communicate with FastAPI
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# DATABASE TABLES
# --------------------------------------------------

models.Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class RDFRequest(BaseModel):
    ttl_text: str


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "Ontology Risk Analysis API is running"
    }


# --------------------------------------------------
# AVAILABLE LLM PROVIDERS
# --------------------------------------------------

@app.get("/providers")
def providers():

    return {
        "providers": get_available_providers()
    }


# --------------------------------------------------
# PARSE RDF
# --------------------------------------------------

@app.post("/parse-rdf")
def parse_rdf(request: RDFRequest):

    risks = extract_risks_from_rdf(
        request.ttl_text
    )

    return {
        "risks": risks
    }


# --------------------------------------------------
# ANALYZE IMAGE
# --------------------------------------------------

@app.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    provider: str = Form("mock"),
    db: Session = Depends(get_db)
):

    # Make sure the uploaded file is an image
    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    try:

        # Read uploaded image
        image_data = await file.read()

        # Run selected LLM provider
        analysis = analyze_driving_image(
            image_data,
            provider=provider
        )

        # Create database analysis record
        db_analysis = models.Analysis(
            filename=file.filename,
            provider=provider,
            ttl=analysis["ttl"]
        )

        db.add(db_analysis)

        # Get ID before saving risks
        db.flush()

        # Save every detected risk
        for risk in analysis["risks"]:

            db_risk = models.Risk(
                analysis_id=db_analysis.id,
                risk_type=risk["risk_type"],
                risk_identifier=risk["risk_id"],
                description=risk["description"],
                severity=risk["severity"]
            )

            db.add(db_risk)

        # Save everything
        db.commit()

        db.refresh(db_analysis)

        return {
            "analysis_id": db_analysis.id,
            "filename": db_analysis.filename,
            "provider": db_analysis.provider,
            "created_at": db_analysis.created_at,
            "ttl": analysis["ttl"],
            "risks": analysis["risks"]
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


# --------------------------------------------------
# ANALYSIS HISTORY
# --------------------------------------------------

@app.get("/analyses")
def get_analyses(
    db: Session = Depends(get_db)
):

    analyses = (
        db.query(models.Analysis)
        .order_by(models.Analysis.id.desc())
        .all()
    )

    results = []

    for analysis in analyses:

        risks = []

        for risk in analysis.risks:

            risks.append({
                "risk_type": risk.risk_type,
                "risk_id": risk.risk_identifier,
                "description": risk.description,
                "severity": risk.severity
            })

        results.append({
            "id": analysis.id,
            "filename": analysis.filename,
            "provider": analysis.provider,
            "created_at": analysis.created_at,
            "risk_count": len(risks),
            "risks": risks
        })

    return results


# --------------------------------------------------
# GET ONE ANALYSIS
# --------------------------------------------------

@app.get("/analyses/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):

    analysis = (
        db.query(models.Analysis)
        .filter(
            models.Analysis.id == analysis_id
        )
        .first()
    )

    if analysis is None:

        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    risks = []

    for risk in analysis.risks:

        risks.append({
            "risk_type": risk.risk_type,
            "risk_id": risk.risk_identifier,
            "description": risk.description,
            "severity": risk.severity
        })

    return {
        "id": analysis.id,
        "filename": analysis.filename,
        "provider": analysis.provider,
        "created_at": analysis.created_at,
        "ttl": analysis.ttl,
        "risks": risks
    }


# --------------------------------------------------
# GEMINI TEST
# --------------------------------------------------

@app.get("/test-gemini")
def test_gemini():

    result = test_gemini_connection()

    return {
        "message": result
    }


# --------------------------------------------------
# ONTOLOGY TEST
# --------------------------------------------------

@app.get("/test-ontology")
def test_ontology():

    graph = load_ontology()

    classes = get_ontology_classes(graph)

    relationships = get_ontology_relationships(
        graph
    )

    return {
        "message": "Ontology loaded successfully",
        "triple_count": len(graph),
        "class_count": len(classes),
        "classes": classes,
        "relationship_count": len(relationships),
        "relationships": relationships
    }