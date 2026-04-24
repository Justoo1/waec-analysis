from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import parse, qualify

app = FastAPI(
    title="WAEC Analytics Parser",
    description="PDF/XLSX parsing and university qualification engine for WAEC results",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://web:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse.router, prefix="/api/parse", tags=["parsing"])
app.include_router(qualify.router, prefix="/api/qualify", tags=["qualification"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "waec-parser"}
