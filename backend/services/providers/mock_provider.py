def analyze_with_mock(image_bytes, prompt):

    return """
```turtle
@prefix : <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

:Scene_1 a :Scene ;
    :hasActor :Pedestrian_1 ;
    :hasVehicle :Car_1 ;
    :hasRisk :Risk_1, :Risk_2 .

:Pedestrian_1 a :Pedestrian .

:Car_1 a :Car .

:Risk_1 a :PedestrianCollisionRisk ;
    :hasDescription "Demo risk: a pedestrian may enter the vehicle path." ;
    :hasSeverityScore "0.82"^^xsd:float .

:Risk_2 a :CollisionRisk ;
    :hasDescription "Demo risk: nearby road users may create a potential collision hazard." ;
    :hasSeverityScore "0.65"^^xsd:float .
```
"""