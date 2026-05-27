from typing import Optional, Tuple
import numpy as np
from io import BytesIO
from PIL import Image as PILImage


class ImageProcessor:
    def __init__(self) -> None:
        self.target_size = (224, 224)
        self.mean = np.array([0.485, 0.456, 0.406])
        self.std = np.array([0.229, 0.224, 0.225])

    def load_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        import cv2

        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            pil_image = PILImage.open(BytesIO(image_bytes))
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")
            image = cv2.cvtColor(
                np.array(pil_image), cv2.COLOR_RGB2BGR
            )
        return image

    def resize(self, image: np.ndarray, size: Optional[Tuple[int, int]] = None) -> np.ndarray:
        import cv2

        target = size or self.target_size
        return cv2.resize(image, target, interpolation=cv2.INTER_LINEAR)

    def normalize(self, image: np.ndarray) -> np.ndarray:
        float_img = image.astype(np.float32) / 255.0
        normalized = (float_img - self.mean) / self.std
        return normalized

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        image = self.load_from_bytes(image_bytes)
        resized = self.resize(image)
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        normalized = self.normalize(rgb)
        batched = np.expand_dims(normalized.transpose(2, 0, 1), axis=0)
        return batched.astype(np.float32)

    def preprocess_for_disease(self, image_bytes: bytes) -> np.ndarray:
        image = self.load_from_bytes(image_bytes)
        resized = self.resize(image)
        return resized

    def extract_leaf_metrics(self, image_bytes: bytes) -> dict:
        import cv2

        image = self.load_from_bytes(image_bytes)
        processed = cv2.resize(image, (128, 128))

        hsv = cv2.cvtColor(processed, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)

        h, s, v = cv2.split(hsv)

        edges = cv2.Canny(gray, 30, 100)
        edge_density = float(np.mean(edges) / 255.0)

        green_mask = cv2.inRange(hsv, (35, 30, 30), (85, 255, 255))
        green_pct = float(np.sum(green_mask > 0) / green_mask.size)

        yellow_mask = cv2.inRange(hsv, (20, 50, 50), (35, 255, 255))
        yellow_pct = float(np.sum(yellow_mask > 0) / yellow_mask.size)

        brown_mask = cv2.inRange(hsv, (10, 50, 50), (25, 200, 150))
        brown_pct = float(np.sum(brown_mask > 0) / brown_mask.size)

        mean_brightness = float(np.mean(v) / 255.0)
        mean_saturation = float(np.mean(s) / 255.0)

        variance = float(np.var(gray) / (255 * 255))

        color_uniformity = 1.0 - variance

        leaf_color_index = green_pct / max(green_pct + yellow_pct + brown_pct, 0.01)

        leaf_curl_index = edge_density * (1.0 - color_uniformity)

        return {
            "leaf_color_index": round(leaf_color_index, 4),
            "green_coverage_pct": round(green_pct * 100, 1),
            "yellow_coverage_pct": round(yellow_pct * 100, 1),
            "brown_coverage_pct": round(brown_pct * 100, 1),
            "edge_density": round(edge_density, 4),
            "mean_brightness": round(mean_brightness, 4),
            "mean_saturation": round(mean_saturation, 4),
            "texture_variance": round(variance, 4),
            "leaf_curl_index": round(leaf_curl_index, 4),
            "color_uniformity": round(color_uniformity, 4),
        }

    def augment(self, image: np.ndarray) -> np.ndarray:
        import cv2

        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        angle = np.random.uniform(-15, 15)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, matrix, (w, h), borderMode=cv2.BORDER_REFLECT
        )

        flip = np.random.choice([True, False])
        if flip:
            rotated = cv2.flip(rotated, 1)

        brightness = 1.0 + np.random.uniform(-0.15, 0.15)
        contrast = 1.0 + np.random.uniform(-0.1, 0.1)
        adjusted = cv2.convertScaleAbs(rotated, alpha=contrast, beta=int(50 * (brightness - 1.0)))

        return adjusted

    def validate_image(self, image_bytes: bytes) -> Tuple[bool, Optional[str]]:
        try:
            image = self.load_from_bytes(image_bytes)
            if image is None:
                return False, "Could not decode image"
            h, w = image.shape[:2]
            if h < 32 or w < 32:
                return False, "Image too small (minimum 32x32 pixels)"
            if h > 4096 or w > 4096:
                return False, "Image too large (maximum 4096x4096 pixels)"
            return True, None
        except Exception as e:
            return False, str(e)
