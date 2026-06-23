from typing import Dict, List, Optional, Any
import logging

from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel, Field

from ..services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/recommendations", tags=["Recommendations"])


class WateringResponse(BaseModel):
    should_water: bool
    amount_ml: int
    best_time: str
    reason: str
    confidence: float
    factors: Dict[str, Any]
    source_rationale: Optional[Dict[str, Any]] = None


class FertilizerResponse(BaseModel):
    fertilizer_type: str
    n_p_k_ratio: str
    amount_g_per_sqm: float
    frequency: str
    reason: str
    ph_adjustment_needed: bool
    ph_adjustment: Optional[str] = None
    source_rationale: Optional[Dict[str, Any]] = None


class CropRecommendation(BaseModel):
    plant_name: str
    scientific_name: str
    type: str
    score: float
    difficulty: str
    growth_days_range: tuple
    sun_requirement: str
    spacing_cm: int
    companion_plants: List[str]


class SustainabilityTip(BaseModel):
    tip_id: str
    tip: str
    impact_score: float
    effort: str
    category: str


def get_recommendation_service() -> RecommendationService:
    return RecommendationService()


@router.get("/watering", response_model=WateringResponse)
async def watering_recommendation(
    plant_type: str = Query(..., description="Type of plant (e.g., tomato, rose)"),
    soil_moisture: float = Query(
        ..., ge=0, le=1, description="Soil moisture level (0-1)"
    ),
    temperature: float = Query(
        ..., description="Current temperature in Celsius"
    ),
    humidity: float = Query(
        ..., ge=0, le=1, description="Current humidity level (0-1)"
    ),
    rainfall_forecast: float = Query(
        0, ge=0, description="Expected rainfall in next 24h (mm)"
    ),
    service: RecommendationService = Depends(get_recommendation_service),
) -> WateringResponse:
    logger.info(
        "Watering recommendation for %s: moisture=%.2f temp=%.1f humidity=%.2f rain=%.1f",
        plant_type,
        soil_moisture,
        temperature,
        humidity,
        rainfall_forecast,
    )
    result = service.get_watering_recommendation(
        plant_type, soil_moisture, temperature, humidity, rainfall_forecast
    )
    return WateringResponse(**result)


@router.get("/fertilizer", response_model=FertilizerResponse)
async def fertilizer_recommendation(
    plant_type: str = Query(..., description="Type of plant (e.g., tomato, rose)"),
    growth_stage: str = Query(..., description="Current growth stage"),
    nutrient_level: str = Query(
        ..., description="Nutrient level (very_low, low, medium, high, very_high)"
    ),
    soil_ph: float = Query(
        ..., ge=0, le=14, description="Soil pH level (0-14)"
    ),
    service: RecommendationService = Depends(get_recommendation_service),
) -> FertilizerResponse:
    valid_stages = [
        "seed", "sprout", "seedling", "vegetative", "budding",
        "flowering", "fruiting", "harvest", "dormant",
    ]
    if growth_stage not in valid_stages:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid growth stage. Must be one of: {', '.join(valid_stages)}",
        )

    valid_nutrients = ["very_low", "low", "medium", "high", "very_high"]
    if nutrient_level not in valid_nutrients:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid nutrient level. Must be one of: {', '.join(valid_nutrients)}",
        )

    logger.info(
        "Fertilizer recommendation for %s: stage=%s nutrient=%s ph=%.1f",
        plant_type,
        growth_stage,
        nutrient_level,
        soil_ph,
    )
    result = service.get_fertilizer_recommendation(
        plant_type, growth_stage, nutrient_level, soil_ph
    )
    return FertilizerResponse(**result)


@router.get("/crop", response_model=List[CropRecommendation])
async def crop_recommendations(
    region: str = Query(..., description="Growing region"),
    season: str = Query(..., description="Growing season (cool, warm)"),
    soil_type: str = Query(..., description="Soil type"),
    experience_level: str = Query(
        ..., description="Gardening experience (beginner, intermediate, advanced)"
    ),
    service: RecommendationService = Depends(get_recommendation_service),
) -> List[CropRecommendation]:
    logger.info(
        "Crop recommendations: region=%s season=%s soil=%s experience=%s",
        region,
        season,
        soil_type,
        experience_level,
    )
    results = service.get_crop_recommendations(
        region, season, soil_type, experience_level
    )
    return [CropRecommendation(**r) for r in results]


@router.get("/sustainability", response_model=List[SustainabilityTip])
async def sustainability_tips(
    garden_type: str = Query(
        ..., description="Garden type (vegetable, flower, herb, mixed, indoor)"
    ),
    region: str = Query(..., description="Growing region"),
    current_practices: str = Query(
        ..., description="Comma-separated list of current practices"
    ),
    service: RecommendationService = Depends(get_recommendation_service),
) -> List[SustainabilityTip]:
    practices = [p.strip() for p in current_practices.split(",") if p.strip()]
    logger.info(
        "Sustainability tips: garden=%s region=%s practices=%s",
        garden_type,
        region,
        practices,
    )
    results = service.get_sustainability_tips(garden_type, region, practices)
    return [SustainabilityTip(**r) for r in results]
