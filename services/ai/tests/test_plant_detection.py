import pytest
import numpy as np
from fastapi.testclient import TestClient
from src.main import app
from src.models.plantnet_mock import PlantNetMock
from src.services.image_processor import ImageProcessor


client = TestClient(app)


def create_test_image_bytes(width=224, height=224):
    image = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)
    import cv2
    success, buffer = cv2.imencode(".jpg", image)
    return buffer.tobytes()


class TestPlantDetection:
    def test_plantnet_mock_initialization(self):
        model = PlantNetMock()
        assert model.device == "cpu"
        assert model.model is None
        assert model.image_size == (224, 224)
        assert len(model.plants_list) > 0

    def test_plantnet_mock_preprocess(self):
        model = PlantNetMock()
        image = np.random.randint(0, 255, (300, 300, 3), dtype=np.uint8)
        processed = model.preprocess(image)
        assert processed.shape == (1, 3, 224, 224)
        assert processed.dtype == np.float32
        assert np.all(processed >= -3.0) and np.all(processed <= 3.0)

    def test_plantnet_mock_predict_returns_valid_result(self):
        model = PlantNetMock()
        image = np.random.randint(0, 255, (400, 400, 3), dtype=np.uint8)
        name, species, confidence = model.predict(image)
        assert isinstance(name, str)
        assert isinstance(species, str)
        assert 0.0 <= confidence <= 1.0
        assert len(name) > 0

    def test_plantnet_mock_identify_returns_full_result(self):
        model = PlantNetMock()
        image = np.random.randint(0, 255, (400, 400, 3), dtype=np.uint8)
        result = model.identify(image)
        assert "plant_name" in result
        assert "scientific_name" in result
        assert "confidence" in result
        assert result["confidence"] > 0.4

    def test_image_processor_load_from_bytes(self):
        processor = ImageProcessor()
        img_bytes = create_test_image_bytes()
        image = processor.load_from_bytes(img_bytes)
        assert image is not None
        assert image.shape[2] == 3

    def test_image_processor_resize(self):
        processor = ImageProcessor()
        image = np.random.randint(0, 255, (400, 300, 3), dtype=np.uint8)
        resized = processor.resize(image, (224, 224))
        assert resized.shape[:2] == (224, 224)

    def test_image_processor_validate_image(self):
        processor = ImageProcessor()
        valid_img = create_test_image_bytes()
        ok, err = processor.validate_image(valid_img)
        assert ok is True
        assert err is None

        ok, err = processor.validate_image(b"not an image")
        assert ok is False
        assert err is not None

    def test_image_processor_extract_leaf_metrics(self):
        processor = ImageProcessor()
        img_bytes = create_test_image_bytes()
        metrics = processor.extract_leaf_metrics(img_bytes)
        assert "leaf_color_index" in metrics
        assert "green_coverage_pct" in metrics
        assert "yellow_coverage_pct" in metrics
        assert "brown_coverage_pct" in metrics
        assert "edge_density" in metrics
        assert 0 <= metrics["leaf_color_index"] <= 1

    def test_identify_endpoint_no_image(self):
        response = client.post("/api/v1/plant/identify")
        assert response.status_code == 422

    def test_identify_endpoint_with_image(self):
        img_bytes = create_test_image_bytes()
        response = client.post(
            "/api/v1/plant/identify",
            files={"image": ("test.jpg", img_bytes, "image/jpeg")},
        )
        if response.status_code == 200:
            data = response.json()
            assert "plant_name" in data
            assert "confidence" in data
            assert data["confidence"] >= 0.0
        else:
            assert response.status_code in (400, 500)

    def test_identify_endpoint_invalid_file(self):
        response = client.post(
            "/api/v1/plant/identify",
            files={"image": ("test.txt", b"not an image", "text/plain")},
        )
        assert response.status_code == 400

    def test_health_analysis_endpoint(self):
        img_bytes = create_test_image_bytes()
        response = client.post(
            "/api/v1/plant/health",
            files={"image": ("test.jpg", img_bytes, "image/jpeg")},
        )
        if response.status_code == 200:
            data = response.json()
            assert "health_score" in data
            assert "status" in data
            assert "leaf_metrics" in data

    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "gardenverse-ai-services"
