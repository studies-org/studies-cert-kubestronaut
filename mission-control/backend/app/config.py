from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "dev"
    database_url: str = "postgresql+asyncpg://mission:mission_dev@db:5432/mission"
    redis_url: str = "redis://redis:6379/0"
    jwt_secret: str = "change-me-please"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://mission.local",
    ]


settings = Settings()
