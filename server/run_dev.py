"""Run the API with the embedded pgserver Postgres kept alive in-process."""
import os
from pathlib import Path
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

pg_dir = REPO_ROOT / ".pgserver"
os.environ.setdefault(
    "DATABASE_URL",
    f"postgresql://postgres:@/okada_connect?host={pg_dir}",
)

import pgserver  # noqa: E402

pg = pgserver.get_server(str(pg_dir))  # noqa: F841 (holds the server open)
try:
    pg.psql("CREATE DATABASE okada_connect;")
except Exception:
    pass

import uvicorn  # noqa: E402

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 4000)), reload=False)
