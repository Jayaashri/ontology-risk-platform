import os

from dotenv import load_dotenv

from services.ontology_service import get_ontology_context
from services.rdf_parser import extract_ttl, extract_risks_from_rdf

from services.providers.mock_provider import analyze_with_mock
from services.providers.gemini_provider import analyze_with_gemini


load_dotenv()


def get_available_providers():

    return [
        {
            "id": "mock",
            "name": "Demo / Mock",
            "available": True,
            "requires_api_key": False
        },
        {
            "id": "gemini",
            "name": "Gemini",
            "available": bool(os.getenv("GEMINI_API_KEY")),
            "requires_api_key": True
        },
        {
            "id": "openai",
            "name": "OpenAI",
            "available": bool(os.getenv("OPENAI_API_KEY")),
            "requires_api_key": True
        },
        {
            "id": "anthropic",
            "name": "Claude",
            "available": bool(os.getenv("ANTHROPIC_API_KEY")),
            "requires_api_key": True
        }
    ]


def build_ontology_prompt():

    ontology = get_ontology_context()

    allowed_classes = "\n".join(ontology["classes"])
    allowed_relationships = "\n".join(
        ontology["relationships"]
    )

    return f"""
You are an autonomous driving safety analyst.

Analyze the supplied autonomous-driving scene.

Use the following ontology concepts to guide your analysis.

ALLOWED CLASSES

{allowed_classes}

ALLOWED RELATIONSHIPS

{allowed_relationships}

TASK

1. Identify the main entities visible in the scene.

2. Identify relationships between entities.

3. Classify the scenario into ONE corner case type:
   - StateAnomaly
   - BehaviorAnomaly
   - EvidenceBasedAnomaly

4. Generate RDF triples describing the scene.

5. Identify potential safety risks.

6. Assign every risk a severity score between 0 and 1.

Only identify risks supported by the image.
Do not invent unsupported risks.

For EVERY risk use:

:Risk_1 a :SomeRiskType ;
    :hasDescription "Description of the risk." ;
    :hasSeverityScore "0.85"^^xsd:float .

Return RDF inside a Turtle Markdown code block.

The Turtle must contain:

@prefix : <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

Do not put other content inside the Turtle code block.
"""


def analyze_driving_image(
    image_bytes,
    provider="mock"
):

    prompt = build_ontology_prompt()

    if provider == "mock":

        raw_output = analyze_with_mock(
            image_bytes,
            prompt
        )

    elif provider == "gemini":

        raw_output = analyze_with_gemini(
            image_bytes,
            prompt
        )

    elif provider == "openai":

        raise ValueError(
            "OpenAI provider is not configured yet."
        )

    elif provider == "anthropic":

        raise ValueError(
            "Claude provider is not configured yet."
        )

    else:

        raise ValueError(
            f"Unknown provider: {provider}"
        )

    ttl = extract_ttl(raw_output)

    risks = extract_risks_from_rdf(ttl)

    return {
        "provider": provider,
        "raw_output": raw_output,
        "ttl": ttl,
        "risks": risks
    }


def test_gemini_connection():

    if not os.getenv("GEMINI_API_KEY"):
        return "Gemini API key is not configured."

    return "Gemini provider is configured."