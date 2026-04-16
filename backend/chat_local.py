from __future__ import annotations

import os
from typing import Any

import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b-instruct")


def _format_history_block(title: str, items: list[dict[str, Any]]) -> str:
    if not items:
        return f"{title}: No data available."

    lines: list[str] = [f"{title}:"]
    for index, item in enumerate(items[:10], start=1):
        lines.append(f"{index}. {item}")
    return "\n".join(lines)


def build_system_prompt(
    pickup_history: list[dict[str, Any]] | None = None,
    donation_history: list[dict[str, Any]] | None = None,
) -> str:
    pickup_history = pickup_history or []
    donation_history = donation_history or []

    return "\n".join(
        [
            "You are ScrapKart AI, a local assistant for recycling, scrap rates, waste management, donation guidance, and pickup help.",
            "Only answer questions related to ScrapKart AI topics.",
            "Use the user pickup and donation history when asked about previous donations, next pickups, booking status, or account activity.",
            "If the answer is not present in the provided history, say so clearly instead of inventing details.",
            "",
            _format_history_block("Pickup history", pickup_history),
            "",
            _format_history_block("Donation history", donation_history),
        ]
    )


def generate_chat_response(
    message: str,
    history: list[dict[str, Any]] | None = None,
    pickup_history: list[dict[str, Any]] | None = None,
    donation_history: list[dict[str, Any]] | None = None,
    image_base64: str | None = None,
) -> str:
    system_prompt = build_system_prompt(pickup_history=pickup_history, donation_history=donation_history)
    messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]

    for item in (history or [])[-10:]:
      role = "assistant" if item.get("role") == "model" else "user"
      content = item.get("text", "")
      if content:
        messages.append({"role": role, "content": content})

    user_message: dict[str, Any] = {"role": "user", "content": message}

    # Images work when your local Ollama model supports vision, e.g. gemma3 or llava.
    if image_base64:
      user_message["images"] = [image_base64]

    messages.append(user_message)

    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
        },
        timeout=180,
    )
    response.raise_for_status()

    data = response.json()
    return data["message"]["content"]
