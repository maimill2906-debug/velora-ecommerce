# PostgreSQL database connection and management
import psycopg2
from psycopg2 import sql
# from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
# from sqlalchemy import create_engine
# Thay thế hướng dẫn các thư viện để phù hợp với PostgreSQL
from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker
from config import Config, DevelopmentConfig, TestingConfig, ProductionConfig
from infrastructure.databases.base import Base
# class PostgresDB:
#     def __init__(self, host, port, dbname, user, password):
#         self.connection_params = {
#             'host': host,
#             'port': port,
#             'dbname': dbname,
#             'user': user,
#             'password': password
#         }
#         self.connection = None

#     def connect(self):
#         if self.connection is None or self.connection.closed:
#             self.connection = psycopg2.connect(**self.connection_params)

#     def close(self):
#         if self.connection and not self.connection.closed:
#             self.connection.close()

#     @contextmanager
#     def get_cursor(self):
#         self.connect()
#         cursor = self.connection.cursor(cursor_factory=RealDictCursor)
#         try:
#             yield cursor
#             self.connection.commit()
#         except Exception as e:
#             self.connection.rollback()
#             raise e
#         finally:
#             cursor.close()

#     def execute_query(self, query, params=None):
#         with self.get_cursor() as cursor:
#             cursor.execute(sql.SQL(query), params)
#             if cursor.description:
#                 return cursor.fetchall()
#             return None

# Database configuration
DATABASE_URI = DevelopmentConfig.DATABASE_URI
engine = create_engine(
    DATABASE_URI,
    pool_size=int(__import__("os").environ.get("DB_POOL_SIZE", "3")),
    max_overflow=int(__import__("os").environ.get("DB_MAX_OVERFLOW", "0")),
    pool_timeout=int(__import__("os").environ.get("DB_POOL_TIMEOUT", "30")),
    pool_recycle=int(__import__("os").environ.get("DB_POOL_RECYCLE", "1800")),
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_postgres(app):
    Base.metadata.create_all(bind=engine)