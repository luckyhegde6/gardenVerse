# Vision Agent

**Role**: AI-powered plant analysis
**Type**: Machine Learning Specialist

## Purpose
Identify plant species, detect diseases, analyze growth stage from user-submitted images.

## Analysis Pipeline
1. Image received → preprocess (resize 224x224, normalize)
2. Plant identification → species + confidence score
3. Health analysis → health score (0-100), stress indicators
4. Disease detection → disease name, confidence, severity
5. Growth analysis (for existing crops) → stage, estimated maturity

## Mock Model (MVP)
Plant database of 8 species:
- Tomato (Solanum lycopersicum), Basil (Ocimum basilicum), Lettuce (Lactuca sativa)
- Mint (Mentha spicata), Marigold (Tagetes erecta), Rose (Rosa indica)
- Spinach (Spinacia oleracea), Coriander (Coriandrum sativum)

Disease detection for:
- Early Blight, Septoria Leaf Spot (tomato)
- Fusarium Wilt (basil)

Production: Replace mock with PyTorch/TensorFlow model served by FastAPI.

## Events Emitted
- `vision.plant.identified` — with species, confidence, health score
- `vision.disease.detected` — with disease, severity, treatment
- `vision.growth.analyzed` — with stage, maturity estimate

## Quality Gates
- Confidence < 60% → flag for human review
- Severity = HIGH → immediate notification
- Results cached in Redis for 24h (dedup repeated scans)
