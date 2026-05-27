import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.models.recommendation_engine import RecommendationEngine
from src.services.recommendation_service import RecommendationService


client = TestClient(app)


class TestRecommendationEngine:
    def setup_method(self):
        self.engine = RecommendationEngine()

    def test_watering_recommendation_dry_soil(self):
        result = self.engine.watering_recommendation(
            plant_type="tomato",
            soil_moisture=0.15,
            temperature=30,
            humidity=0.3,
            rainfall_forecast=0,
        )
        assert result["should_water"] is True
        assert result["amount_ml"] > 0
        assert "best_time" in result
        assert len(result["reason"]) > 0

    def test_watering_recommendation_wet_soil(self):
        result = self.engine.watering_recommendation(
            plant_type="tomato",
            soil_moisture=0.75,
            temperature=20,
            humidity=0.7,
            rainfall_forecast=0,
        )
        assert result["should_water"] is False

    def test_watering_recommendation_rain_forecast(self):
        result = self.engine.watering_recommendation(
            plant_type="tomato",
            soil_moisture=0.3,
            temperature=25,
            humidity=0.5,
            rainfall_forecast=15,
        )
        assert result["should_water"] is False
        assert result["amount_ml"] == 0

    def test_watering_recommendation_unknown_plant(self):
        result = self.engine.watering_recommendation(
            plant_type="unknown_plant_123",
            soil_moisture=0.2,
            temperature=28,
            humidity=0.4,
            rainfall_forecast=0,
        )
        assert "should_water" in result
        assert "amount_ml" in result
        assert result["amount_ml"] >= 0

    def test_fertilizer_recommendation_low_nutrient(self):
        result = self.engine.fertilizer_recommendation(
            plant_type="tomato",
            growth_stage="vegetative",
            nutrient_level="low",
            soil_ph=6.5,
        )
        assert result["fertilizer_type"] != "none"
        assert result["amount_g_per_sqm"] > 0
        assert result["frequency"] != "none"
        assert len(result["reason"]) > 0

    def test_fertilizer_recommendation_high_nutrient(self):
        result = self.engine.fertilizer_recommendation(
            plant_type="tomato",
            growth_stage="vegetative",
            nutrient_level="high",
            soil_ph=6.5,
        )
        assert result["fertilizer_type"] == "none"

    def test_fertilizer_recommendation_dormant_stage(self):
        result = self.engine.fertilizer_recommendation(
            plant_type="tomato",
            growth_stage="dormant",
            nutrient_level="low",
            soil_ph=6.5,
        )
        assert result["frequency"] == "none"

    def test_fertilizer_recommendation_ph_issue(self):
        result = self.engine.fertilizer_recommendation(
            plant_type="tomato",
            growth_stage="vegetative",
            nutrient_level="low",
            soil_ph=5.0,
        )
        assert result["ph_adjustment_needed"] is True
        assert result["ph_adjustment"] is not None

    def test_crop_recommendation_returns_list(self):
        results = self.engine.crop_recommendation(
            region="temperate",
            season="warm",
            soil_type="loam",
            experience_level="beginner",
        )
        assert isinstance(results, list)
        assert len(results) > 0
        assert len(results) <= 10
        for crop in results:
            assert "plant_name" in crop
            assert "score" in crop
            assert 0 <= crop["score"] <= 1

    def test_crop_recommendation_sorted_by_score(self):
        results = self.engine.crop_recommendation(
            region="temperate",
            season="warm",
            soil_type="loam",
            experience_level="beginner",
        )
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_crop_recommendation_different_experience(self):
        beginner = self.engine.crop_recommendation(
            region="temperate", season="warm", soil_type="loam", experience_level="beginner"
        )
        advanced = self.engine.crop_recommendation(
            region="temperate", season="warm", soil_type="loam", experience_level="advanced"
        )
        assert isinstance(beginner, list)
        assert isinstance(advanced, list)

    def test_sustainability_tips_returns_list(self):
        results = self.engine.sustainability_tips(
            garden_type="vegetable",
            region="temperate",
            current_practices=[],
        )
        assert isinstance(results, list)
        assert len(results) > 0
        assert len(results) <= 8
        for tip in results:
            assert "tip" in tip
            assert "impact_score" in tip
            assert "effort" in tip
            assert "category" in tip

    def test_sustainability_tips_excludes_existing(self):
        results = self.engine.sustainability_tips(
            garden_type="vegetable",
            region="temperate",
            current_practices=["composting", "mulching"],
        )
        tips = [t["tip_id"] for t in results]
        assert "composting" not in tips
        assert "mulching" not in tips

    def test_sustainability_tips_sorted_by_impact(self):
        results = self.engine.sustainability_tips(
            garden_type="vegetable",
            region="temperate",
            current_practices=[],
        )
        scores = [t["impact_score"] for t in results]
        assert scores == sorted(scores, reverse=True)

    def test_recommendation_service_watering(self):
        service = RecommendationService()
        result = service.get_watering_recommendation(
            plant_type="tomato",
            soil_moisture=0.2,
            temperature=28,
            humidity=0.4,
            rainfall_forecast=0,
        )
        assert "should_water" in result
        assert "amount_ml" in result

    def test_recommendation_service_fertilizer(self):
        service = RecommendationService()
        result = service.get_fertilizer_recommendation(
            plant_type="rose", growth_stage="flowering", nutrient_level="low", soil_ph=6.5
        )
        assert "fertilizer_type" in result

    def test_recommendation_service_crop(self):
        service = RecommendationService()
        results = service.get_crop_recommendations(
            region="tropical", season="warm", soil_type="loam", experience_level="intermediate"
        )
        assert len(results) > 0

    def test_recommendation_service_sustainability(self):
        service = RecommendationService()
        results = service.get_sustainability_tips(
            garden_type="flower", region="tropical", current_practices=["composting"]
        )
        assert len(results) > 0


