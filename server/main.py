"""Okada Connect API — FastAPI application entry point."""
import os
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env from repo root (one level above server/).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from config.db import init_db  # noqa: E402  (needs env loaded first)
from controllers.auth import router as auth_router  # noqa: E402
from controllers.customers import router as customer_router  # noqa: E402
from controllers.riders import router as rider_router  # noqa: E402
from controllers.rides import router as rides_router  # noqa: E402
from controllers.users import router as users_router  # noqa: E402
from controllers.wallet import router as wallet_router  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db(app)
    yield


app = FastAPI(title="Okada Connect API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(customer_router)
app.include_router(rider_router)
app.include_router(rides_router)
app.include_router(users_router)
app.include_router(wallet_router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 4000)), reload=False)
