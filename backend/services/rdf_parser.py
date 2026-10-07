import re
from rdflib import Graph, RDF


def clean_text(s):
    if not s:
        return ""

    s = s.replace("**", "").replace("*", "")
    s = s.replace("\n", " ").replace("\r", " ").strip()
    s = re.sub(r"\s+", " ", s)

    return s


def extract_ttl(text):
    match = re.search(r"```(?:turtle)?(.*?)```", text, re.DOTALL)

    if match:
        return match.group(1).strip()

    return ""


def extract_risks_from_rdf(ttl_text):
    risks = []

    if not ttl_text or ttl_text.strip() == "":
        return risks

    try:
        g = Graph()
        g.parse(data=ttl_text, format="turtle")

        seen_risk_ids = set()

        for subject in set(g.subjects()):
            subject_str = str(subject)

            if "risk" not in subject_str.lower():
                continue

            risk_id = subject_str.split("#")[-1].split("/")[-1]

            if risk_id in seen_risk_ids:
                continue

            seen_risk_ids.add(risk_id)

            risk_type = ""
            description = ""
            severity = None

            for obj in g.objects(subject, RDF.type):
                risk_type = str(obj).split("#")[-1].split("/")[-1]

            for pred, obj in g.predicate_objects(subject):
                pred_name = str(pred).split("#")[-1].split("/")[-1].lower()

                if "description" in pred_name:
                    description = str(obj)

                if "severity" in pred_name:
                    try:
                        severity = float(obj)
                    except:
                        severity = None

            risks.append({
                "risk_number": len(risks) + 1,
                "risk_type": risk_type,
                "risk_id": risk_id,
                "description": clean_text(description),
                "severity": severity
            })

        return risks

    except Exception as e:
        print("RDF parsing failed:", e)
        return []