from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_provider: str = "ollama"
    ai_model: str = "llama3"
    ollama_url: str = "http://localhost:11434"
    anthropic_api_key: str = ""
    secret_key: str = "saai_secret_key_2026"
    database_url: str = "sqlite:///./saai.db"

    class Config:
        env_file = "../.env"


settings = Settings()
