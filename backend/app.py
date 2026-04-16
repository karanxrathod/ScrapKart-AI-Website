from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from chat_local import generate_chat_response
from vision_pipeline import predict_scrap


class ChatHistoryItem(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatHistoryItem] = Field(default_factory=list)
    pickup_history: list[dict[str, Any]] = Field(default_factory=list)
    donation_history: list[dict[str, Any]] = Field(default_factory=list)
    image_base64: str | None = None


app = FastAPI(title="ScrapKart AI Local Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

YOLO_WEIGHTS = os.getenv("SCRAPKART_YOLO_WEIGHTS", "runs/scrapkart_yolo/train/weights/best.pt")
CNN_WEIGHTS = os.getenv("SCRAPKART_CNN_WEIGHTS", "runs/scrapkart_cnn_best.pt")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
def chat(request: ChatRequest) -> dict[str, str]:
    try:
        response = generate_chat_response(
            message=request.message,
            history=[item.model_dump() for item in request.history],
            pickup_history=request.pickup_history,
            donation_history=request.donation_history,
            image_base64=request.image_base64,
        )
        return {"response": response}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/analyze-scrap")
async def analyze_scrap(image: UploadFile = File(...)) -> dict[str, Any]:
    suffix = Path(image.filename or "upload.jpg").suffix or ".jpg"

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(await image.read())
            temp_path = temp_file.name

        prediction = predict_scrap(temp_path, yolo_weights=YOLO_WEIGHTS, cnn_weights=CNN_WEIGHTS)
        return {
            "material": prediction.material,
            "confidence": prediction.confidence,
            "conditionFactor": prediction.condition_factor,
            "detectorClass": prediction.detector_class,
            "classifierConfidence": prediction.classifier_confidence,
            "bbox": prediction.bbox,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if "temp_path" in locals() and Path(temp_path).exists():
            Path(temp_path).unlink(missing_ok=True)
