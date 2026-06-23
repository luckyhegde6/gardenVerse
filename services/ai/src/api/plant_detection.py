from typing import Dict, Optional, Any
import logging
import numpy as np

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel, Field

from ..services.image_processor import ImageProcessor
from ..models.plantnet_mock import PlantNetMock

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/plant", tags=["Plant Detection"])


class PlantIdentificationResponse(BaseModel):
    identified: bool = True
    plant_name: Optional[str] = None
    scientific_name: Optional[str] = None
    confidence: float
    uncertainty: str = "low"
    uncertainty_reason: Optional[str] = None
    message: Optional[str] = None
    family: Optional[str] = None
    type: Optional[str] = None
    characteristics: Optional[Dict[str, Any]] = None
    database_source: Optional[Dict[str, Any]] = None
    analysis_disclaimer: Optional[str] = None


class HealthAnalysisResponse(BaseModel):
    health_score: float = Field(..., ge=0, le=100)
    status: str
    diseases_detected: list
    leaf_metrics: Dict[str, Any]
    nutrient_deficiencies: list
    recommendations: list
    uncertainty: str = "low"
    analysis_disclaimer: Optional[str] = None


def get_image_processor() -> ImageProcessor:
    return ImageProcessor()


def get_plantnet_model() -> PlantNetMock:
    return PlantNetMock()


@router.post("/identify", response_model=PlantIdentificationResponse)
async def identify_plant(
    image: UploadFile = File(..., description="Plant image file (jpg, jpeg, png)"),
    processor: ImageProcessor = Depends(get_image_processor),
    model: PlantNetMock = Depends(get_plantnet_model),
) -> PlantIdentificationResponse:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    valid, error = processor.validate_image(contents)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid image: {error}")

    image_array = processor.load_from_bytes(contents)
    result = model.identify(image_array)

    logger.info(
        "Plant identified: %s (confidence: %.4f)",
        result["plant_name"],
        result["confidence"],
    )

    return PlantIdentificationResponse(**result)


@router.post("/health", response_model=HealthAnalysisResponse)
async def analyze_health(
    image: UploadFile = File(..., description="Plant image for health analysis"),
    plant_species: Optional[str] = Form(None, description="Optional plant species hint"),
    processor: ImageProcessor = Depends(get_image_processor),
    model: PlantNetMock = Depends(get_plantnet_model),
) -> HealthAnalysisResponse:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    valid, error = processor.validate_image(contents)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid image: {error}")

    leaf_metrics = processor.extract_leaf_metrics(contents)

    if not plant_species:
        image_array = processor.load_from_bytes(contents)
        plant_result = model.identify(image_array)
        plant_species = plant_result["scientific_name"]

    health_score = _compute_health_score(leaf_metrics)
    diseases = _detect_diseases_from_metrics(leaf_metrics)
    deficiencies = _detect_nutrient_deficiencies(leaf_metrics)
    recommendations = _generate_health_recommendations(
        health_score, diseases, deficiencies
    )

    has_low_conf = any(d.get("confidence", 1) < 0.5 for d in diseases)
    uncertainty = "high" if (has_low_conf and health_score > 60) else "low"

    return HealthAnalysisResponse(
        health_score=health_score,
        status="healthy" if health_score >= 70 else "fair" if health_score >= 45 else "poor",
        diseases_detected=diseases,
        leaf_metrics=leaf_metrics,
        nutrient_deficiencies=deficiencies,
        recommendations=recommendations,
        uncertainty=uncertainty,
        analysis_disclaimer="This is a simulated analysis based on visible leaf metrics. For accurate diagnosis, consult a plant pathology expert." if uncertainty != "low" else None,
    )


def _compute_health_score(metrics: Dict) -> float:
    score = 100.0

    leaf_color = metrics.get("leaf_color_index", 0.5)
    score -= (1.0 - leaf_color) * 30

    yellow_pct = metrics.get("yellow_coverage_pct", 0)
    score -= yellow_pct * 0.3

    brown_pct = metrics.get("brown_coverage_pct", 0)
    score -= brown_pct * 0.5

    edge_density = metrics.get("edge_density", 0)
    if edge_density > 0.15:
        score -= (edge_density - 0.15) * 80

    curl = metrics.get("leaf_curl_index", 0)
    score -= curl * 25

    uniformity = metrics.get("color_uniformity", 1.0)
    if uniformity < 0.6:
        score -= (0.6 - uniformity) * 40

    return round(max(0, min(100, score)), 1)


def _detect_diseases_from_metrics(metrics: Dict) -> list:
    diseases = []
    yellow = metrics.get("yellow_coverage_pct", 0)
    brown = metrics.get("brown_coverage_pct", 0)
    curl = metrics.get("leaf_curl_index", 0)
    edge = metrics.get("edge_density", 0)

    if yellow > 15 and curl > 0.3:
        diseases.append({
            "disease": "Possible Chlorosis",
            "confidence": round(min(0.9, yellow / 100 + curl * 0.5), 2),
            "severity": "moderate" if yellow > 25 else "mild",
        })
    if brown > 10 and edge > 0.15:
        diseases.append({
            "disease": "Possible Leaf Spot / Blight",
            "confidence": round(min(0.85, brown / 80 + edge), 2),
            "severity": "severe" if brown > 30 else "moderate",
        })
    if curl > 0.5:
        diseases.append({
            "disease": "Possible Leaf Curl Virus or Pest Damage",
            "confidence": round(min(0.8, curl), 2),
            "severity": "moderate",
        })

    return diseases


def _detect_nutrient_deficiencies(metrics: Dict) -> list:
    deficiencies = []
    leaf_color = metrics.get("leaf_color_index", 0.5)
    yellow = metrics.get("yellow_coverage_pct", 0)
    brown = metrics.get("brown_coverage_pct", 0)

    if leaf_color < 0.4 or yellow > 20:
        if leaf_color < 0.25:
            deficiencies.append({
                "nutrient": "Nitrogen (N)",
                "severity": "high",
                "symptoms": "General chlorosis, pale green to yellow leaves",
            })
        elif yellow > 15:
            deficiencies.append({
                "nutrient": "Nitrogen (N)",
                "severity": "medium",
                "symptoms": "Yellowing of older leaves",
            })

    if brown > 15 and leaf_color < 0.5:
        deficiencies.append({
            "nutrient": "Phosphorus (P)",
            "severity": "medium" if brown > 20 else "low",
            "symptoms": "Brown leaf edges and dark spots",
        })

    if yellow > 10 and brown < 5:
        deficiencies.append({
            "nutrient": "Potassium (K)",
            "severity": "low",
            "symptoms": "Yellow leaf margins with green centers",
        })

    return deficiencies


def _generate_health_recommendations(
    health_score: float,
    diseases: list,
    deficiencies: list,
) -> list:
    recommendations = []

    if health_score < 50:
        recommendations.append(
            "Plant is in poor health. Consider immediate intervention."
        )
    elif health_score < 70:
        recommendations.append(
            "Plant health is fair. Review care routine and address issues."
        )

    for disease in diseases:
        recommendations.append(
            f"Address {disease['disease']} ({disease['severity']} severity). "
            "Consider removing affected leaves and applying appropriate treatment."
        )

    for deficiency in deficiencies:
        recommendations.append(
            f"Correct {deficiency['nutrient']} deficiency ({deficiency['severity']} severity). "
            f"Symptoms: {deficiency['symptoms']}."
        )

    if not recommendations:
        recommendations.append("Plant appears healthy. Continue regular care routine.")

    return recommendations
