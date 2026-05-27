from fastapi import APIRouter
from ..api.plant_detection import router as plant_router
from ..api.health_analysis import router as health_router
from ..api.disease_detection import router as disease_router
from ..api.recommendations import router as recommendations_router
from ..api.growth_tracking import router as growth_router
from ..api.soil_analysis import router as soil_router

api_router = APIRouter()

api_router.include_router(plant_router)
api_router.include_router(health_router)
api_router.include_router(disease_router)
api_router.include_router(recommendations_router)
api_router.include_router(growth_router)
api_router.include_router(soil_router)
