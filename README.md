# Ontology Risk Analyzer

**An ontology-grounded, multi-LLM platform for autonomous-driving corner-case risk analysis.**

A full-stack application that analyzes autonomous-driving scenes using vision-capable language models and a domain-specific ontology. It generates structured RDF/Turtle representations, identifies potential driving hazards, assigns severity scores, and stores analysis results for later review.

## Features

- **Driving Scene Analysis:** Upload images to identify potential autonomous-driving risks.
- **Ontology-Grounded LLM Analysis:** Use RDF/OWL ontology classes and relationships to guide model-generated risk assessments.
- **Multi-LLM Architecture:** Provider-based design supporting Gemini and an extensible structure for additional models.
- **Demo Mode:** Explore sample analysis results without an external LLM API key.
- **Risk Assessment:** Extract risk types, descriptions, and severity scores.
- **RDF/Turtle Generation:** Generate and parse structured semantic representations using RDFLib.
- **Analysis History:** Store and retrieve results using PostgreSQL.
- **Interactive Dashboard:** React interface with light/dark themes, analysis history, and ontology exploration.
- **REST API:** FastAPI endpoints with interactive Swagger documentation.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, CSS |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| AI | Google Gemini, provider-based LLM integration |
| Semantic Web | RDF, OWL, Turtle, RDFLib |
| API Documentation | Swagger / OpenAPI |
| Version Control | Git, GitHub |

## System Architecture

```text
React Frontend
      |
      v
FastAPI Backend
      |
      +---- LLM Provider Selection
      |        |
      |        +---- Gemini
      |        +---- Demo / Mock
      |
      +---- Ontology Context (PRO2.ttl)
      |
      +---- RDF/Turtle Extraction
      |
      +---- Risk Parsing
      |
      +---- PostgreSQL
               |
               +---- Analyses
               +---- Risks
```

## Ontology

The project uses a custom autonomous-driving ontology containing:

- **79 ontology classes**
- **306 RDF triples**
- Classes representing road users, vehicles, environmental conditions, driving scenarios, and risks
- Object properties defining semantic relationships between entities

The ontology provides domain-specific context for the LLM to produce more structured and interpretable risk assessments.

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- PostgreSQL
- Gemini API key (optional; demo mode does not require one)

### Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a PostgreSQL database named `ontology_risk_db`.

Copy `backend/.env.example` to `backend/.env` and configure your database connection and optional API key.

Start the backend:

```bash
uvicorn main:app --reload
```

API documentation:

`http://127.0.0.1:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open:

`http://localhost:5173`

## How It Works

1. Select an available LLM provider or Demo / Mock mode.
2. Upload an autonomous-driving scene image.
3. The backend prepares an ontology-grounded analysis prompt.
4. The selected provider generates a structured risk assessment.
5. RDF/Turtle output is parsed to extract risks and severity scores.
6. Results are stored in PostgreSQL and displayed in the dashboard.
7. Previous analyses can be reopened from the history page.

**Note:** Demo mode returns predefined sample risks rather than analyzing the actual image. LLM-generated assessments are experimental and should not be treated as validated vehicle-safety decisions.

## Project Structure

```text
ontology-risk-platform/
├── backend/
│   ├── ontology/
│   │   └── PRO2.ttl
│   ├── services/
│   │   ├── providers/
│   │   ├── llm_service.py
│   │   ├── ontology_service.py
│   │   └── rdf_parser.py
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
└── README.md
```

## Future Improvements

- Additional LLM provider integrations
- Cross-model risk comparison and evaluation
- Formal ontology validation
- Cloud deployment

## Research Background

This application extends an academic project investigating ontology-grounded language-model approaches to risk identification in autonomous-driving corner-case scenarios.

The objective is to explore how domain-specific semantic knowledge can support structured, interpretable risk descriptions.
