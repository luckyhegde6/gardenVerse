from typing import Dict, List, Optional, Tuple
import numpy as np
from ..utils.plant_database import PlantDatabase
from ..utils.constants import (
    GrowthStage,
    GROWTH_STAGES,
    SoilConstants,
    EnvironmentalConstants,
    NutrientConstants,
)


class RecommendationEngine:
    def __init__(self) -> None:
        self.plant_db = PlantDatabase()
        self.soil_consts = SoilConstants()
        self.env_consts = EnvironmentalConstants()
        self.nutrient_consts = NutrientConstants()

    def watering_recommendation(
        self,
        plant_type: str,
        soil_moisture: float,
        temperature: float,
        humidity: float,
        rainfall_forecast: float,
    ) -> Dict:
        plant_info = self.plant_db.get_plant(plant_type)
        if not plant_info:
            plant_info = {
                "watering_frequency_days": 2,
                "type": plant_type,
            }

        base_frequency = plant_info.get("watering_frequency_days", 2)
        base_threshold = 0.3

        moisture_need = 1.0 - soil_moisture
        temp_factor = self._temperature_watering_factor(temperature)
        humidity_factor = self._humidity_watering_factor(humidity)
        rainfall_adjustment = rainfall_forecast * 5

        if soil_moisture < 0.2:
            urgency_bonus = 0.3
        elif soil_moisture < 0.35:
            urgency_bonus = 0.15
        else:
            urgency_bonus = 0.0

        need_score = (
            moisture_need * 0.4
            + temp_factor * 0.25
            + humidity_factor * 0.15
            + urgency_bonus
        )

        should_water = need_score > 0.45

        amount_base = {
            "herb": 100,
            "flower": 300,
            "vegetable": 400,
            "succulent": 150,
            "tree": 2000,
        }.get(plant_info.get("type", "vegetable"), 300)

        amount = amount_base * (1.0 + temp_factor * 0.5 - humidity_factor * 0.3)
        amount = max(50, min(amount, 5000))
        amount = round(amount - rainfall_adjustment)

        if rainfall_forecast > 10 and should_water:
            should_water = False
            reason = "Rainfall forecast provides sufficient water"
            amount = 0
            best_time = "not_needed"
        elif should_water:
            hour = self._best_watering_hour(temperature, humidity)
            best_time = f"{hour:02d}:00"
            reason = self._watering_reason(need_score, temperature, humidity, soil_moisture)
        else:
            best_time = "not_needed"
            reason = "Soil moisture levels are adequate"

        return {
            "should_water": should_water,
            "amount_ml": max(0, amount),
            "best_time": best_time,
            "reason": reason,
            "confidence": round(min(0.99, max(0.5, abs(need_score - 0.5) * 2)), 2),
            "factors": {
                "soil_moisture_deficit": round(1 - soil_moisture, 2),
                "temperature_factor": round(temp_factor, 2),
                "humidity_factor": round(humidity_factor, 2),
                "rainfall_credit_ml": round(rainfall_adjustment),
            },
        }

    def _temperature_watering_factor(self, temperature: float) -> float:
        if temperature <= 0:
            return 0.1
        elif temperature <= 10:
            return 0.2
        elif temperature <= 20:
            return 0.4
        elif temperature <= 30:
            return 0.7
        elif temperature <= 35:
            return 0.9
        else:
            return 1.0

    def _humidity_watering_factor(self, humidity: float) -> float:
        if humidity < 0.3:
            return 0.9
        elif humidity < 0.5:
            return 0.7
        elif humidity < 0.7:
            return 0.5
        elif humidity < 0.85:
            return 0.3
        else:
            return 0.1

    def _best_watering_hour(self, temperature: float, humidity: float) -> int:
        if temperature > 30:
            return 6
        elif temperature > 25:
            return 7
        elif temperature > 20:
            return 8
        elif humidity < 0.4:
            return 7
        else:
            return 9

    def _watering_reason(
        self,
        need_score: float,
        temperature: float,
        humidity: float,
        soil_moisture: float,
    ) -> str:
        reasons = []
        if soil_moisture < 0.25:
            reasons.append("soil moisture critically low")
        elif soil_moisture < 0.35:
            reasons.append("soil moisture below optimal range")
        if temperature > 30:
            reasons.append("high temperature increasing evapotranspiration")
        elif temperature > 25:
            reasons.append("warm conditions increase water needs")
        if humidity < 0.4:
            reasons.append("low humidity causing rapid moisture loss")

        if not reasons:
            reasons.append("scheduled watering based on plant needs")

        return ". ".join(r.capitalize() for r in reasons) + "."

    def fertilizer_recommendation(
        self,
        plant_type: str,
        growth_stage: str,
        nutrient_level: str,
        soil_ph: float,
    ) -> Dict:
        plant_info = self.plant_db.get_plant(plant_type)
        recommended_npk = plant_info.get("fertilizer_npk", "10-10-10") if plant_info else "10-10-10"
        n, p, k = [int(x) for x in recommended_npk.split("-")]

        nutrient_score = self.nutrient_consts.NUTRIENT_SCORE_MAP.get(
            nutrient_level, 0.5
        )

        if soil_ph < 6.0 or soil_ph > 7.5:
            ph_issue = True
            if soil_ph < 6.0:
                ph_adjustment = "lime"
            else:
                ph_adjustment = "sulfur"
        else:
            ph_issue = False
            ph_adjustment = "none"

        stage_multiplier = {
            "seed": 0.2,
            "sprout": 0.3,
            "seedling": 0.5,
            "vegetative": 1.0,
            "budding": 0.8,
            "flowering": 0.7,
            "fruiting": 0.9,
            "harvest": 0.3,
            "dormant": 0.0,
        }.get(growth_stage, 0.5)

        if nutrient_score > 0.7:
            amount = "None required - nutrient levels sufficient"
            frequency = "none"
            reason = "Existing nutrient levels are adequate"
            return {
                "fertilizer_type": "none",
                "amount": amount,
                "frequency": frequency,
                "reason": reason,
                "n_p_k_ratio": "0-0-0",
            }

        if nutrient_score < 0.3:
            amount_mult = 1.5
            deficit_type = "severe"
        elif nutrient_score < 0.5:
            amount_mult = 1.0
            deficit_type = "moderate"
        else:
            amount_mult = 0.5
            deficit_type = "mild"

        base_amount = 100 * stage_multiplier * amount_mult
        base_amount = max(20, min(500, base_amount))

        if nutrient_level in ["very_low", "low"]:
            if n < p and n < k:
                fert_type = "nitrogen_rich"
                npk_str = f"{n + 5}-{p}-{k}"
            elif p < n and p < k:
                fert_type = "phosphorus_rich"
                npk_str = f"{n}-{p + 5}-{k}"
            elif k < n and k < p:
                fert_type = "potassium_rich"
                npk_str = f"{n}-{p}-{k + 5}"
            else:
                fert_type = "balanced_npk"
                npk_str = recommended_npk
        else:
            fert_type = "balanced_npk"
            npk_str = recommended_npk

        frequency = f"Every {max(7, int(14 * (1 - nutrient_score)))} days" if stage_multiplier > 0 else "none"

        if growth_stage in ["vegetative", "seedling"]:
            reason = f"{deficit_type.title()} nitrogen demand for leaf growth at {growth_stage} stage"
        elif growth_stage in ["flowering", "fruiting"]:
            reason = f"{deficit_type.title()} phosphorus/potassium need for {growth_stage} stage"
        else:
            reason = f"{deficit_type.title()} general nutrient deficiency during {growth_stage} stage"

        if ph_issue:
            reason += f". Apply {ph_adjustment} to adjust soil pH from {soil_ph}"

        return {
            "fertilizer_type": fert_type.replace("_", " ").title(),
            "n_p_k_ratio": npk_str,
            "amount_g_per_sqm": round(base_amount, 1),
            "frequency": frequency,
            "reason": reason + ".",
            "ph_adjustment_needed": ph_issue,
            "ph_adjustment": ph_adjustment if ph_issue else None,
        }

    def crop_recommendation(
        self,
        region: str,
        season: str,
        soil_type: str,
        experience_level: str,
    ) -> List[Dict]:
        all_plants = self.plant_db.get_all_plants()
        recommendations = []

        season_crops = self.plant_db.get_plants_by_season(season)

        if not season_crops:
            season_crops = [
                {"name": name, **info} for name, info in all_plants.items()
            ]

        for crop in season_crops:
            name = crop["name"]
            if not self.plant_db.is_compatible_with_region(name, region):
                continue

            score = 0.5

            if crop.get("season") == season:
                score += 0.25
            if crop.get("difficulty") == "easy":
                score += 0.15
            elif crop.get("difficulty") == "moderate" and experience_level in [
                "intermediate",
                "advanced",
            ]:
                score += 0.1
            elif crop.get("difficulty") == "hard" and experience_level == "advanced":
                score += 0.1
            elif crop.get("difficulty") == "hard" and experience_level == "beginner":
                score -= 0.15

            if soil_type in crop.get("soil_ph_min", 0) and soil_type:
                score += 0.05

            if region.lower() == "tropical" and crop.get("temperature_min_c", 0) > 15:
                score += 0.1
            elif region.lower() == "temperate" and crop.get("temperature_max_c", 40) < 35:
                score += 0.1
            elif region.lower() == "arid" and crop.get("type") in ["succulent", "herb"]:
                score += 0.1

            score = min(1.0, max(0.0, score + np.random.uniform(-0.05, 0.05)))

            recommendations.append({
                "plant_name": name.replace("_", " ").title(),
                "scientific_name": crop["scientific_name"],
                "type": crop["type"],
                "score": round(score, 3),
                "difficulty": crop["difficulty"],
                "growth_days_range": (crop["growth_days_min"], crop["growth_days_max"]),
                "sun_requirement": crop["sun_requirement"],
                "spacing_cm": crop["spacing_cm"],
                "companion_plants": [
                    p.replace("_", " ").title() for p in crop.get("companion_plants", [])
                ],
            })

        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:10]

    def sustainability_tips(
        self,
        garden_type: str,
        region: str,
        current_practices: List[str],
    ) -> List[Dict]:
        all_tips = {
            "composting": {
                "tip": "Start a compost pile for kitchen and garden waste",
                "impact": 0.9,
                "effort": "medium",
                "category": "waste_management",
            },
            "rainwater_harvesting": {
                "tip": "Install rain barrels to collect rainwater for irrigation",
                "impact": 0.85,
                "effort": "medium",
                "category": "water_conservation",
            },
            "drip_irrigation": {
                "tip": "Switch to drip irrigation to reduce water usage by up to 50%",
                "impact": 0.8,
                "effort": "high",
                "category": "water_conservation",
            },
            "native_plants": {
                "tip": "Plant native species adapted to your region for lower maintenance",
                "impact": 0.75,
                "effort": "low",
                "category": "biodiversity",
            },
            "mulching": {
                "tip": "Apply organic mulch to retain moisture and suppress weeds",
                "impact": 0.7,
                "effort": "low",
                "category": "soil_health",
            },
            "crop_rotation": {
                "tip": "Rotate crops annually to prevent soil depletion and disease buildup",
                "impact": 0.85,
                "effort": "medium",
                "category": "soil_health",
            },
            "cover_cropping": {
                "tip": "Plant cover crops in off-season to protect and enrich soil",
                "impact": 0.8,
                "effort": "medium",
                "category": "soil_health",
            },
            "beneficial_insects": {
                "tip": "Create habitat for pollinators and beneficial insects",
                "impact": 0.7,
                "effort": "low",
                "category": "biodiversity",
            },
            "organic_pest_control": {
                "tip": "Use neem oil and companion planting instead of chemical pesticides",
                "impact": 0.75,
                "effort": "medium",
                "category": "chemical_reduction",
            },
            "vermicomposting": {
                "tip": "Use worm composting for nutrient-rich fertilizer",
                "impact": 0.7,
                "effort": "medium",
                "category": "waste_management",
            },
            "perennial_plants": {
                "tip": "Incorporate perennial plants that return year after year",
                "impact": 0.65,
                "effort": "low",
                "category": "biodiversity",
            },
            "solar_garden_lights": {
                "tip": "Use solar-powered garden lighting to reduce electricity use",
                "impact": 0.4,
                "effort": "low",
                "category": "energy",
            },
            "no_till_gardening": {
                "tip": "Practice no-till gardening to preserve soil structure and carbon",
                "impact": 0.8,
                "effort": "high",
                "category": "soil_health",
            },
            "greywater_system": {
                "tip": "Use greywater from sinks and showers for garden irrigation",
                "impact": 0.75,
                "effort": "high",
                "category": "water_conservation",
            },
            "seed_saving": {
                "tip": "Save seeds from your best plants for next season",
                "impact": 0.5,
                "effort": "low",
                "category": "sustainability",
            },
        }

        region_adjustments = {
            "arid": ["rainwater_harvesting", "drip_irrigation", "mulching"],
            "tropical": ["composting", "native_plants", "cover_cropping"],
            "temperate": ["crop_rotation", "composting", "perennial_plants"],
            "mediterranean": ["drip_irrigation", "mulching", "native_plants"],
        }

        priority_keys = region_adjustments.get(region.lower(), [])
        garden_adjustments = {
            "vegetable": ["crop_rotation", "composting", "organic_pest_control"],
            "flower": ["native_plants", "beneficial_insects", "mulching"],
            "herb": ["companion_planting", "composting", "drip_irrigation"],
            "mixed": ["composting", "rainwater_harvesting", "native_plants"],
            "indoor": ["vermicomposting", "solar_garden_lights"],
        }

        garden_relevant = garden_adjustments.get(garden_type.lower(), [])

        practice_set = {p.lower().replace(" ", "_") for p in current_practices}

        scored_tips = []
        for key, tip_info in all_tips.items():
            if key in practice_set:
                continue

            score = tip_info["impact"]

            if key in priority_keys:
                score *= 1.3
            if key in garden_relevant:
                score *= 1.2
            if tip_info["effort"] == "low" and score > 0.5:
                score *= 1.1

            score = min(1.0, score)

            scored_tips.append({
                "tip_id": key,
                "tip": tip_info["tip"],
                "impact_score": round(score, 3),
                "effort": tip_info["effort"],
                "category": tip_info["category"].replace("_", " ").title(),
            })

        scored_tips.sort(key=lambda x: x["impact_score"], reverse=True)
        return scored_tips[:8]
