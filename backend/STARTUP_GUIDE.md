# ScrapKart AI Local AI Startup Guide

This guide documents how to train and run the fully local ScrapKart AI stack without AIML, Gemini, or any other hosted inference API.

## Architecture

- Vision detection: YOLOv8 nano fine-tuned on a scrap detection dataset.
- Vision classification: ResNet18-based CNN fine-tuned on cropped scrap material images.
- Local chatbot: Ollama-hosted LLM such as `llama3.1:8b-instruct` or a vision-capable local model such as `gemma3:4b`.
- API layer: FastAPI backend serving the frontend at:
  - `POST /api/analyze-scrap`
  - `POST /api/chat`

## 1. Create the Python environment

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

## 2. Prepare the datasets

### YOLO detection dataset

Use the standard YOLO folder structure:

```text
backend/datasets/scrap_detection/
  data.yaml
  images/
    train/
    val/
  labels/
    train/
    val/
```

The starter config is already included at:

`backend/datasets/scrap_detection/data.yaml`

### CNN classification dataset

Use a standard `ImageFolder`-style layout:

```text
backend/datasets/scrap_classification/
  train/
    Plastic/
    Metal/
    E-Waste/
    Paper/
  val/
    Plastic/
    Metal/
    E-Waste/
    Paper/
```

## 3. Train the local models

Open Python inside the project environment and run:

```python
from backend.vision_pipeline import train_yolo, train_cnn_classifier

train_yolo("backend/datasets/scrap_detection/data.yaml", epochs=50)
train_cnn_classifier("backend/datasets/scrap_classification", epochs=12)
```

Expected outputs:

- YOLO weights:
  `runs/scrapkart_yolo/train/weights/best.pt`
- CNN weights:
  `runs/scrapkart_cnn_best.pt`

## 4. Export for faster CPU inference

After training, export both models to ONNX:

```python
from backend.vision_pipeline import export_models_to_onnx

export_models_to_onnx()
```

This uses:

- `YOLO(...).export(format="onnx", imgsz=640, dynamic=True)`
- `torch.onnx.export(...)` for the CNN classifier

You can later serve those ONNX models with `onnxruntime` for faster CPU-only inference.

## 5. Install and run the local chatbot

Install Ollama and pull a model:

```bash
ollama pull llama3.1:8b-instruct
```

Optional vision-capable local chat model:

```bash
ollama pull gemma3:4b
```

Set environment variables if needed:

```bash
set OLLAMA_BASE_URL=http://127.0.0.1:11434
set OLLAMA_MODEL=llama3.1:8b-instruct
```

## 6. Run the backend server

```bash
uvicorn backend.app:app --reload
```

Optional model path overrides:

```bash
set SCRAPKART_YOLO_WEIGHTS=runs/scrapkart_yolo/train/weights/best.pt
set SCRAPKART_CNN_WEIGHTS=runs/scrapkart_cnn_best.pt
```

Health check:

`GET http://127.0.0.1:8000/health`

## 7. Run the frontend

Set your frontend local backend URL in `.env.local`:

```env
VITE_LOCAL_API_BASE=http://127.0.0.1:8000
```

Then run:

```bash
npm install
npm run dev
```

## 8. Current frontend integration points

- `src/components/Chatbot.tsx`
  calls the local `POST /api/chat`
- `src/pages/ScanScreen.tsx`
  uploads an image file to `POST /api/analyze-scrap`
- `src/pages/Booking.tsx`
  uses the local chat endpoint for nearby center suggestions

## 9. Recommended next improvements

- Cache the YOLO and CNN models in memory at backend startup instead of loading on every request.
- Replace the mock `condition_factor` formula with a learned quality regressor.
- Add a structured response model for local chat suggestions.
- Add a batch offline evaluation script for both detector and classifier accuracy.
