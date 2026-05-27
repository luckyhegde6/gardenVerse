from typing import Dict, Optional
import logging

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from ..models.growth_model import GrowthModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/growth", tags=["Growth Tracking"])


class HealthMetrics(BaseModel):
    leaf_color_index: float = Field(0.5, ge=0, le=1)
    growth_rate: float = Field(0.5, ge=0, le=1)
    specific_leaf_area: float = Field(0.5, ge=0, le=1)
    leaf_curl_index: float = Field(0.0, ge=0, le=1)
    stem_strength: float = Field(0.5, ge=0, le=1)


class EnvironmentalData(BaseModel):
    temperature_c: float = Field(25, description="Temperature in Celsius")
    humidity: float = Field(0.6, ge=0, le=1, description="Humidity level (0-1)")
    light_lux: float = Field(30000, ge=0, description="Light intensity in lux")
    soil_moisture: float = Field(0.5, ge=0, le=1)
    co2_ppm: Optional[float] = Field(None, ge=0)


class GrowthAnalysisRequest(BaseModel):
    plant_species: str
    days_since_planted: int = Field(..., ge=0)
    health_metrics: HealthMetrics = Field(default_factory=HealthMetrics)
    environmental_data: EnvironmentalData = Field(default_factory=EnvironmentalData)


class Issue(BaseModel):
    type: str
    severity: str
    description: str
    likely_cause: str
    recommendation: str


class HealthAssessment(BaseModel):
    score: float
    status: str
    metrics_summary: Dict


class GrowthAnalysisResponse(BaseModel):
    current_stage: str
    stage_description: str
    days_since_planted: int
    estimated_maturity_days: int
    estimated_maturity_date: Optional[str] = None
    growth_progress_pct: float
    stage_transition: Optional[int] = None
    health_assessment: HealthAssessment
    issues_detected: list
    care_recommendations: list


def get_growth_model() -> GrowthModel:
    return GrowthModel()


@router.post("/analyze", response_model=GrowthAnalysisResponse)
async def analyze_growth(
    request: GrowthAnalysisRequest,
    model: GrowthModel = Depends(get_growth_model),
) -> GrowthAnalysisResponse:
    logger.info(
        "Growth analysis for %s: days=%d",
        request.plant_species,
        request.days_since_planted,
    )

    result = model.analyze(
        plant_species=request.plant_species,
        days_since_planted=request.days_since_planted,
        health_metrics=request.health_metrics.model_dump(),
        environmental_data=request.environmental_data.model_dump(),
    )

    return GrowthAnalysisResponse(**result)
