<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ScrapKart AI

This contains everything you need to run ScrapKart AI locally.

View your app in AI Studio: https://ai.studio/apps/9925e3c2-81d7-479b-b647-db668d9e5c8d

## Frontend Quick Start

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_LOCAL_API_BASE` in `.env.local` if your backend is not running on `http://127.0.0.1:8000`
3. Run the app:
   `npm run dev`

## Local AI Stack

ScrapKart AI now includes a local backend architecture for:

- YOLOv8 scrap detection
- CNN scrap material classification
- Ollama-hosted local chatbot inference
- FastAPI endpoints for the frontend

Key files:

- [backend/app.py](backend/app.py)
- [backend/vision_pipeline.py](backend/vision_pipeline.py)
- [backend/chat_local.py](backend/chat_local.py)
- [backend/STARTUP_GUIDE.md](backend/STARTUP_GUIDE.md)
- [backend/datasets/scrap_detection/data.yaml](backend/datasets/scrap_detection/data.yaml)

## Backend Quick Start

1. Create and activate a virtual environment
2. Install Python packages:
   `pip install -r backend/requirements.txt`
3. Pull a local Ollama model:
   `ollama pull llama3.1:8b-instruct`
4. Start the backend:
   `uvicorn backend.app:app --reload`

## Training Your Own Models

Use the included dataset template and startup guide:

- Detection dataset config:
  `backend/datasets/scrap_detection/data.yaml`
- Full startup/training guide:
  `backend/STARTUP_GUIDE.md`
