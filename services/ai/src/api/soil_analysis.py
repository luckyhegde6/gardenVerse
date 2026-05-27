from typing import Dict, List, Optional
import logging
import random

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from ..utils.constants import SoilConstants

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/soil", tags=["Soil Analysis"])


class SensorReadings(BaseModel):
    moisture: float = Field(..., ge=0, le=1, description="Soil moisture (0-1)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH level")
    temperature: float = Field(..., description="Soil temperature in Celsius")
    light: float = Field(..., ge=0, description="Light intensity in lux")
    humidity: float = Field(..., ge=0, le=1, description="Air humidity (0-1)")


class SoilAnalysisRequest(BaseModel):
    sensor_readings: SensorReadings


class SoilIssue(BaseModel):
    issue: str
    severity: str
    description: str
    recommendation: str


class CropSuitability(BaseModel):
    plant_name: str
    suitability_score: float
    reason: str


class SoilAnalysisResponse(BaseModel):
    soil_health_score: float
    soil_type_estimate: str
    moisture_status: str
    ph_status: str
    temperature_status: str
    recommendations: list
    suitable_crops: list
    issues: list


@router.post("/analyze", response_model=SoilAnalysisResponse)
async def analyze_soil(
    request: SoilAnalysisRequest,
) -> SoilAnalysisResponse:
    readings = request.sensor_readings
    logger.info("Soil analysis: moisture=%.2f ph=%.1f temp=%.1f", readings.moisture, readings.ph, readings.temperature)

    issues = []
    recommendations = []

    moisture_status = _assess_moisture(readings.moisture, issues, recommendations)
    ph_status = _assess_ph(readings.ph, issues, recommendations)
    temp_status = _assess_temperature(readings.temperature, issues, recommendations)

    soil_type = _estimate_soil_type(readings)

    health_score = _compute_soil_health(readings, len(issues))

    suitable_crops = _find_suitable_crops(readings, soil_type)

    return SoilAnalysisResponse(
        soil_health_score=health_score,
        soil_type_estimate=soil_type,
        moisture_status=moisture_status,
        ph_status=ph_status,
        temperature_status=temp_status,
        recommendations=recommendations,
        suitable_crops=suitable_crops,
        issues=issues,
    )


def _assess_moisture(moisture: float, issues: list, recommendations: list) -> str:
    optimal_min, optimal_max = SoilConstants.OPTIMAL_MOISTURE_RANGE

    if moisture < 0.2:
        issues.append(SoilIssue(
            issue="Critical Low Moisture",
            severity="high",
            description=f"Soil moisture at {moisture*100:.0f}% - well below wilting point",
            recommendation="Water immediately and consider adding water-retaining mulch",
        ))
        recommendations.append("Increase watering frequency and add organic mulch")
        return "critically_dry"
    elif moisture < optimal_min:
        issues.append(SoilIssue(
            issue="Low Moisture",
            severity="medium",
            description=f"Soil moisture at {moisture*100:.0f}% - below optimal range",
            recommendation="Increase watering schedule and check for drainage issues",
        ))
        recommendations.append("Water more frequently; consider drip irrigation")
        return "dry"
    elif optimal_min <= moisture <= optimal_max:
        return "optimal"
    elif moisture < 0.85:
        recommendations.append("Reduce watering frequency; soil moisture is adequate")
        return "moist"
    else:
        issues.append(SoilIssue(
            issue="Excess Moisture / Waterlogging",
            severity="high",
            description=f"Soil moisture at {moisture*100:.0f}% - risk of root rot",
            recommendation="Improve drainage, reduce watering, and consider raised beds",
        ))
        recommendations.append("Improve drainage; reduce watering immediately")
        return "waterlogged"


def _assess_ph(ph: float, issues: list, recommendations: list) -> str:
    optimal_min, optimal_max = SoilConstants.OPTIMAL_SOIL_PH_RANGE

    if ph < 5.0:
        issues.append(SoilIssue(
            issue="Extremely Acidic Soil",
            severity="high",
            description=f"Soil pH {ph} - too acidic for most plants",
            recommendation="Apply agricultural lime (dolomitic lime) at 2-3 kg per 10 sqm",
        ))
        recommendations.append("Add lime to raise pH; retest in 4-6 weeks")
        return "extremely_acidic"
    elif ph < optimal_min:
        issues.append(SoilIssue(
            issue="Acidic Soil",
            severity="medium",
            description=f"Soil pH {ph} - below optimal range (6.0-7.5)",
            recommendation="Apply lime or wood ash to gradually raise pH",
        ))
        recommendations.append("Apply garden lime to raise pH toward neutral")
        return "acidic"
    elif optimal_min <= ph <= optimal_max:
        return "optimal"
    elif ph <= 8.5:
        recommendations.append("Soil pH is slightly alkaline but acceptable for most plants")
        return "slightly_alkaline"
    else:
        issues.append(SoilIssue(
            issue="Highly Alkaline Soil",
            severity="high",
            description=f"Soil pH {ph} - too alkaline for many plants",
            recommendation="Add sulfur or organic matter like peat moss to lower pH",
        ))
        recommendations.append("Add sulfur or peat moss to lower pH")
        return "highly_alkaline"


