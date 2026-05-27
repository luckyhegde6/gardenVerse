from typing import Any, Optional
import json
import os

try:
    import redis.asyncio as redis_async
except ImportError:
    redis_async = None


class RedisService:
    def __init__(self) -> None:
        self.client = None
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", "6379"))
        self.db = int(os.getenv("REDIS_DB", "0"))
        self.password = os.getenv("REDIS_PASSWORD", None)

    async def connect(self) -> None:
        if redis_async is None:
            self.client = None
            return
        try:
            self.client = await redis_async.from_url(
                f"redis://{self.host}:{self.port}/{self.db}",
                password=self.password,
                decode_responses=True,
            )
        except Exception:
            self.client = None

    async def disconnect(self) -> None:
        if self.client:
            await self.client.close()
            self.client = None

    async def is_connected(self) -> bool:
        if not self.client:
            return False
        try:
            return await self.client.ping()
        except Exception:
            return False

    async def get(self, key: str) -> Optional[Any]:
        if not self.client:
            return None
        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception:
            return None

    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        if not self.client:
            return False
        try:
            serialized = json.dumps(value, default=str)
            await self.client.setex(key, ttl, serialized)
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> bool:
        if not self.client:
            return False
        try:
            return bool(await self.client.delete(key))
        except Exception:
            return False

    async def exists(self, key: str) -> bool:
        if not self.client:
            return False
        try:
            return bool(await self.client.exists(key))
        except Exception:
            return False

    async def cache_result(
        self, key: str, result: Any, ttl: int = 300
    ) -> None:
        await self.set(key, result, ttl)

    async def get_cached(self, key: str) -> Optional[Any]:
        return await self.get(key)

    async def invalidate_pattern(self, pattern: str) -> int:
        if not self.client:
            return 0
        try:
            cursor = 0
            deleted = 0
            while True:
                cursor, keys = await self.client.scan(
                    cursor=cursor, match=pattern, count=100
                )
                if keys:
                    await self.client.delete(*keys)
                    deleted += len(keys)
                if cursor == 0:
                    break
            return deleted
        except Exception:
            return 0
