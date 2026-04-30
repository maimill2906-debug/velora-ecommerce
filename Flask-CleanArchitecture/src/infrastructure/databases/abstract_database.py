from abc import ABC, abstractmethod
import os

from config import FactoryConfig
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
class AbstractDatabase(ABC):
    def __init__(self):
        env = os.environ.get("FLASK_ENV", "development")
        self.database_uri = FactoryConfig.get_config(env).DATABASE_URI
        if not self.database_uri:
            raise ValueError(
                "DATABASE_URI is not configured. "
                "Set env DATABASE_URI (Supabase Postgres connection string)."
            )
        # Supabase pooler (session mode) has a low max clients limit.
        # Keep SQLAlchemy pool small to avoid exhausting the pooler.
        self.engine = create_engine(
            self.database_uri,
            pool_size=int(os.environ.get("DB_POOL_SIZE", "3")),
            max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "0")),
            pool_timeout=int(os.environ.get("DB_POOL_TIMEOUT", "30")),
            pool_recycle=int(os.environ.get("DB_POOL_RECYCLE", "1800")),
            pool_pre_ping=True,
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    @abstractmethod
    def init_database(app):
        pass