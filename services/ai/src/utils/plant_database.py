from typing import Dict, List, Optional


class PlantDatabase:
    def __init__(self) -> None:
        self._plants: Dict[str, Dict] = {
            "tomato": {
                "scientific_name": "Solanum lycopersicum",
                "family": "Solanaceae",
                "type": "vegetable",
                "growth_days_min": 60,
                "growth_days_max": 120,
                "season": "warm",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 2,
                "soil_ph_min": 6.0,
                "soil_ph_max": 6.8,
                "temperature_min_c": 10,
                "temperature_max_c": 35,
                "temperature_optimal_c": 25,
                "humidity_optimal_pct": 0.65,
                "difficulty": "moderate",
                "companion_plants": ["basil", "marigold", "garlic"],
                "common_pests": ["aphids", "hornworm", "whitefly"],
                "fertilizer_npk": "5-10-10",
                "spacing_cm": 60,
                "depth_cm": 0.5,
            },
            "basil": {
                "scientific_name": "Ocimum basilicum",
                "family": "Lamiaceae",
                "type": "herb",
                "growth_days_min": 50,
                "growth_days_max": 75,
                "season": "warm",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 1,
                "soil_ph_min": 6.0,
                "soil_ph_max": 7.0,
                "temperature_min_c": 10,
                "temperature_max_c": 35,
                "temperature_optimal_c": 25,
                "humidity_optimal_pct": 0.60,
                "difficulty": "easy",
                "companion_plants": ["tomato", "pepper", "oregano"],
                "common_pests": ["aphids", "japanese_beetle", "slug"],
                "fertilizer_npk": "10-10-10",
                "spacing_cm": 30,
                "depth_cm": 0.3,
            },
            "rose": {
                "scientific_name": "Rosa spp.",
                "family": "Rosaceae",
                "type": "flower",
                "growth_days_min": 90,
                "growth_days_max": 180,
                "season": "cool",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 2,
                "soil_ph_min": 5.5,
                "soil_ph_max": 7.0,
                "temperature_min_c": -10,
                "temperature_max_c": 32,
                "temperature_optimal_c": 20,
                "humidity_optimal_pct": 0.55,
                "difficulty": "moderate",
                "companion_plants": ["garlic", "lavender", "sage"],
                "common_pests": ["aphids", "spider_mite", "black_spot"],
                "fertilizer_npk": "10-10-10",
                "spacing_cm": 90,
                "depth_cm": 40,
            },
            "lettuce": {
                "scientific_name": "Lactuca sativa",
                "family": "Asteraceae",
                "type": "vegetable",
                "growth_days_min": 30,
                "growth_days_max": 70,
                "season": "cool",
                "sun_requirement": "partial_shade",
                "watering_frequency_days": 1,
                "soil_ph_min": 6.0,
                "soil_ph_max": 7.0,
                "temperature_min_c": 1,
                "temperature_max_c": 25,
                "temperature_optimal_c": 18,
                "humidity_optimal_pct": 0.60,
                "difficulty": "easy",
                "companion_plants": ["carrot", "radish", "strawberry"],
                "common_pests": ["aphids", "slug", "cutworm"],
                "fertilizer_npk": "10-10-10",
                "spacing_cm": 25,
                "depth_cm": 0.3,
            },
            "lavender": {
                "scientific_name": "Lavandula angustifolia",
                "family": "Lamiaceae",
                "type": "flower",
                "growth_days_min": 90,
                "growth_days_max": 200,
                "season": "warm",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 5,
                "soil_ph_min": 6.5,
                "soil_ph_max": 8.0,
                "temperature_min_c": -15,
                "temperature_max_c": 35,
                "temperature_optimal_c": 22,
                "humidity_optimal_pct": 0.40,
                "difficulty": "moderate",
                "companion_plants": ["rose", "sage", "thyme"],
                "common_pests": ["spittlebug", "whitefly"],
                "fertilizer_npk": "5-10-10",
                "spacing_cm": 60,
                "depth_cm": 30,
            },
            "cucumber": {
                "scientific_name": "Cucumis sativus",
                "family": "Cucurbitaceae",
                "type": "vegetable",
                "growth_days_min": 50,
                "growth_days_max": 70,
                "season": "warm",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 1,
                "soil_ph_min": 6.0,
                "soil_ph_max": 7.0,
                "temperature_min_c": 15,
                "temperature_max_c": 35,
                "temperature_optimal_c": 25,
                "humidity_optimal_pct": 0.70,
                "difficulty": "easy",
                "companion_plants": ["bean", "pea", "radish"],
                "common_pests": ["aphids", "cucumber_beetle", "powdery_mildew"],
                "fertilizer_npk": "5-10-10",
                "spacing_cm": 45,
                "depth_cm": 1,
            },
            "sunflower": {
                "scientific_name": "Helianthus annuus",
                "family": "Asteraceae",
                "type": "flower",
                "growth_days_min": 70,
                "growth_days_max": 100,
                "season": "warm",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 2,
                "soil_ph_min": 6.0,
                "soil_ph_max": 7.5,
                "temperature_min_c": 10,
                "temperature_max_c": 38,
                "temperature_optimal_c": 25,
                "humidity_optimal_pct": 0.50,
                "difficulty": "easy",
                "companion_plants": ["cucumber", "squash", "bean"],
                "common_pests": ["bird", "squirrel", "aphid"],
                "fertilizer_npk": "10-10-10",
                "spacing_cm": 45,
                "depth_cm": 2,
            },
            "carrot": {
                "scientific_name": "Daucus carota",
                "family": "Apiaceae",
                "type": "vegetable",
                "growth_days_min": 50,
                "growth_days_max": 80,
                "season": "cool",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 2,
                "soil_ph_min": 6.0,
                "soil_ph_max": 6.8,
                "temperature_min_c": 4,
                "temperature_max_c": 30,
                "temperature_optimal_c": 18,
                "humidity_optimal_pct": 0.60,
                "difficulty": "moderate",
                "companion_plants": ["lettuce", "radish", "onion"],
                "common_pests": ["carrot_rust_fly", "aphid", "slug"],
                "fertilizer_npk": "5-10-10",
                "spacing_cm": 7,
                "depth_cm": 0.5,
            },
            "bell_pepper": {
                "scientific_name": "Capsicum annuum",
                "family": "Solanaceae",
                "type": "vegetable",
                "growth_days_min": 60,
                "growth_days_max": 90,
                "season": "warm",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 2,
                "soil_ph_min": 6.0,
                "soil_ph_max": 6.8,
                "temperature_min_c": 15,
                "temperature_max_c": 32,
                "temperature_optimal_c": 25,
                "humidity_optimal_pct": 0.60,
                "difficulty": "moderate",
                "companion_plants": ["basil", "carrot", "marjoram"],
                "common_pests": ["aphids", "hornworm", "blossom_end_rot"],
                "fertilizer_npk": "5-10-10",
                "spacing_cm": 45,
                "depth_cm": 0.5,
            },
            "marigold": {
                "scientific_name": "Tagetes erecta",
                "family": "Asteraceae",
                "type": "flower",
                "growth_days_min": 45,
                "growth_days_max": 60,
                "season": "warm",
                "sun_requirement": "full_sun",
                "watering_frequency_days": 2,
                "soil_ph_min": 6.0,
                "soil_ph_max": 7.5,
                "temperature_min_c": 10,
                "temperature_max_c": 35,
                "temperature_optimal_c": 24,
                "humidity_optimal_pct": 0.55,
                "difficulty": "easy",
                "companion_plants": ["tomato", "bean", "squash"],
                "common_pests": ["spider_mite", "slug"],
                "fertilizer_npk": "10-10-10",
                "spacing_cm": 30,
                "depth_cm": 0.5,
            },
        }

    def get_plant(self, name: str) -> Optional[Dict]:
        key = name.lower().replace(" ", "_")
        return self._plants.get(key)

    def get_all_plants(self) -> Dict[str, Dict]:
        return dict(self._plants)

    def search(self, query: str) -> List[Dict]:
        q = query.lower()
        results = []
        for name, info in self._plants.items():
            if q in name or q in info["scientific_name"].lower():
                results.append({"name": name, **info})
        return results

    def get_plants_by_type(self, plant_type: str) -> List[Dict]:
        return [
            {"name": name, **info}
            for name, info in self._plants.items()
            if info["type"] == plant_type
        ]

    def get_plants_by_season(self, season: str) -> List[Dict]:
        return [
            {"name": name, **info}
            for name, info in self._plants.items()
            if info["season"] == season
        ]

    def get_plants_by_difficulty(self, difficulty: str) -> List[Dict]:
        return [
            {"name": name, **info}
            for name, info in self._plants.items()
            if info["difficulty"] == difficulty
        ]

    def is_compatible_with_region(self, plant_name: str, region: str) -> bool:
        plant = self.get_plant(plant_name)
        if not plant:
            return False
        region_temps = {
            "tropical": (20, 35),
            "temperate": (5, 30),
            "arid": (15, 40),
            "mediterranean": (5, 35),
            "continental": (-10, 30),
        }
        r_temp = region_temps.get(region.lower())
        if not r_temp:
            return True
        p_min = plant["temperature_min_c"]
        p_max = plant["temperature_max_c"]
        return not (p_max < r_temp[0] or p_min > r_temp[1])
