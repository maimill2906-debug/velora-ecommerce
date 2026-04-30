from infrastructure.databases.factory_database import FactoryDatabase
# from infrastructure.databases.mssql import init_mssql
# from infrastructure.databases.postgres import init_postgres
# NOTE: Don't import infrastructure ORM models here.
# Models will be reintroduced after domain analysis; keeping this file "clean"
# avoids accidentally creating mock tables on startup.

import os
from alembic import command
from alembic.config import Config as AlembicConfig
from config import FactoryConfig


def _run_migrations() -> None:
    """
    Auto-apply Alembic migrations at startup.
    Runs `alembic upgrade head` using the current DATABASE_URI.
    """
    # Build Alembic config programmatically to avoid path/cwd issues
    # when Flask's reloader runs the app.
    # `__file__` is `.../src/infrastructure/databases/__init__.py`
    # Source root is `.../src` (two levels up).
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    migrations_dir = os.path.join(src_dir, "migrations")
    versions_dir = os.path.join(migrations_dir, "versions")
    if not os.path.isdir(versions_dir) or not any(
        f.endswith(".py") for f in os.listdir(versions_dir)
    ):
        # No migration scripts yet (clean slate) — skip auto-upgrade.
        print("[db] No migration scripts found; skip auto-upgrade.")
        return

    env = os.environ.get("FLASK_ENV", "development")
    database_uri = FactoryConfig.get_config(env).DATABASE_URI
    if not database_uri:
        raise ValueError("DATABASE_URI is not configured. Set env DATABASE_URI.")

    # Alembic's Config uses configparser interpolation which treats `%` specially.
    # Our Postgres URI may contain URL-encoded `%` sequences (e.g. `%3D`).
    # Escape them for Alembic only.
    alembic_url = database_uri.replace("%", "%%")

    cfg = AlembicConfig()
    cfg.set_main_option("script_location", migrations_dir)
    cfg.set_main_option("sqlalchemy.url", alembic_url)
    print(f"[db] Applying migrations from: {migrations_dir}")
    command.upgrade(cfg, "head")

def init_db(app):
    # init_mssql(app)
    _run_migrations()
    # Code-first schema changes are handled by Alembic migrations.
    # Avoid `create_all()` on startup to prevent drift / accidental table creation.
    # init_postgres(app)
    
# Migration Entities -> tables
from infrastructure.databases.base import Base