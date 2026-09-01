from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    app_name: str = "Aureum Insights"
    environment: str = "development"
    allow_local_auth: bool = True
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    supabase_jwks_url: str = ""
    supabase_jwt_secret: str = ""

    @property
    def supabase_api_key(self) -> str:
        return self.supabase_anon_key or self.supabase_publishable_key
    database_url: str = ""
    nvidia_api_key: str = ""
    nvidia_model: str = "moonshotai/kimi-k3"
    nvidia_temperature: float = 1
    nvidia_max_tokens: int = 16384
    llm_timeout_seconds: float = 90
    llm_max_retries: int = 2
    stable_change_threshold: float = 5.0
    cache_ttl_seconds: int = 300
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