def _assess_temperature(temp: float, issues: list, recommendations: list) -> str:
    if temp < 5:
        issues.append(SoilIssue(
            issue="Cold Soil",
            severity="high",
            description=f"Soil temperature {temp}C - too cold for seed germination",
            recommendation="Use row covers or wait for soil to warm up",
        ))
        return "too_cold"
    elif temp < 12:
        issues.append(SoilIssue(
            issue="Cool Soil",
            severity="medium",
            description=f"Soil temperature {temp}C - cool, limited root activity",
            recommendation="Consider using black plastic mulch to warm soil",
        ))
        return "cool"
    elif 12 <= temp <= 30:
        return "optimal"
    elif temp <= 35:
        recommendations.append("Monitor soil moisture closely in warm conditions")
        return "warm"
    else:
        issues.append(SoilIssue(
            issue="Hot Soil",
            severity="high",
            description=f"Soil temperature {temp}C - heat stress on roots",
            recommendation="Apply thick mulch to insulate soil and water deeply",
        ))
        return "hot"


def _estimate_soil_type(readings: SensorReadings) -> str:
    m = readings.moisture
    if 0.45 <= m <= 0.65:
        return "loam"
    elif m > 0.65:
        if m > 0.8:
            return "clay"
        return "silty_clay"
    elif m < 0.35:
        return "sandy"
    elif m < 0.45:
        return "sandy_loam"
    else:
        return "loam"


def _compute_soil_health(readings: SensorReadings, issue_count: int) -> float:
    score = 70.0

    m_min, m_max = SoilConstants.OPTIMAL_MOISTURE_RANGE
    ph_min, ph_max = SoilConstants.OPTIMAL_SOIL_PH_RANGE

    if m_min <= readings.moisture <= m_max:
        score += 15
    else:
        score -= abs(readings.moisture - (m_min + m_max) / 2) * 30

    if ph_min <= readings.ph <= ph_max:
        score += 10
    else:
        score -= abs(readings.ph - (ph_min + ph_max) / 2) * 8

    if 15 <= readings.temperature <= 28:
        score += 5
    else:
        score -= abs(readings.temperature - 22) * 1.5

    score -= issue_count * 5

    return round(max(0, min(100, score)), 1)


def _find_suitable_crops(readings: SensorReadings, soil_type: str) -> List[Dict]:
    from ..utils.plant_database import PlantDatabase

    db = PlantDatabase()
    all_plants = db.get_all_plants()
    suitable = []

    for name, info in all_plants.items():
        ph_ok = info["soil_ph_min"] <= readings.ph <= info["soil_ph_max"]
        temp_ok = info["temperature_min_c"] <= readings.temperature <= info["temperature_max_c"]

        if readings.moisture < 0.3 and info["watering_frequency_days"] >= 3:
            moisture_ok = True
        elif 0.3 <= readings.moisture <= 0.75:
            moisture_ok = True
        elif readings.moisture > 0.75 and info["watering_frequency_days"] <= 2:
            moisture_ok = True
        else:
            moisture_ok = False

        if ph_ok and temp_ok and moisture_ok:
            score = 0.5
            if ph_ok:
                score += 0.2
            if temp_ok:
                score += 0.2
            if moisture_ok:
                score += 0.1

            suitable.append(CropSuitability(
                plant_name=name.replace("_", " ").title(),
                suitability_score=round(score, 3),
                reason=_suitability_reason(name, readings, info),
            ))

    suitable.sort(key=lambda x: x.suitability_score, reverse=True)
    return suitable[:8]


def _suitability_reason(name: str, readings: SensorReadings, info: Dict) -> str:
    reasons = []
    if info["soil_ph_min"] <= readings.ph <= info["soil_ph_max"]:
        reasons.append("pH within optimal range")
    if info["temperature_min_c"] <= readings.temperature <= info["temperature_max_c"]:
        reasons.append("temperature suitable")
    if info["sun_requirement"] == "full_sun" and readings.light > 30000:
        reasons.append("light conditions ideal")

    return "; ".join(reasons) if reasons else "Tolerates current conditions"
