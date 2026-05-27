from typing import Dict, List, Optional
from ..models.recommendation_engine import RecommendationEngine
from ..utils.plant_database import PlantDatabase


class RecommendationService:
    def __init__(self) -> None:
        self.engine = RecommendationEngine()
        self.plant_db = PlantDatabase()

    def get_watering_recommendation(
        self,
        plant_type: str,
        soil_moisture: float,
        temperature: float,
        humidity: float,
        rainfall_forecast: float,
    ) -> Dict:
        return self.engine.watering_recommendation(
            plant_type, soil_moisture, temperature, humidity, rainfall_forecast
        )

    def get_fertilizer_recommendation(
        self,
        plant_type: str,
        growth_stage: str,
        nutrient_level: str,
        soil_ph: float,
    ) -> Dict:
        return self.engine.fertilizer_recommendation(
            plant_type, growth_stage, nutrient_level, soil_ph
        )

    def get_crop_recommendations(
        self,
        region: str,
        season: str,
        soil_type: str,
        experience_level: str,
    ) -> List[Dict]:
        return self.engine.crop_recommendation(
            region, season, soil_type, experience_level
        )

    def get_sustainability_tips(
        self,
        garden_type: str,
        region: str,
        current_practices: List[str],
    ) -> List[Dict]:
        return self.engine.sustainability_tips(
            garden_type, region, current_practices
        )

    def get_plant_info(self, plant_name: str) -> Optional[Dict]:
        plant = self.plant_db.get_plant(plant_name)
        if not plant:
            return None
        return {"name": plant_name.replace("_", " ").title(), **plant}
