from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine
import redis.asyncio as aioredis

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    app.state.redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    yield
    await app.state.db_engine.dispose()
    await app.state.redis.aclose()


app = FastAPI(
    title="Mission Control API",
    version="0.1.0",
    description="Backend for the Kubestronaut tracker. Skeleton — endpoints coming.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    db_ok = False
    redis_ok = False
    try:
        async with app.state.db_engine.connect() as conn:
            await conn.exec_driver_sql("SELECT 1")
        db_ok = True
    except Exception:
        pass
    try:
        await app.state.redis.ping()
        redis_ok = True
    except Exception:
        pass
    status = "ok" if db_ok and redis_ok else "degraded"
    return {"status": status, "db": db_ok, "redis": redis_ok, "env": settings.env}


@app.get("/api/info")
async def info():
    return {
        "name": "Mission Control API",
        "version": "0.1.0",
        "stage": "skeleton",
        "next": "Auth + CRUD de sessões / pomodoros / certs",
    }
