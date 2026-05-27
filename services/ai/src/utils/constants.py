from enum import Enum
from typing import Dict, Tuple


class GrowthStage(str, Enum):
    SEED = "seed"
    SPROUT = "sprout"
    SEEDLING = "seedling"
    VEGETATIVE = "vegetative"
    BUDDING = "budding"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    HARVEST = "harvest"
    DORMANT = "dormant"


GROWTH_STAGES: Dict[GrowthStage, Dict[str, object]] = {
    GrowthStage.SEED: {
        "min_days": 0,
        "max_days": 5,
        "description": "Seed planted, no visible growth",
        "water_needed": "low",
        "light_needed": "none",
    },
    GrowthStage.SPROUT: {
        "min_days": 3,
        "max_days": 14,
        "description": "First shoots emerging from soil",
        "water_needed": "medium",
        "light_needed": "indirect",
    },
    GrowthStage.SEEDLING: {
        "min_days": 10,
        "max_days": 30,
        "description": "True leaves developing, establishing root system",
        "water_needed": "medium",
        "light_needed": "partial",
    },
    GrowthStage.VEGETATIVE: {
        "min_days": 20,
        "max_days": 60,
        "description": "Rapid leaf and stem growth",
        "water_needed": "high",
        "light_needed": "full",
    },
    GrowthStage.BUDDING: {
        "min_days": 45,
        "max_days": 90,
        "description": "Flower buds forming",
        "water_needed": "high",
        "light_needed": "full",
    },
    GrowthStage.FLOWERING: {
        "min_days": 60,
        "max_days": 120,
        "description": "Flowers in bloom, pollination occurring",
        "water_needed": "medium",
        "light_needed": "full",
    },
    GrowthStage.FRUITING: {
        "min_days": 90,
        "max_days": 180,
        "description": "Fruits or vegetables developing and ripening",
        "water_needed": "high",
        "light_needed": "full",
    },
    GrowthStage.HARVEST: {
        "min_days": 120,
        "max_days": 365,
        "description": "Ready for harvest",
        "water_needed": "low",
        "light_needed": "partial",
    },
    GrowthStage.DORMANT: {
        "min_days": 180,
        "max_days": 365,
        "description": "Winter dormancy, minimal metabolic activity",
        "water_needed": "very_low",
        "light_needed": "none",
    },
}


class SoilConstants:
    OPTIMAL_SOIL_PH_RANGE: Tuple[float, float] = (6.0, 7.5)
    OPTIMAL_MOISTURE_RANGE: Tuple[float, float] = (0.4, 0.7)
    SANDY_SOIL_RETENTION: float = 0.3
    CLAY_SOIL_RETENTION: float = 0.7
    LOAM_SOIL_RETENTION: float = 0.5
    SOIL_TYPES = ["sandy", "clay", "loam", "silt", "peat", "chalky"]

    NUTRIENT_DEFICIENCY_THRESHOLDS: Dict[str, Tuple[float, float]] = {
        "nitrogen": (0.3, 0.5),
        "phosphorus": (0.2, 0.4),
        "potassium": (0.3, 0.5),
        "calcium": (0.2, 0.4),
        "magnesium": (0.15, 0.35),
        "sulfur": (0.1, 0.25),
    }


class EnvironmentalConstants:
    TEMPERATURE_RANGES: Dict[str, Tuple[float, float, float]] = {
        "cool_season": (4, 18, 24),
        "warm_season": (15, 28, 35),
        "tropical": (20, 30, 40),
        "arid": (10, 35, 45),
    }

    OPTIMAL_HUMIDITY_RANGE: Tuple[float, float] = (0.4, 0.7)
    OPTIMAL_LIGHT_RANGE: Tuple[float, float] = (20000, 60000)

    FROST_TEMPERATURE_C: float = 0.0
    HEAT_STRESS_TEMPERATURE_C: float = 38.0


class NutrientConstants:
    NUTRIENT_LEVELS = ["very_low", "low", "medium", "high", "very_high"]
    NUTRIENT_SCORE_MAP = {
        "very_low": 0.1,
        "low": 0.3,
        "medium": 0.5,
        "high": 0.7,
        "very_high": 0.9,
    }

    FERTILIZER_TYPES = {
        "nitrogen_rich": {"n": 0.8, "p": 0.1, "k": 0.1},
        "phosphorus_rich": {"n": 0.1, "p": 0.8, "k": 0.1},
        "potassium_rich": {"n": 0.1, "p": 0.1, "k": 0.8},
        "balanced_npk": {"n": 0.33, "p": 0.33, "k": 0.33},
        "organic_compost": {"n": 0.2, "p": 0.2, "k": 0.2},
    }


OPTIMAL_SOIL_PH_RANGE = SoilConstants.OPTIMAL_SOIL_PH_RANGE
OPTIMAL_MOISTURE_RANGE = SoilConstants.OPTIMAL_MOISTURE_RANGE
TEMPERATURE_RANGES = EnvironmentalConstants.TEMPERATURE_RANGES
