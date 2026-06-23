from typing import Dict, List, Optional, Tuple
import numpy as np
from ..utils.disease_database import DiseaseDatabase

MIN_CONFIDENCE_THRESHOLD = 0.25

HEALTHY_SCORE_CLEAN = 90.0
HEALTHY_SCORE_BASE = 100.0


class DiseaseModelMock:
    def __init__(self, model_path: Optional[str] = None) -> None:
        self.model_path = model_path
        self.device = "cpu"
        self.model = None
        self.image_size = (224, 224)
        self.disease_db = DiseaseDatabase()
        self._load_model()

    def _load_model(self) -> None:
        self.model = None

    def preprocess(self, image: np.ndarray) -> np.ndarray:
        import cv2

        resized = cv2.resize(image, self.image_size)
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB) if resized.shape[2] == 3 else resized
        normalized = rgb.astype(np.float32) / 255.0
        batch = np.expand_dims(normalized.transpose(2, 0, 1), axis=0)
        return batch

    # ── Step 1: Extract visual metrics from image ────────────────

    def _extract_visual_metrics(self, image: np.ndarray) -> Dict[str, float]:
        import cv2

        processed = cv2.resize(image, (128, 128))

        if len(processed.shape) == 3 and processed.shape[2] == 3:
            hsv = cv2.cvtColor(processed, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
        else:
            gray = processed
            hsv = cv2.merge([gray, gray, gray])

        yellow_mask = cv2.inRange(hsv, (20, 50, 50), (35, 255, 255))
        brown_mask = cv2.inRange(hsv, (10, 50, 50), (20, 200, 150))

        yellow_pct = float(np.sum(yellow_mask > 0) / yellow_mask.size)
        brown_pct = float(np.sum(brown_mask > 0) / brown_mask.size)

        edges = cv2.Canny(gray, 30, 100)
        edge_density = float(np.mean(edges) / 255.0)

        lesion_count = int(np.sum(brown_mask > 0) / 100)
        lesion_count = max(0, min(50, lesion_count))

        variance = float(np.var(gray.astype(float)))
        texture_irregularity = variance / (255 * 255)

        return {
            "yellow_pct": yellow_pct,
            "brown_pct": brown_pct,
            "edge_density": edge_density,
            "lesion_count": float(lesion_count),
            "texture_irregularity": texture_irregularity,
        }

    # ── Step 2: Score diseases against observed metrics ──────────

    def _score_diseases(
        self, metrics: Dict[str, float], plant_species: str
    ) -> List[Tuple[Dict, float]]:
        known_diseases = self.disease_db.get_diseases_for_plant(plant_species)
        if not known_diseases:
            known_diseases = list(self.disease_db.get_all_diseases().values())

        scored = []
        for disease in known_diseases:
            score = self._compute_disease_likelihood(
                disease,
                metrics["yellow_pct"],
                metrics["brown_pct"],
                metrics["edge_density"],
                metrics["lesion_count"],
                metrics["texture_irregularity"],
            )
            scored.append((disease, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored

    # ── Step 3: Assess confidence ────────────────────────────────

    def _assess_confidence(
        self, top_score: float, metrics: Dict[str, float]
    ) -> Tuple[str, str]:
        if top_score < 0.15:
            return "low", "healthy"
        if top_score < MIN_CONFIDENCE_THRESHOLD:
            return "high", "uncertain"
        if top_score > 0.7:
            return "low", "detected"
        return "moderate", "detected"

    # ── Step 4: Build treatment plan ─────────────────────────────

    def _build_treatment_plan(self, disease: Dict) -> Dict:
        treatments = disease.get("treatments", [])
        treatment_summary = [
            {
                "method": t["method"].replace("_", " ").title(),
                "description": t["description"],
                "effectiveness": t["effectiveness"],
                "organic": t["organic"],
            }
            for t in treatments
        ]
        return {
            "treatments": treatment_summary,
            "prevention_tips": disease.get("prevention", []),
        }

    # ── Chain: analyze leaf (step-by-step) ───────────────────────

    def analyze_leaf(self, image: np.ndarray, plant_species: str) -> Dict:
        import cv2

        metrics = self._extract_visual_metrics(image)
        scored = self._score_diseases(metrics, plant_species)
        top_disease, top_score = scored[0]
        uncertainty_level, status = self._assess_confidence(top_score, metrics)

        health_score = self._compute_health_score(metrics, top_score, status)

        if status == "healthy":
            return {
                "disease_detected": False,
                "message": "Plant appears healthy",
                "health_score": round(health_score, 1),
                "confidence": 0.85,
                "uncertainty": "low",
                "analysis_disclaimer": "This is a simulated analysis. For accurate diagnosis, consult a plant pathology expert.",
            }

        if status == "uncertain":
            return {
                "disease_detected": False,
                "disease_name": None,
                "message": "Unable to confidently identify any disease. The image quality or plant condition may not match known disease patterns.",
                "confidence": round(top_score, 4),
                "uncertainty": "high",
                "uncertainty_reason": "No disease pattern matched with sufficient confidence",
                "health_score": round(health_score, 1),
                "analysis_disclaimer": "This is a simulated analysis with low confidence. Results may not be accurate.",
            }

        severity = self._determine_severity(
            metrics["yellow_pct"], metrics["brown_pct"], metrics["lesion_count"]
        )

        treatment_plan = self._build_treatment_plan(top_disease)
        symptoms_db = top_disease.get("symptoms", [])
        symptoms_matched = symptoms_db[: min(len(symptoms_db), max(1, int(metrics["lesion_count"] / 15) + 1))]

        return {
            "disease_detected": True,
            "disease_name": top_disease["name"],
            "causal_agent": top_disease["causal_agent"],
            "disease_type": top_disease["type"],
            "confidence": round(min(0.99, max(0.5, top_score)), 4),
            "uncertainty": uncertainty_level,
            "severity": severity,
            "severity_description": top_disease.get("severity_thresholds", {}).get(severity, ""),
            "symptoms_matched": symptoms_matched,
            "symptoms_quoted": symptoms_matched,
            "treatments": treatment_plan["treatments"],
            "prevention_tips": treatment_plan["prevention_tips"],
            "database_source": {
                "database": "DiseaseDatabase (mock)",
                "entry_name": top_disease["name"],
                "entry_fields_used": ["symptoms", "treatments", "prevention", "severity_thresholds"],
            },
            "health_score": round(health_score, 1),
            "analysis_disclaimer": "This is a simulated analysis based on color-pattern matching. For accurate diagnosis, consult a plant pathology expert.",
        }

    def _compute_health_score(
        self, metrics: Dict[str, float], top_score: float, status: str
    ) -> float:
        if status == "healthy":
            return HEALTHY_SCORE_CLEAN
        if status == "uncertain":
            return max(50, HEALTHY_SCORE_BASE - top_score * 100 * 0.5)

        severity_name = self._determine_severity(
            metrics["yellow_pct"], metrics["brown_pct"], metrics["lesion_count"]
        )
        severity_penalty = 0.3 + 0.4 * (severity_name == "severe") + 0.2 * (severity_name == "moderate")
        return max(0, HEALTHY_SCORE_BASE * (1 - top_score * severity_penalty))

    def _compute_disease_likelihood(
        self,
        disease: Dict,
        yellow_pct: float,
        brown_pct: float,
        edge_density: float,
        lesion_count: float,
        texture_irregularity: float,
    ) -> float:
        name = disease["name"].lower()

        if "powdery" in name or "mildew" in name:
            base = 0.12 + yellow_pct * 0.3 + texture_irregularity * 0.2
        elif "spot" in name or "black" in name:
            base = 0.12 + brown_pct * 0.4 + lesion_count / 100
        elif "blight" in name:
            base = 0.12 + brown_pct * 0.3 + edge_density * 0.3
        elif "rust" in name:
            base = 0.12 + yellow_pct * 0.2 + brown_pct * 0.2 + edge_density * 0.1
        elif "mite" in name:
            base = 0.12 + texture_irregularity * 0.4 + yellow_pct * 0.2
        elif "aphid" in name:
            base = 0.12 + yellow_pct * 0.15 + texture_irregularity * 0.15
        elif "blossom" in name or "rot" in name:
            base = 0.12 + brown_pct * 0.3
        else:
            base = 0.12 + brown_pct * 0.15 + yellow_pct * 0.15

        return min(0.98, max(0.0, base))

    def _determine_severity(
        self, yellow_pct: float, brown_pct: float, lesion_count: float
    ) -> str:
        combined = yellow_pct + brown_pct * 2
        lesion_factor = lesion_count / 50
        score = combined * 0.6 + lesion_factor * 0.4

        if score < 0.15:
            return "mild"
        elif score < 0.4:
            return "moderate"
        else:
            return "severe"

    def detect(self, image: np.ndarray, plant_species: str) -> Dict:
        return self.analyze_leaf(image, plant_species)
