# Configuration settings for the Flask application

import os
from dotenv import load_dotenv

# Always load env from `src/.env` regardless of current working directory.
_DOTENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=_DOTENV_PATH)

def _ensure_public_search_path(database_uri: str | None) -> str | None:
    """
    Supabase roles often have a search_path that prefers `extensions`, which can
    cause SQLAlchemy/Alembic to create tables under `extensions` instead of `public`.
    Force `search_path=public` via Postgres connection `options`.
    """
    if not database_uri:
        return database_uri
    if not (database_uri.startswith("postgresql://") or database_uri.startswith("postgresql+psycopg2://")):
        return database_uri

    options_kv = "options=-csearch_path%3Dpublic"
    if "options=-csearch_path%3Dpublic" in database_uri:
        return database_uri
    if "?" in database_uri:
        return f"{database_uri}&{options_kv}"
    return f"{database_uri}?{options_kv}"

class FactoryConfig:
    """Factory to get configuration based on environment."""
    @staticmethod
    def get_config(env: str):
        if env == 'development':
            return DevelopmentConfig
        elif env == 'testing':
            return TestingConfig
        elif env == 'production':
            return ProductionConfig
        else:
            return Config

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a_default_secret_key'
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ['true', '1']
    TESTING = os.environ.get('TESTING', 'False').lower() in ['true', '1']
    # Prefer a single standard env var for DB connection string.
    # For Supabase Postgres, set DATABASE_URI to something like:
    # postgresql+psycopg2://user:pass@host:5432/dbname
    DATABASE_URI = _ensure_public_search_path(
        os.environ.get('DATABASE_URI')
        or os.environ.get('SUPABASE_DATABASE_URL')
        or os.environ.get('POSTGRES_DATABASE_URL')
        or os.environ.get('POSTGREE_DATABASE_URL')  # legacy/typo support
    )
    CORS_HEADERS = 'Content-Type'

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    DATABASE_URI = Config.DATABASE_URI


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DATABASE_URI = os.environ.get('DATABASE_URI') or 'mssql+pymssql://sa:Aa%40123456@127.0.0.1:1433/DemoFlaskApi'


class ProductionConfig(Config):
    """Production configuration."""
    DATABASE_URI = os.environ.get('DATABASE_URI') or 'mssql+pymssql://sa:Aa%40123456@127.0.0.1:1433/DemoFlaskApi'

    
template = {
    "swagger": "2.0",
    "info": {
        "title": "Todo API",
        "description": "API for managing todos",
        "version": "1.0.0"
    },
    "basePath": "/",
    "schemes": [
        "http",
        "https"
    ],
    "consumes": [
        "application/json"
    ],
    "produces": [
        "application/json"
    ]
}
class SwaggerConfig:
    """Swagger configuration."""
    template = {
        "swagger": "2.0",
        "info": {
            "title": "Todo API",
            "description": "API for managing todos",
            "version": "1.0.0"
        },
        "basePath": "/",
        "schemes": [
            "http",
            "https"
        ],
        "consumes": [
            "application/json"
        ],
        "produces": [
            "application/json"
        ]
    }

    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec',
                "route": '/apispec.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/docs"
    }