import os
import sys
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dotenv import load_dotenv

from .api.router import api_router
from .services.redis_service import RedisService
from .services.weather_service import WeatherService

load_dotenv()

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "info").upper()),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

redis_service = RedisService()
weather_service = WeatherService()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    logger.info("Starting GardenVerse AI Services...")
    await redis_service.connect()
    await weather_service.initialize()
    redis_ok = await redis_service.is_connected()
    if redis_ok:
        logger.info("Redis connection established")
    else:
        logger.warning("Redis not available - running without cache")
    logger.info("AI Services ready")
    yield
    logger.info("Shutting down AI Services...")
    await redis_service.disconnect()
    await weather_service.shutdown()
    logger.info("AI Services stopped")


app = FastAPI(
    title="GardenVerse AI Services",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("Request: %s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info(
        "Response: %s %s -> %d",
        request.method,
        request.url.path,
        response.status_code,
    )
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "message": str(exc)},
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "message": str(exc)},
    )


app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check():
    redis_healthy = await redis_service.is_connected()
    return {
        "status": "healthy",
        "service": "gardenverse-ai-services",
        "version": "1.0.0",
        "redis_connected": redis_healthy,
    }
