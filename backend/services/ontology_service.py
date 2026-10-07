import os
from rdflib import Graph, RDF, OWL
from rdflib.namespace import RDFS



def load_ontology():
    # Find the backend folder
    backend_dir = os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )

    # Build the path to backend/ontology/PRO2.ttl
    ontology_path = os.path.join(
        backend_dir,
        "ontology",
        "PRO2.ttl"
    )

    # Create an RDF graph
    graph = Graph()

    # Load the Turtle ontology into the graph
    graph.parse(ontology_path, format="turtle")

    return graph

def get_ontology_classes(graph):
    classes = []

    for subject in graph.subjects(RDF.type, OWL.Class):
        class_name = str(subject).split("#")[-1].split("/")[-1]

        if class_name not in classes:
            classes.append(class_name)

    return sorted(classes)

def get_ontology_relationships(graph):
    relationships = []

    for subject in graph.subjects(RDF.type, OWL.ObjectProperty):
        relationship_name = str(subject).split("#")[-1].split("/")[-1]

        if relationship_name not in relationships:
            relationships.append(relationship_name)

    return sorted(relationships)

def get_ontology_context():
    graph = load_ontology()

    classes = get_ontology_classes(graph)
    relationships = get_ontology_relationships(graph)

    return {
        "classes": classes,
        "relationships": relationships
    }