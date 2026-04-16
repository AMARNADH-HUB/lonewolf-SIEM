from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Lonewolf SIEM API"
    environment: str = "dev"
    database_url: str = "sqlite:///./lonewolf.db"
    agent_ingest_token: str = "dev-agent-token"
    cors_origins: str = "*"

    model_config = SettingsConfigDict(env_prefix="SIEM_", env_file=".env", extra="ignore")


settings = Settings()