class TestRecommendationEndpoints:
    def test_watering_endpoint_valid(self):
        response = client.get(
            "/api/v1/recommendations/watering",
            params={
                "plant_type": "tomato",
                "soil_moisture": 0.2,
                "temperature": 30,
                "humidity": 0.4,
                "rainfall_forecast": 0,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "should_water" in data
        assert "amount_ml" in data
        assert "best_time" in data
        assert "reason" in data

    def test_watering_endpoint_missing_params(self):
        response = client.get("/api/v1/recommendations/watering")
        assert response.status_code == 422

    def test_fertilizer_endpoint_valid(self):
        response = client.get(
            "/api/v1/recommendations/fertilizer",
            params={
                "plant_type": "tomato",
                "growth_stage": "vegetative",
                "nutrient_level": "low",
                "soil_ph": 6.5,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "fertilizer_type" in data
        assert "amount_g_per_sqm" in data

    def test_fertilizer_endpoint_invalid_stage(self):
        response = client.get(
            "/api/v1/recommendations/fertilizer",
            params={
                "plant_type": "tomato",
                "growth_stage": "invalid_stage",
                "nutrient_level": "low",
                "soil_ph": 6.5,
            },
        )
        assert response.status_code == 400

    def test_fertilizer_endpoint_invalid_nutrient(self):
        response = client.get(
            "/api/v1/recommendations/fertilizer",
            params={
                "plant_type": "tomato",
                "growth_stage": "vegetative",
                "nutrient_level": "invalid",
                "soil_ph": 6.5,
            },
        )
        assert response.status_code == 400

    def test_crop_endpoint_valid(self):
        response = client.get(
            "/api/v1/recommendations/crop",
            params={
                "region": "temperate",
                "season": "warm",
                "soil_type": "loam",
                "experience_level": "beginner",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            assert "plant_name" in data[0]
            assert "score" in data[0]

    def test_sustainability_endpoint_valid(self):
        response = client.get(
            "/api/v1/recommendations/sustainability",
            params={
                "garden_type": "vegetable",
                "region": "temperate",
                "current_practices": "composting,mulching",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            assert "tip" in data[0]
            assert "impact_score" in data[0]
            assert "effort" in data[0]
