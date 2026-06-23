from typing import Optional, Dict, Any
import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel

from ..services.image_processor import ImageProcessor
from ..models.disease_model_mock import DiseaseModelMock

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/disease", tags=["Disease Detection"])


class Treatment(BaseModel):
    method: str
    description: str
    effectiveness: float
    organic: bool


class DiseaseDetectResponse(BaseModel):
    disease_detected: bool
    disease_name: Optional[str] = None
    causal_agent: Optional[str] = None
    disease_type: Optional[str] = None
    confidence: Optional[float] = None
    uncertainty: str = "low"
    uncertainty_reason: Optional[str] = None
    severity: Optional[str] = None
    severity_description: Optional[str] = None
    symptoms_matched: list = []
    symptoms_quoted: list = []
    treatments: list = []
    prevention_tips: list = []
    database_source: Optional[Dict[str, Any]] = None
    health_score: Optional[float] = None
    message: Optional[str] = None
    analysis_disclaimer: Optional[str] = None


def get_image_processor() -> ImageProcessor:
    return ImageProcessor()


def get_disease_model() -> DiseaseModelMock:
    return DiseaseModelMock()


@router.post("/detect", response_model=DiseaseDetectResponse)
async def detect_disease(
    image: UploadFile = File(..., description="Plant leaf image for disease detection"),
    plant_species: str = Form(..., description="Plant species name (e.g., tomato, rose)"),
    processor: ImageProcessor = Depends(get_image_processor),
    model: DiseaseModelMock = Depends(get_disease_model),
) -> DiseaseDetectResponse:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    valid, error = processor.validate_image(contents)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid image: {error}")

    image_array = processor.load_from_bytes(contents)
    result = model.detect(image_array, plant_species.lower())

    logger.info(
        "Disease detection for %s: detected=%s disease=%s confidence=%.4f",
        plant_species,
        result.get("disease_detected", False),
        result.get("disease_name", "N/A"),
        result.get("confidence", 0),
    )

    return DiseaseDetectResponse(**result)
