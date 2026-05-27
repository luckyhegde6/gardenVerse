from typing import Dict, Optional, Any
import os
import httpx


class WeatherService:
    def __init__(self) -> None:
        self.api_key = os.getenv("WEATHER_API_KEY", "")
        self.base_url = os.getenv(
            "WEATHER_API_BASE_URL",
            "https://api.openweathermap.org/data/2.5",
        )
        self.client: Optional[httpx.AsyncClient] = None

    async def initialize(self) -> None:
        self.client = httpx.AsyncClient(timeout=10.0)

    async def shutdown(self) -> None:
        if self.client:
            await self.client.aclose()

    async def get_current_weather(
        self, lat: float, lon: float
    ) -> Optional[Dict[str, Any]]:
        if not self.api_key or not self.client:
            return self._mock_weather()
        try:
            response = await self.client.get(
                f"{self.base_url}/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": self.api_key,
                    "units": "metric",
                },
            )
            response.raise_for_status()
            data = response.json()
            return {
                "temperature_c": data["main"]["temp"],
                "humidity_pct": data["main"]["humidity"] / 100.0,
                "pressure_hpa": data["main"]["pressure"],
                "wind_speed_ms": data["wind"]["speed"],
                "description": data["weather"][0]["description"],
                "clouds_pct": data["clouds"]["all"] / 100.0,
            }
        except Exception:
            return self._mock_weather()

    async def get_forecast(
        self, lat: float, lon: float, days: int = 3
    ) -> Optional[Dict[str, Any]]:
        if not self.api_key or not self.client:
            return self._mock_forecast(days)
        try:
            response = await self.client.get(
                f"{self.base_url}/forecast",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": self.api_key,
                    "units": "metric",
                    "cnt": days * 8,
                },
            )
            response.raise_for_status()
            data = response.json()

            daily_forecasts = []
            for i in range(0, len(data["list"]), 8):
                day = data["list"][i]
                daily_forecasts.append({
                    "date": day["dt_txt"].split()[0],
                    "temperature_high_c": day["main"]["temp_max"],
                    "temperature_low_c": day["main"]["temp_min"],
                    "humidity_pct": day["main"]["humidity"] / 100.0,
                    "rainfall_mm": day.get("rain", {}).get("3h", 0),
                })

            total_rainfall = sum(
                f["rainfall_mm"] for f in daily_forecasts
            )

            return {
                "forecasts": daily_forecasts,
                "total_rainfall_forecast_mm": round(total_rainfall, 1),
                "average_temp_c": round(
                    sum(
                        (f["temperature_high_c"] + f["temperature_low_c"]) / 2
                        for f in daily_forecasts
                    )
                    / max(len(daily_forecasts), 1),
                    1,
                ),
            }
        except Exception:
            return self._mock_forecast(days)

    async def get_environmental_context(
        self, lat: float, lon: float
    ) -> Dict[str, Any]:
        weather = await self.get_current_weather(lat, lon)
        forecast = await self.get_forecast(lat, lon, 1)

        if not weather:
            weather = self._mock_weather()
        if not forecast:
            forecast = self._mock_forecast(1)

        return {
            "current": weather,
            "forecast": forecast,
            "context": {
                "is_hot": weather["temperature_c"] > 30,
                "is_cold": weather["temperature_c"] < 5,
                "is_humid": weather["humidity_pct"] > 0.7,
                "is_dry": weather["humidity_pct"] < 0.3,
                "rain_expected": forecast["total_rainfall_forecast_mm"] > 5,
                "frost_risk": weather["temperature_c"] < 2,
                "heat_stress_risk": weather["temperature_c"] > 35,
            },
        }

    def _mock_weather(self) -> Dict[str, Any]:
        import random
        return {
            "temperature_c": round(random.uniform(15, 32), 1),
            "humidity_pct": round(random.uniform(0.3, 0.8), 2),
            "pressure_hpa": round(random.uniform(1000, 1025), 1),
            "wind_speed_ms": round(random.uniform(0, 8), 1),
            "description": "clear sky",
            "clouds_pct": round(random.uniform(0, 0.8), 2),
        }

    def _mock_forecast(self, days: int) -> Dict[str, Any]:
        import random
        forecasts = []
        total_rain = 0
        for d in range(days):
            rain = round(random.uniform(0, 15), 1)
            total_rain += rain
            forecasts.append({
                "date": f"2026-05-{27 + d:02d}",
                "temperature_high_c": round(random.uniform(22, 32), 1),
                "temperature_low_c": round(random.uniform(15, 22), 1),
                "humidity_pct": round(random.uniform(0.4, 0.8), 2),
                "rainfall_mm": rain,
            })

        return {
            "forecasts": forecasts,
            "total_rainfall_forecast_mm": round(total_rain, 1),
            "average_temp_c": round(
                sum(
                    (f["temperature_high_c"] + f["temperature_low_c"]) / 2
                    for f in forecasts
                )
                / max(len(forecasts), 1),
                1,
            ),
        }
