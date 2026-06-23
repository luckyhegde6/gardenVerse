from typing import Dict, Optional, Any
import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel, Field

from ..services.image_processor import ImageProcessor
from ..models.plantnet_mock import PlantNetMock
from ..models.disease_model_mock import DiseaseModelMock

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/plant", tags=["Plant Health"])


class HealthAnalysisResponse(BaseModel):
    health_score: float = Field(..., ge=0, le=100)
    status: str
    disease_name: Optional[str] = None
    disease_confidence: Optional[float] = None
    uncertainty: str = "low"
    severity: Optional[str] = None
    diseases_detected: list = []
    leaf_metrics: Dict[str, Any]
    nutrient_deficiencies: list = []
    recommendations: list = []
    analysis_disclaimer: Optional[str] = None


def get_image_processor() -> ImageProcessor:
    return ImageProcessor()


def get_plantnet_model() -> PlantNetMock:
    return PlantNetMock()


def get_disease_model() -> DiseaseModelMock:
    return DiseaseModelMock()


@router.post("/health", response_model=HealthAnalysisResponse)
async def analyze_health(
    image: UploadFile = File(..., description="Plant image for health analysis"),
    plant_species: Optional[str] = Form(None, description="Optional plant species hint"),
    processor: ImageProcessor = Depends(get_image_processor),
    plantnet: PlantNetMock = Depends(get_plantnet_model),
    disease_model: DiseaseModelMock = Depends(get_disease_model),
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
    image_array = processor.load_from_bytes(contents)

    if not plant_species:
        plant_result = plantnet.identify(image_array)
        plant_species = plant_result["scientific_name"]

    disease_result = disease_model.detect(image_array, plant_species.lower())

    health_score = disease_result.get("health_score", 50) if disease_result.get("disease_detected") else _compute_health_score(leaf_metrics)

    disease_uncertainty = disease_result.get("uncertainty", "low")
    deficiency_list = _detect_nutrient_deficiencies(leaf_metrics)
    recommendations = _generate_health_recommendations(health_score, disease_result, deficiency_list)

    disclaimer = disease_result.get("analysis_disclaimer") or (
        "This is a simulated analysis. For accurate diagnosis, consult a plant pathology expert."
    )

    return HealthAnalysisResponse(
        health_score=health_score,
        status="healthy" if health_score >= 70 else "fair" if health_score >= 45 else "poor",
        disease_name=disease_result.get("disease_name"),
        disease_confidence=disease_result.get("confidence"),
        uncertainty=disease_uncertainty,
        severity=disease_result.get("severity"),
        diseases_detected=[disease_result] if disease_result.get("disease_detected") else [],
        leaf_metrics=leaf_metrics,
        nutrient_deficiencies=deficiency_list,
        recommendations=recommendations,
        analysis_disclaimer=disclaimer,
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


def _detect_nutrient_deficiencies(metrics: Dict) -> list:
    deficiencies = []
    leaf_color = metrics.get("leaf_color_index", 0.5)
    yellow = metrics.get("yellow_coverage_pct", 0)
    brown = metrics.get("brown_coverage_pct", 0)
    if leaf_color < 0.4 or yellow > 20:
        if leaf_color < 0.25:
            deficiencies.append({"nutrient": "Nitrogen (N)", "severity": "high", "symptoms": "General chlorosis, pale green to yellow leaves"})
        elif yellow > 15:
            deficiencies.append({"nutrient": "Nitrogen (N)", "severity": "medium", "symptoms": "Yellowing of older leaves"})
    if brown > 15 and leaf_color < 0.5:
        deficiencies.append({"nutrient": "Phosphorus (P)", "severity": "medium" if brown > 20 else "low", "symptoms": "Brown leaf edges and dark spots"})
    if yellow > 10 and brown < 5:
        deficiencies.append({"nutrient": "Potassium (K)", "severity": "low", "symptoms": "Yellow leaf margins with green centers"})
    return deficiencies


def _generate_health_recommendations(health_score: float, disease_result: Dict, deficiencies: list) -> list:
    recommendations = []
    if health_score < 50:
        recommendations.append("Plant is in poor health. Consider immediate intervention.")
    elif health_score < 70:
        recommendations.append("Plant health is fair. Review care routine and address issues.")
    if disease_result.get("disease_detected"):
        recommendations.append(
            f"Treat {disease_result['disease_name']} ({disease_result.get('severity', 'unknown')} severity). "
            f"Follow recommended treatment plan."
        )
    for d in deficiencies:
        recommendations.append(f"Correct {d['nutrient']} deficiency ({d['severity']} severity). Symptoms: {d['symptoms']}.")
    if not recommendations:
        recommendations.append("Plant appears healthy. Continue regular care routine.")
    return recommendations
