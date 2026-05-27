from typing import Dict, List, Optional, Tuple
from ..utils.constants import GrowthStage, GROWTH_STAGES
from ..utils.plant_database import PlantDatabase


class GrowthModel:
    def __init__(self) -> None:
        self.plant_db = PlantDatabase()

    def analyze(
        self,
        plant_species: str,
        days_since_planted: int,
        health_metrics: Dict[str, float],
        environmental_data: Dict[str, float],
    ) -> Dict:
        plant_info = self.plant_db.get_plant(plant_species)

        growth_days = (
            (plant_info["growth_days_min"], plant_info["growth_days_max"])
            if plant_info
            else (60, 120)
        )

        current_stage = self._predict_stage(days_since_planted, growth_days)
        estimated_maturity = self._estimate_maturity(days_since_planted, growth_days)
        growth_progress = self._calculate_progress(days_since_planted, growth_days)
        issues = self._detect_issues(health_metrics, environmental_data, plant_info)

        stage_info = GROWTH_STAGES.get(current_stage, {})

        return {
            "current_stage": current_stage.value,
            "stage_description": stage_info.get("description", ""),
            "days_since_planted": days_since_planted,
            "estimated_maturity_days": estimated_maturity,
            "estimated_maturity_date": None,
            "growth_progress_pct": round(growth_progress, 1),
            "stage_transition": self._days_to_next_stage(
                days_since_planted, growth_days, current_stage
            ),
            "health_assessment": self._assess_health(health_metrics),
            "issues_detected": issues,
            "care_recommendations": self._care_recommendations(
                current_stage, environmental_data, issues
            ),
        }

    def _predict_stage(
        self, days_since_planted: int, growth_days: Tuple[int, int]
    ) -> GrowthStage:
        min_days, max_days = growth_days
        progress = days_since_planted / max_days if max_days > 0 else 0

        if days_since_planted <= 0:
            return GrowthStage.SEED
        elif progress <= 0.05:
            return GrowthStage.SPROUT
        elif progress <= 0.15:
            return GrowthStage.SEEDLING
        elif progress <= 0.45:
            return GrowthStage.VEGETATIVE
        elif progress <= 0.55:
            return GrowthStage.BUDDING
        elif progress <= 0.70:
            return GrowthStage.FLOWERING
        elif progress <= 0.85:
            return GrowthStage.FRUITING
        elif progress <= 1.0:
            return GrowthStage.HARVEST
        else:
            return GrowthStage.DORMANT

    def _estimate_maturity(
        self, days_since_planted: int, growth_days: Tuple[int, int]
    ) -> int:
        min_days, max_days = growth_days
        mid_point = (min_days + max_days) // 2
        remaining = max(0, mid_point - days_since_planted)
        return max(0, days_since_planted + remaining)

    def _calculate_progress(
        self, days_since_planted: int, growth_days: Tuple[int, int]
    ) -> float:
        _, max_days = growth_days
        if max_days <= 0:
            return 0.0
        progress = (days_since_planted / max_days) * 100
        return min(100.0, max(0.0, progress))

    def _detect_issues(
        self,
        health_metrics: Dict[str, float],
        environmental_data: Dict[str, float],
        plant_info: Optional[Dict],
    ) -> List[Dict]:
        issues = []

        leaf_color = health_metrics.get("leaf_color_index", 0.5)
        if leaf_color < 0.3:
            issues.append({
                "type": "chlorosis",
                "severity": "high" if leaf_color < 0.2 else "medium",
                "description": "Significant leaf yellowing detected",
                "likely_cause": "Nitrogen deficiency or overwatering",
                "recommendation": "Check soil nitrogen levels and adjust watering schedule",
            })

        growth_rate = health_metrics.get("growth_rate", 0.5)
        if growth_rate < 0.3:
            issues.append({
                "type": "stunted_growth",
                "severity": "high" if growth_rate < 0.15 else "medium",
                "description": "Growth rate below expected",
                "likely_cause": "Insufficient light, nutrients, or root binding",
                "recommendation": "Evaluate light exposure and consider transplanting",
            })

        leaf_curl = health_metrics.get("leaf_curl_index", 0.0)
        if leaf_curl > 0.6:
            issues.append({
                "type": "leaf_curling",
                "severity": "medium",
                "description": "Leaves showing curling or cupping",
                "likely_cause": "Heat stress, pest damage, or herbicide exposure",
                "recommendation": "Check for pests and ensure adequate watering",
            })

        specific_leaf_area = health_metrics.get("specific_leaf_area", 0.5)
        if specific_leaf_area < 0.2:
            issues.append({
                "type": "leaf_damage",
                "severity": "high",
                "description": "Significant leaf tissue damage detected",
                "likely_cause": "Pest infestation or fungal infection",
                "recommendation": "Inspect for pests and apply appropriate treatment",
            })

        temp = environmental_data.get("temperature_c", 25)
        if plant_info:
            if temp > plant_info.get("temperature_max_c", 35):
                issues.append({
                    "type": "heat_stress",
                    "severity": "high",
                    "description": f"Temperature ({temp}C) exceeds plant maximum ({plant_info.get('temperature_max_c')}C)",
                    "likely_cause": "Extreme weather or improper placement",
                    "recommendation": "Provide shade and increase watering frequency",
                })
            elif temp < plant_info.get("temperature_min_c", 5):
                issues.append({
                    "type": "cold_stress",
                    "severity": "high",
                    "description": f"Temperature ({temp}C) below plant minimum ({plant_info.get('temperature_min_c')}C)",
                    "likely_cause": "Cold snap or improper planting time",
                    "recommendation": "Use row covers or move to protected location",
                })

        humidity = environmental_data.get("humidity", 0.5)
        if plant_info:
            optimal_humidity = plant_info.get("humidity_optimal_pct", 0.6)
            if abs(humidity - optimal_humidity) > 0.25:
                issues.append({
                    "type": "humidity_stress",
                    "severity": "medium",
                    "description": f"Humidity ({humidity*100:.0f}%) outside optimal range for this plant",
                    "likely_cause": "Environmental conditions not ideal",
                    "recommendation": "Adjust microclimate or consider greenhouse growing",
                })

        return issues

    def _assess_health(self, health_metrics: Dict[str, float]) -> Dict:
        weights = {
            "leaf_color_index": 0.3,
            "growth_rate": 0.25,
            "specific_leaf_area": 0.15,
            "leaf_curl_index": 0.15,
            "stem_strength": 0.15,
        }

        total_score = 0.0
        total_weight = 0.0

        for metric, weight in weights.items():
            value = health_metrics.get(metric, 0.5)
            total_score += value * weight
            total_weight += weight

        health_score = (total_score / total_weight) * 100 if total_weight > 0 else 50

        if health_score >= 80:
            status = "healthy"
        elif health_score >= 60:
            status = "fair"
        elif health_score >= 40:
            status = "poor"
        else:
            status = "critical"

        return {
            "score": round(health_score, 1),
            "status": status,
            "metrics_summary": {
                k: round(v, 3) for k, v in health_metrics.items()
            },
        }

    def _days_to_next_stage(
        self,
        days_since_planted: int,
        growth_days: Tuple[int, int],
        current_stage: GrowthStage,
    ) -> Optional[int]:
        _, max_days = growth_days
        stages = list(GrowthStage)
        try:
            current_idx = stages.index(current_stage)
            if current_idx >= len(stages) - 1:
                return None
            next_stage = stages[current_idx + 1]
            next_min = GROWTH_STAGES[next_stage]["min_days"]
            return max(0, next_min - days_since_planted)
        except (ValueError, IndexError, KeyError):
            return None

    def _care_recommendations(
        self,
        current_stage: GrowthStage,
        environmental_data: Dict[str, float],
        issues: List[Dict],
    ) -> List[str]:
        recommendations = []
        stage_info = GROWTH_STAGES.get(current_stage, {})

        water = stage_info.get("water_needed", "medium")
        light = stage_info.get("light_needed", "partial")

        recommendations.append(f"Watering need: {water}")
        recommendations.append(f"Light requirement: {light}")

        if issues:
            for issue in issues[:2]:
                recommendations.append(issue["recommendation"])

        temp = environmental_data.get("temperature_c", 25)
        if temp > 30:
            recommendations.append("Consider providing shade during peak afternoon hours")
        elif temp < 10:
            recommendations.append("Protect from cold temperatures with mulch or covers")

        recommendations.append(f"Current stage '{current_stage.value}': {stage_info.get('description', '')}")

        return recommendations
