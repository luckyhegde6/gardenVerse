import os
import sys
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

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


class ErrorResponse(BaseModel):
    error: bool = True
    status_code: int
    error_type: str
    message: str
    detail: str = ""


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(
        "HTTP %d on %s %s: %s", exc.status_code, request.method, request.url.path, exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            status_code=exc.status_code,
            error_type="http_error",
            message=str(exc.detail),
        ).model_dump(),
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            status_code=422,
            error_type="validation_error",
            message=str(exc),
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            status_code=500,
            error_type="internal_error",
            message="An unexpected error occurred. Please try again later.",
            detail=str(exc) if os.getenv("LOG_LEVEL", "info").upper() == "DEBUG" else "",
        ).model_dump(),
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
