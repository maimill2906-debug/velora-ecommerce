

from infrastructure.databases.abstract_database import AbstractDatabase
from infrastructure.databases.database_mssql import DatabaseMSSQL
from infrastructure.databases.database_postgres import DatabasePostgres


class FactoryDatabase:
    # Keep a singleton instance per database type.
    # This ensures we create ONE SQLAlchemy engine + pool for the whole app.
    _instances: dict[str, AbstractDatabase] = {}

    @staticmethod
    def get_database(database_type)-> AbstractDatabase:
        key = (database_type or "").upper()
        if key in FactoryDatabase._instances:
            return FactoryDatabase._instances[key]

        if key == "MSSQL":
            inst = DatabaseMSSQL()
        elif key in ("POSTGRES", "POSTGRESQL", "POSTGREE"):
            inst = DatabasePostgres()
        else:
            raise ValueError(f"Unsupported database type: {database_type}")

        FactoryDatabase._instances[key] = inst
        return inst