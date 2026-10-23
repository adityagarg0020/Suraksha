import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# On Vercel / serverless environments, the filesystem is read-only except /tmp
if os.environ.get("VERCEL"):
    DATABASE_FILE = "/tmp/evacusafe.db"
else:
    DATABASE_FILE = os.path.join(os.path.dirname(__file__), "..", "evacusafe.db")

raw_db_url = os.environ.get("DATABASE_URL")
if raw_db_url:
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = raw_db_url
else:
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
