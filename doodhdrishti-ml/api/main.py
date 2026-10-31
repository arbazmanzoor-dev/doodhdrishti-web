"""Step 7: FastAPI service for the web app.

    uvicorn api.main:app --port 8001

POST /predict  (multipart: image, milk_type, farmer_id?, centre_id?)
  -> {verdict, water_pct, starch_pct, confidence, sample_id, created_at}
Returns 503 until a model has been trained, 422 for an unreadable photo.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from src.predict import ModelNotTrained, Predictor

MAX_UPLOAD_BYTES = 10 * 1024 * 1024

app = FastAPI(title="DoodhDrishti ML API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # the React app runs on a different port in development
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
predictor = Predictor()


@app.get("/health")
def health() -> dict:
    try:
        b = predictor.bundle
        return {"status": "ok", "model_version": b["version"], "trained_at": b["trained_at"]}
    except ModelNotTrained as e:
        return {"status": "no_model", "detail": str(e)}


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    milk_type: str = Form("unknown"),
    farmer_id: str | None = Form(None),
    centre_id: str | None = Form(None),
) -> dict:
    raw = await image.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Photo is larger than 10 MB.")
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=422, detail="Could not read this image. Upload a JPG or PNG photo.")
    try:
        result = predictor.predict_image(img, milk_type)
    except ModelNotTrained as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    return {
        **result,
        "sample_id": f"ml-{uuid.uuid4().hex[:12]}",
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
